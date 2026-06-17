import { Body, Controller, Logger, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AgentService } from './agent.service';

@Controller('webhooks/whatsapp')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(private readonly agentService: AgentService) {}

  @Public()
  @Post()
  async receive(@Body() payload: any, @Res() res: Response) {
    // Responde 200 imediatamente — a Evolution API costuma re-tentar o
    // webhook se demorar ou se receber erro, e o processamento (que
    // chama a OpenAI) pode levar alguns segundos. Erros no processamento
    // ficam só no log do servidor por enquanto.
    res.status(200).json({ received: true });

    const event = payload?.event;
    const instance = payload?.instance;

    // Registra a chegada de TODO evento, mesmo os que não tratamos —
    // sem isso, "a mensagem nunca chegou" e "a mensagem chegou mas foi
    // ignorada por algum filtro" ficam indistinguíveis no log.
    this.logger.log(`Evento recebido: "${event}" da instância "${instance}".`);

    if (event === 'messages.upsert') {
      this.agentService.handleIncomingMessage(payload).catch((err) => {
        console.error('Erro ao processar mensagem do WhatsApp:', err);
      });
    } else if (event === 'connection.update') {
      this.agentService.handleConnectionUpdate(payload).catch((err) => {
        console.error('Erro ao processar atualização de conexão do WhatsApp:', err);
      });
    }
  }
}
