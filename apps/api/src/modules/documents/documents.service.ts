import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../common/tenant-prisma.service';
import { RagService } from '../rag/rag.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly rag: RagService,
  ) {}

  async create(dto: CreateDocumentDto) {
    const companyId = this.tenantPrisma.companyId;

    let document;
    try {
      document = await this.tenantPrisma.client.document.create({
        data: {
          filename: dto.filename,
          fileType: 'text',
          storagePath: 'inline', // não há storage real ainda — texto vive só como chunks indexados
          status: 'processing',
          companyId,
          uploadedBy: this.tenantPrisma.userId,
        },
      });
    } catch (err) {
      this.logger.error('Falha ao criar o registro do documento', err as Error);
      throw new InternalServerErrorException(
        'Não foi possível salvar este documento. Tente de novo em alguns instantes.',
      );
    }

    return this.indexAndFinalize(document.id, companyId, dto.content);
  }

  findAll() {
    return this.tenantPrisma.client.document.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * O conteúdo original não fica salvo em lugar nenhum como texto
   * único — só existe espalhado nos trechos já indexados. Pra
   * preencher o formulário de edição, reconstruímos juntando os
   * trechos na ordem em que foram divididos.
   */
  async findOne(id: string) {
    const document = await this.tenantPrisma.client.document.findUnique({
      where: { id },
      include: { chunks: { orderBy: { chunkIndex: 'asc' } } },
    });
    if (!document) {
      throw new NotFoundException('Documento não encontrado.');
    }

    return {
      id: document.id,
      filename: document.filename,
      status: document.status,
      content: document.chunks.map((c) => c.content).join('\n\n'),
    };
  }

  async update(id: string, dto: CreateDocumentDto) {
    const companyId = this.tenantPrisma.companyId;

    const existing = await this.tenantPrisma.client.document.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Documento não encontrado.');
    }

    try {
      await this.tenantPrisma.client.document.update({
        where: { id },
        data: { filename: dto.filename, status: 'processing' },
      });
      // Os trechos antigos não servem mais — o conteúdo mudou, então
      // é mais simples e mais confiável apagar tudo e reindexar do
      // zero do que tentar "remendar" os trechos existentes.
      // onDelete: Cascade no banco já cuida dos embeddings junto.
      await this.tenantPrisma.client.documentChunk.deleteMany({ where: { documentId: id } });
    } catch (err) {
      this.logger.error(`Falha ao preparar reindexação do documento ${id}`, err as Error);
      throw new InternalServerErrorException('Não foi possível atualizar este documento.');
    }

    return this.indexAndFinalize(id, companyId, dto.content);
  }

  /**
   * Gera os embeddings (chamada à OpenAI, fora de qualquer transação)
   * e grava os trechos, atualizando o status para "ready" ou "failed"
   * ao final — usado tanto na criação quanto na edição de um documento.
   */
  private async indexAndFinalize(documentId: string, companyId: string, content: string) {
    try {
      await this.rag.indexDocument(this.tenantPrisma.client, companyId, documentId, content);
      return this.tenantPrisma.client.document.update({
        where: { id: documentId },
        data: { status: 'ready' },
      });
    } catch (err) {
      this.logger.error(`Falha ao indexar documento ${documentId}`, err as Error);
      return this.tenantPrisma.client.document.update({
        where: { id: documentId },
        data: { status: 'failed' },
      });
    }
  }

  async delete(id: string) {
    try {
      // onDelete: Cascade no banco cuida dos chunks e embeddings junto.
      await this.tenantPrisma.client.document.delete({ where: { id } });
      return { deleted: true };
    } catch (err: any) {
      if (err?.code === 'P2025') {
        throw new NotFoundException('Documento não encontrado.');
      }
      this.logger.error(`Falha ao excluir documento ${id}`, err as Error);
      throw new InternalServerErrorException('Não foi possível excluir este documento.');
    }
  }
}
