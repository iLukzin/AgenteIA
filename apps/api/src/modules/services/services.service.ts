import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../common/tenant-prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  create(dto: CreateServiceDto) {
    return this.tenantPrisma.client.service.create({
      data: { ...dto, companyId: this.tenantPrisma.companyId },
    });
  }

  findAll() {
    return this.tenantPrisma.client.service.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const service = await this.tenantPrisma.client.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Serviço não encontrado');
    return service;
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);
    return this.tenantPrisma.client.service.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    // soft delete — mantém histórico de agendamentos que referenciam o serviço
    return this.tenantPrisma.client.service.update({
      where: { id },
      data: { active: false },
    });
  }
}
