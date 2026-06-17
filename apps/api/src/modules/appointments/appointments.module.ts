import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { TenantPrismaService } from '../../common/tenant-prisma.service';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService, TenantPrismaService],
})
export class AppointmentsModule {}
