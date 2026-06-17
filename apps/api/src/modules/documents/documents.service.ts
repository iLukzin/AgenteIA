import { Injectable, Logger } from '@nestjs/common';
import { TenantPrismaService } from '../../common/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RagService } from '../rag/rag.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly prisma: PrismaService,
    private readonly rag: RagService,
  ) {}

  async create(dto: CreateDocumentDto) {
    const companyId = this.tenantPrisma.companyId;

    const document = await this.tenantPrisma.client.document.create({
      data: {
        filename: dto.filename,
        fileType: 'text',
        storagePath: 'inline', // não há storage real ainda — texto vive só como chunks indexados
        status: 'processing',
        companyId,
        uploadedBy: this.tenantPrisma.userId,
      },
    });

    // Gera os embeddings de forma síncrona — tudo bem para o tamanho de
    // texto que cabe num campo de "colar conteúdo" no painel. Para
    // arquivos grandes, mover isso para um worker em background.
    try {
      await this.rag.indexDocument(this.prisma, companyId, document.id, dto.content);
      return this.tenantPrisma.client.document.update({
        where: { id: document.id },
        data: { status: 'ready' },
      });
    } catch (err) {
      this.logger.error(`Falha ao indexar documento ${document.id}`, err as Error);
      return this.tenantPrisma.client.document.update({
        where: { id: document.id },
        data: { status: 'failed' },
      });
    }
  }

  findAll() {
    return this.tenantPrisma.client.document.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
