import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../common/tenant-prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { AppointmentConflictError, createAppointmentWithOverlapCheck } from './appointments.logic';

@Injectable()
export class AppointmentsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async create(dto: CreateAppointmentDto) {
    try {
      return await createAppointmentWithOverlapCheck(
        this.tenantPrisma.client,
        this.tenantPrisma.companyId,
        dto,
      );
    } catch (err) {
      if (err instanceof AppointmentConflictError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  findAll(from?: string, to?: string) {
    return this.tenantPrisma.client.appointment.findMany({
      where: {
        scheduledAt: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: { customer: true, service: true, employee: true },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const appointment = await this.tenantPrisma.client.appointment.findUnique({
      where: { id },
      include: { customer: true, service: true, employee: true },
    });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    return appointment;
  }

  async updateStatus(id: string, dto: UpdateAppointmentStatusDto) {
    await this.findOne(id);
    return this.tenantPrisma.client.appointment.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
