import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OpenAiService } from '../openai/openai.service';
import { PrismaService } from '../../prisma/prisma.service';

/** Formata um vetor JS como literal de texto que o pgvector aceita no cast ::vector — ex: "[0.12,-0.4,...]". */
function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(private readonly openai: OpenAiService) {}

  /**
   * Divide um texto em trechos de até `maxChars`, tentando respeitar
   * parágrafos. É uma aproximação simples por caracteres (não por
   * tokens) — suficiente para o tamanho de conteúdo que um painel de
   * "base de conhecimento" de uma PME costuma receber.
   */
  chunkText(text: string, maxChars = 1000): string[] {
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    const chunks: string[] = [];
    let current = '';

    for (const paragraph of paragraphs) {
      if (paragraph.length > maxChars) {
        if (current) {
          chunks.push(current.trim());
          current = '';
        }
        for (let i = 0; i < paragraph.length; i += maxChars) {
          chunks.push(paragraph.slice(i, i + maxChars));
        }
        continue;
      }

      const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
      if (candidate.length > maxChars) {
        chunks.push(current.trim());
        current = paragraph;
      } else {
        current = candidate;
      }
    }

    if (current) chunks.push(current.trim());
    return chunks.length > 0 ? chunks : [text.slice(0, maxChars)];
  }

  /**
   * Gera os embeddings ANTES de tocar no banco (cada chamada à OpenAI
   * pode levar um pouco), e só então grava tudo de uma vez.
   *
   * Recebe `tx` — o client transacional JÁ ABERTO pelo
   * TenantRlsInterceptor para esta requisição — em vez de abrir sua
   * própria transação. Isso é necessário porque o registro do
   * documento (criado em DocumentsService.create, na mesma transação
   * de requisição) ainda não foi confirmado no banco nesse ponto; uma
   * transação nova e separada não conseguiria ver esse documento
   * ainda, e a gravação dos trechos falharia por violar a chave
   * estrangeira para document_id.
   */
  async indexDocument(
    tx: Prisma.TransactionClient,
    companyId: string,
    documentId: string,
    content: string,
  ): Promise<number> {
    const chunks = this.chunkText(content);
    const embeddings: number[][] = [];

    for (const chunk of chunks) {
      embeddings.push(await this.openai.embed(chunk));
    }

    for (let i = 0; i < chunks.length; i++) {
      const dbChunk = await tx.documentChunk.create({
        data: {
          companyId,
          documentId,
          chunkIndex: i,
          content: chunks[i],
          tokenCount: Math.ceil(chunks[i].length / 4),
        },
      });

      await tx.$executeRaw`
        INSERT INTO embeddings (company_id, chunk_id, embedding)
        VALUES (${companyId}::uuid, ${dbChunk.id}::uuid, ${toVectorLiteral(embeddings[i])}::vector)
      `;
    }

    this.logger.log(`Documento ${documentId} indexado com ${chunks.length} trecho(s).`);
    return chunks.length;
  }

  /** Busca os trechos mais relevantes para um embedding de pergunta, restrito ao tenant. */
  async retrieveRelevantChunks(
    prisma: PrismaService,
    companyId: string,
    queryEmbedding: number[],
    topK = 5,
  ): Promise<string[]> {
    const vectorLiteral = toVectorLiteral(queryEmbedding);

    const rows = await prisma.runInTenant(companyId, (tx) =>
      tx.$queryRaw<{ content: string }[]>`
        SELECT dc.content
        FROM document_chunks dc
        JOIN embeddings e ON e.chunk_id = dc.id
        WHERE dc.company_id = ${companyId}::uuid
        ORDER BY e.embedding <=> ${vectorLiteral}::vector
        LIMIT ${topK}
      `,
    );

    return rows.map((r) => r.content);
  }
}
