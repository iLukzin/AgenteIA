import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { EvolutionApiService } from './evolution-api.service';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';
import { RagModule } from '../rag/rag.module';
import { OpenaiModule } from '../openai/openai.module';

@Module({
  imports: [RagModule, OpenaiModule],
  controllers: [WhatsappWebhookController],
  providers: [AgentService, EvolutionApiService],
})
export class AgentModule {}
