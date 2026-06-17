import { Prisma } from '@prisma/client';

export interface AppointmentInput {
  customerId: string;
  serviceId?: string;
  employeeId?: string;
  scheduledAt: string | Date;
  durationMinutes?: number;
  notes?: string;
}

export class AppointmentConflictError extends Error {}

/**
 * Cria um agendamento checando antes se o profissional já não tem outro
 * compromisso no mesmo horário. Recebe o `tx` diretamente (em vez de
 * depender de um service com tenant injetado) para poder ser chamada
 * tanto pelo AppointmentsService (dentro da transação do
 * TenantRlsInterceptor) quanto pelo AgentService (dentro de uma
 * transação curta aberta via PrismaService.runInTenant).
 */
export async function createAppointmentWithOverlapCheck(
  tx: Prisma.TransactionClient,
  companyId: string,
  input: AppointmentInput,
) {
  const durationMinutes = input.durationMinutes ?? 30;
  const scheduledAt = new Date(input.scheduledAt);
  const scheduledEnd = new Date(scheduledAt.getTime() + durationMinutes * 60_000);

  if (input.employeeId) {
    const dayStart = new Date(scheduledAt);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(scheduledAt);
    dayEnd.setHours(23, 59, 59, 999);

    const sameDayAppointments = await tx.appointment.findMany({
      where: {
        employeeId: input.employeeId,
        status: { not: 'cancelled' },
        scheduledAt: { gte: dayStart, lte: dayEnd },
      },
    });

    const hasOverlap = sameDayAppointments.some((appt) => {
      const apptStart = appt.scheduledAt.getTime();
      const apptEnd = apptStart + appt.durationMinutes * 60_000;
      return scheduledAt.getTime() < apptEnd && scheduledEnd.getTime() > apptStart;
    });

    if (hasOverlap) {
      throw new AppointmentConflictError(
        'Este profissional já tem um agendamento nesse horário.',
      );
    }
  }

  return tx.appointment.create({
    data: {
      companyId,
      customerId: input.customerId,
      serviceId: input.serviceId,
      employeeId: input.employeeId,
      scheduledAt,
      durationMinutes,
      notes: input.notes,
    },
  });
}
