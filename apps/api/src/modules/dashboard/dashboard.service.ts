import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../../common/tenant-prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async summary() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [
      openConversations,
      appointmentsThisWeek,
      totalCustomers,
      leadsByStatus,
    ] = await Promise.all([
      this.tenantPrisma.client.conversation.count({ where: { status: 'open' } }),
      this.tenantPrisma.client.appointment.count({
        where: { scheduledAt: { gte: startOfWeek } },
      }),
      this.tenantPrisma.client.customer.count(),
      this.tenantPrisma.client.lead.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    const totalLeads = leadsByStatus.reduce((sum, row) => sum + row._count._all, 0);
    const wonLeads = leadsByStatus.find((row) => row.status === 'won')?._count._all ?? 0;
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    return {
      openConversations,
      appointmentsThisWeek,
      totalCustomers,
      totalLeads,
      conversionRate,
      leadsByStatus: leadsByStatus.map((row) => ({
        status: row.status,
        count: row._count._all,
      })),
    };
  }
}
