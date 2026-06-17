import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { TenantPrismaService } from '../../common/tenant-prisma.service';
import { EvolutionApiService } from '../../common/evolution-api.service';

@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationsService, TenantPrismaService, EvolutionApiService],
})
export class IntegrationsModule {}
