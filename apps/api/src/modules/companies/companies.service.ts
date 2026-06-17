import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../../common/tenant-prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  findMe() {
    return this.tenantPrisma.client.company.findUnique({
      where: { id: this.tenantPrisma.companyId },
      include: { plan: true },
    });
  }

  updateMe(dto: UpdateCompanyDto) {
    return this.tenantPrisma.client.company.update({
      where: { id: this.tenantPrisma.companyId },
      data: dto,
    });
  }
}
