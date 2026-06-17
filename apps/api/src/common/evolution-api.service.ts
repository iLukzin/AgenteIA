import { Injectable, Logger } from '@nestjs/common';

interface QrCodeResult {
  base64?: string;
  pairingCode?: string;
}

@Injectable()
export class EvolutionApiService {
  private readonly logger = new Logger(EvolutionApiService.name);

  async sendText(apiUrl: string, apiKey: string, instanceName: string, phone: string, text: string) {
    const url = `${this.normalize(apiUrl)}/message/sendText/${instanceName}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        body: JSON.stringify({ number: phone, text }),
        signal: AbortSignal.timeout(15000),
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

  /**
   * Garante que a instância existe e devolve um QR code para conectar.
   * Tenta criar primeiro — se a instância já existir, a Evolution API
   * recusa a criação, então caímos para /instance/connect, que é o
   * caminho certo para (re)gerar o QR code de uma instância já criada
   * antes (ex: reconectar depois de um logout do WhatsApp).
   */
  async createOrConnectInstance(
    apiUrl: string,
    apiKey: string,
    instanceName: string,
  ): Promise<QrCodeResult> {
    const base = this.normalize(apiUrl);

    let createRes: Response;
    try {
      createRes = await fetch(`${base}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: apiKey },
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        }),
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      throw new Error(
        'Não foi possível conectar à Evolution API. Confira se a URL está correta e acessível.',
      );
    }

    if (createRes.ok) {
      const data = await createRes.json();
      const qr = this.extractQrCode(data);
      if (qr.base64) return qr;
      // Instância criada mas sem QR ainda (alguns deploys demoram um
      // instante) — tenta o /connect imediatamente como fallback.
    }

    let connectRes: Response;
    try {
      connectRes = await fetch(`${base}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: { apikey: apiKey },
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      throw new Error(
        'Não foi possível conectar à Evolution API. Confira se a URL está correta e acessível.',
      );
    }

    if (!connectRes.ok) {
      const body = await connectRes.text().catch(() => '');
      throw new Error(
        `A Evolution API recusou a conexão (${connectRes.status}). Confira a API key e o nome da instância. ${body}`.trim(),
      );
    }

    const data = await connectRes.json();
    return this.extractQrCode(data);
  }

  async getConnectionState(
    apiUrl: string,
    apiKey: string,
    instanceName: string,
  ): Promise<{ state: string }> {
    const base = this.normalize(apiUrl);
    try {
      const res = await fetch(`${base}/instance/connectionState/${instanceName}`, {
        headers: { apikey: apiKey },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return { state: 'unknown' };
      const data = await res.json();
      const state = data?.instance?.state ?? data?.state ?? 'unknown';
      return { state };
    } catch {
      return { state: 'unknown' };
    }
  }

  private normalize(apiUrl: string): string {
    return apiUrl.replace(/\/$/, '');
  }

  // O formato da resposta varia entre /instance/create (qrcode.base64
  // aninhado) e /instance/connect (base64 direto na raiz) — então
  // checamos os dois formatos possíveis.
  private extractQrCode(data: any): QrCodeResult {
    return {
      base64: data?.qrcode?.base64 ?? data?.base64,
      pairingCode: data?.qrcode?.pairingCode ?? data?.pairingCode,
    };
  }
}
