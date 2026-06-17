import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TenantPrismaService } from '../../common/tenant-prisma.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, TenantPrismaService],
})
export class DashboardModule {}
