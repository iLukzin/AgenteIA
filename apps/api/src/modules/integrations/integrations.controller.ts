import { Body, Controller, Get, Put } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { SaveWhatsappIntegrationDto } from './dto/save-whatsapp-integration.dto';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('whatsapp')
  getWhatsapp() {
    return this.integrationsService.getWhatsapp();
  }

  @Put('whatsapp')
  saveWhatsapp(@Body() dto: SaveWhatsappIntegrationDto) {
    return this.integrationsService.saveWhatsapp(dto);
  }
}
