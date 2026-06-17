import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { TenantPrismaService } from '../../common/tenant-prisma.service';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService, TenantPrismaService],
})
export class CompaniesModule {}
