import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../common/tenant-prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  create(dto: CreateEmployeeDto) {
    return this.tenantPrisma.client.employee.create({
      data: { ...dto, companyId: this.tenantPrisma.companyId },
    });
  }

  findAll() {
    return this.tenantPrisma.client.employee.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const employee = await this.tenantPrisma.client.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException('Funcionário não encontrado');
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);
    return this.tenantPrisma.client.employee.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.tenantPrisma.client.employee.update({ where: { id }, data: { active: false } });
  }
}
