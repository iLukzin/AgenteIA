import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post() create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  @Get() findAll(@Query('status') status?: string) {
    return this.leadsService.findAll(status);
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(id, dto);
  }
}
