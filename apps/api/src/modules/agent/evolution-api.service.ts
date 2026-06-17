import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EvolutionApiService {
  private readonly logger = new Logger(EvolutionApiService.name);

  async sendText(apiUrl: string, apiKey: string, instanceName: string, phone: string, text: string) {
    const url = `${apiUrl.replace(/\/$/, '')}/message/sendText/${instanceName}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        body: JSON.stringify({ number: phone, text }),
      });

      if (!res.ok) {
        this.logger.error(
          `Falha ao enviar mensagem via Evolution API (${res.status}): ${await res.text()}`,
        );
      }
    } catch (err) {
      this.logger.error('Erro de rede ao chamar a Evolution API', err as Error);
    }
  }
}
