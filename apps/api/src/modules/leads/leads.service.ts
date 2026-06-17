import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../common/tenant-prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  create(dto: CreateLeadDto) {
    return this.tenantPrisma.client.lead.create({
      data: { ...dto, companyId: this.tenantPrisma.companyId },
    });
  }

  findAll(status?: string) {
    return this.tenantPrisma.client.lead.findMany({
      where: status ? { status } : undefined,
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const lead = await this.tenantPrisma.client.lead.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!lead) throw new NotFoundException('Lead não encontrado');
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto) {
    await this.findOne(id);
    return this.tenantPrisma.client.lead.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
    });
  }
}
