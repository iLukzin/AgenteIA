import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { TenantPrismaService } from '../../common/tenant-prisma.service';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, TenantPrismaService],
})
export class LeadsModule {}
