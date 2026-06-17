import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { TenantPrismaService } from '../../common/tenant-prisma.service';

@Module({
  controllers: [ConversationsController],
  providers: [ConversationsService, TenantPrismaService],
})
export class ConversationsModule {}
