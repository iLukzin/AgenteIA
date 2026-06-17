import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../common/tenant-prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  create(dto: CreateCustomerDto) {
    return this.tenantPrisma.client.customer.create({
      data: { ...dto, companyId: this.tenantPrisma.companyId },
    });
  }

  findAll(search?: string) {
    return this.tenantPrisma.client.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { lastInteractionAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const customer = await this.tenantPrisma.client.customer.findUnique({
      where: { id },
      include: {
        appointments: { orderBy: { scheduledAt: 'desc' }, take: 10 },
        leads: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);
    return this.tenantPrisma.client.customer.update({ where: { id }, data: dto });
  }
}
