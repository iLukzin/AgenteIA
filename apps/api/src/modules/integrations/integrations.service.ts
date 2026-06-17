import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../../common/tenant-prisma.service';
import { encrypt } from '../../common/crypto.util';
import { SaveWhatsappIntegrationDto } from './dto/save-whatsapp-integration.dto';

@Injectable()
export class IntegrationsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

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

    if (existing) {
      await this.tenantPrisma.client.integration.update({
        where: { id: existing.id },
        data: {
          instanceName: dto.instanceName,
          credentialsEncrypted,
          status: 'connected',
        },
      });
    } else {
      await this.tenantPrisma.client.integration.create({
        data: {
          companyId: this.tenantPrisma.companyId,
          type: 'whatsapp_evolution',
          instanceName: dto.instanceName,
          credentialsEncrypted,
          status: 'connected',
        },
      });
    }

    return this.getWhatsapp();
  }
}
