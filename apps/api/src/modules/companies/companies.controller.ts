import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  findMe() {
    return this.companiesService.findMe();
  }

  @Patch('me')
  updateMe(@Body() dto: UpdateCompanyDto) {
    return this.companiesService.updateMe(dto);
  }
}
