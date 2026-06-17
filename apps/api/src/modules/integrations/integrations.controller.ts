import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { SaveWhatsappIntegrationDto } from './dto/save-whatsapp-integration.dto';
import { ConfigureWebhookDto } from './dto/configure-webhook.dto';
import { GenerateQrCodeDto } from './dto/generate-qrcode.dto';

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

  // Gera (ou regenera) o QR code para escanear no celular. Recebe a
  // URL do webhook do próprio frontend (o backend não sabe o próprio
  // endereço público) e já tenta configurá-la na Evolution API.
  @Post('whatsapp/qrcode')
  generateQrCode(@Body() dto: GenerateQrCodeDto) {
    return this.integrationsService.generateQrCode(dto?.webhookUrl);
  }

  // Reconfigura só o webhook, sem precisar gerar QR code de novo —
  // para quem já está conectado mas nunca teve o webhook configurado.
  @Post('whatsapp/webhook')
  configureWebhook(@Body() dto: ConfigureWebhookDto) {
    return this.integrationsService.configureWebhook(dto.webhookUrl);
  }

  // O painel chama isso periodicamente enquanto o QR code está na
  // tela, para saber quando o celular terminou de escanear.
  @Get('whatsapp/status')
  getStatus() {
    return this.integrationsService.getConnectionStatus();
  }
}
