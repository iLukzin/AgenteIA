import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PlatformAdminService } from './platform-admin.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyAdminDto } from './dto/update-company-admin.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlatformRoute } from '../../common/decorators/platform-route.decorator';
import { PlatformAdminGuard } from '../../common/guards/platform-admin.guard';

@PlatformRoute()
@UseGuards(PlatformAdminGuard)
@Controller('platform-admin')
export class PlatformAdminController {
  constructor(private readonly platformAdminService: PlatformAdminService) {}

  @Get('companies')
  listCompanies() {
    return this.platformAdminService.listCompanies();
  }

  @Post('companies')
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.platformAdminService.createCompany(dto);
  }

  @Patch('companies/:id')
  updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyAdminDto) {
    return this.platformAdminService.updateCompany(id, dto);
  }

  @Get('plans')
  listPlans() {
    return this.platformAdminService.listPlans();
  }

  @Post('plans')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.platformAdminService.createPlan(dto);
  }

  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.platformAdminService.updatePlan(id, dto);
  }
}
