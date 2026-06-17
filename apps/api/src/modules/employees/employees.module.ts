import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { TenantPrismaService } from '../../common/tenant-prisma.service';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService, TenantPrismaService],
})
export class EmployeesModule {}
