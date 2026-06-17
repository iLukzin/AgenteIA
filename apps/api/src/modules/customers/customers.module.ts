import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { TenantPrismaService } from '../../common/tenant-prisma.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, TenantPrismaService],
})
export class CustomersModule {}
