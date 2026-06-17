import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { TenantPrismaService } from '../../common/tenant-prisma.service';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService, TenantPrismaService],
})
export class ServicesModule {}
