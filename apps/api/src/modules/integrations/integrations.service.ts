import { BadRequestException, Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../../common/tenant-prisma.service';
import { EvolutionApiService } from '../../common/evolution-api.service';
import { encrypt, decrypt } from '../../common/crypto.util';
import { SaveWhatsappIntegrationDto } from './dto/save-whatsapp-integration.dto';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly evolutionApi: EvolutionApiService,
  ) {}

  async getWhatsapp() {
    const integration = await this.tenantPrisma.client.integration.findFirst({
      where: { type: 'whatsapp_evolution' },
    });
    if (!integration) return { configured: false as const };

    return {
      configured: true as const,
      instanceName: integration.instanceName,
      status: integration.status,
    };
  }

  async saveWhatsapp(dto: SaveWhatsappIntegrationDto) {
    // Nunca devolvemos a apiKey de volta — uma vez salva, só é possível
    // sobrescrevê-la, não lê-la (mesmo padrão de qualquer secret manager).
    const credentialsEncrypted = encrypt(JSON.stringify({ apiUrl: dto.apiUrl, apiKey: dto.apiKey }));

    const existing = await this.tenantPrisma.client.integration.findFirst({
      where: { type: 'whatsapp_evolution' },
    });

    try {
      if (existing) {
        await this.tenantPrisma.client.integration.update({
          where: { id: existing.id },
          data: {
            instanceName: dto.instanceName,
            credentialsEncrypted,
            // Salvar a URL/API key não significa que o WhatsApp já está
            // conectado — só depois de gerar e escanear o QR code é que
            // sabemos isso de verdade (via getConnectionStatus).
            status: 'disconnected',
          },
        });
      } else {
        await this.tenantPrisma.client.integration.create({
          data: {
            companyId: this.tenantPrisma.companyId,
            type: 'whatsapp_evolution',
            instanceName: dto.instanceName,
            credentialsEncrypted,
            status: 'disconnected',
          },
        });
      }
    } catch (err: any) {
      // instanceName é único globalmente no banco (não só por empresa) —
      // se outra empresa já estiver usando esse mesmo nome, avisa em vez
      // de deixar estourar um erro de banco sem explicação.
      if (err?.code === 'P2002') {
        throw new BadRequestException(
          'Esse nome de instância já está em uso por outra empresa. Escolha um nome diferente (ex: o nome da sua empresa, sem espaços).',
        );
      }
      throw err;
    }

    return this.getWhatsapp();
  }

  async generateQrCode(webhookUrl?: string) {
    const integration = await this.tenantPrisma.client.integration.findFirst({
      where: { type: 'whatsapp_evolution' },
    });
    if (!integration) {
      throw new BadRequestException('Salve a URL e a API key antes de gerar o QR code.');
    }

    const { apiUrl, apiKey } = JSON.parse(decrypt(integration.credentialsEncrypted));

    let result: { base64?: string; pairingCode?: string };
    try {
      result = await this.evolutionApi.createOrConnectInstance(
        apiUrl,
        apiKey,
        integration.instanceName!,
      );
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Erro ao gerar o QR code.');
    }

    if (!result.base64) {
      throw new BadRequestException(
        'A Evolution API não retornou um QR code. Confira a URL e a API key, ou tente de novo em alguns segundos.',
      );
    }

    await this.tenantPrisma.client.integration.update({
      where: { id: integration.id },
      data: { status: 'pending' },
    });

    // Aproveita o momento para já configurar o webhook também — se
    // falhar, não impede de mostrar o QR code (a pessoa ainda
    // consegue conectar o WhatsApp), só avisa que esse passo
    // específico não funcionou.
    let webhookConfigured = false;
    let webhookError: string | undefined;
    if (webhookUrl) {
      try {
        await this.evolutionApi.setWebhook(apiUrl, apiKey, integration.instanceName!, webhookUrl);
        webhookConfigured = true;
      } catch (err: any) {
        webhookError = err.message;
      }
    }

    return {
      qrCodeBase64: result.base64,
      pairingCode: result.pairingCode,
      webhookConfigured,
      webhookError,
    };
  }

  // Reconfigura só o webhook, sem tocar na conexão — útil quando o
  // WhatsApp já está conectado, mas o webhook nunca foi configurado
  // (ex: instância criada antes dessa automação existir).
  async configureWebhook(webhookUrl: string) {
    const integration = await this.tenantPrisma.client.integration.findFirst({
      where: { type: 'whatsapp_evolution' },
    });
    if (!integration) {
      throw new BadRequestException('Salve a URL e a API key antes de configurar o webhook.');
    }

    const { apiUrl, apiKey } = JSON.parse(decrypt(integration.credentialsEncrypted));

    try {
      await this.evolutionApi.setWebhook(apiUrl, apiKey, integration.instanceName!, webhookUrl);
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Erro ao configurar o webhook.');
    }

    return { webhookConfigured: true };
  }

  async getConnectionStatus() {
    const integration = await this.tenantPrisma.client.integration.findFirst({
      where: { type: 'whatsapp_evolution' },
    });
    if (!integration) return { configured: false as const };

    const { apiUrl, apiKey } = JSON.parse(decrypt(integration.credentialsEncrypted));
    const { state } = await this.evolutionApi.getConnectionState(
      apiUrl,
      apiKey,
      integration.instanceName!,
    );

    const status = state === 'open' ? 'connected' : state === 'connecting' ? 'pending' : 'disconnected';

    if (status !== integration.status) {
      await this.tenantPrisma.client.integration.update({
        where: { id: integration.id },
        data: { status },
      });
    }

    return { configured: true as const, instanceName: integration.instanceName, status };
  }
}
