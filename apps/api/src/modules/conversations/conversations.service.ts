import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../common/tenant-prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  findAll(status?: string) {
    return this.tenantPrisma.client.conversation.findMany({
      where: status ? { status } : undefined,
      include: { customer: true },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  }

  async findMessages(conversationId: string) {
    const conversation = await this.tenantPrisma.client.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversa não encontrada');

    return this.tenantPrisma.client.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
