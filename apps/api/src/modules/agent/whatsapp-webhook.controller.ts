import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AgentService } from './agent.service';

@Controller('webhooks/whatsapp')
export class WhatsappWebhookController {
  constructor(private readonly agentService: AgentService) {}

  @Public()
  @Post()
  async receive(@Body() payload: any, @Res() res: Response) {
    // Responde 200 imediatamente — a Evolution API costuma re-tentar o
    // webhook se demorar ou se receber erro, e o processamento (que
    // chama a OpenAI) pode levar alguns segundos. Erros no processamento
    // ficam só no log do servidor por enquanto.
    res.status(200).json({ received: true });

    this.agentService.handleIncomingMessage(payload).catch((err) => {
      console.error('Erro ao processar mensagem do WhatsApp:', err);
    });
  }
}
