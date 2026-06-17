import { Body, Controller, Get, Post, Put } from '@nestjs/common';
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

  // Gera (ou regenera) o QR code para escanear no celular.
  @Post('whatsapp/qrcode')
  generateQrCode() {
    return this.integrationsService.generateQrCode();
  }

  // O painel chama isso periodicamente enquanto o QR code está na
  // tela, para saber quando o celular terminou de escanear.
  @Get('whatsapp/status')
  getStatus() {
    return this.integrationsService.getConnectionStatus();
  }
}
