import { Injectable, Logger } from '@nestjs/common';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

/**
 * Chamadas diretas à API REST da OpenAI via fetch — sem o SDK oficial,
 * de propósito, pra não depender de uma versão de pacote que eu não
 * consigo instalar/testar neste ambiente. Troque os nomes dos modelos
 * em OPENAI_CHAT_MODEL/OPENAI_EMBEDDING_MODEL no .env quando quiser
 * usar outro — confira os modelos disponíveis em platform.openai.com.
 */
@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly apiKey = process.env.OPENAI_API_KEY;
  private readonly chatModel = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';
  private readonly embeddingModel =
    process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<any> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY não configurada no .env da API.');
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.chatModel,
        messages,
        ...(tools ? { tools, tool_choice: 'auto' } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`OpenAI chat completions falhou (${res.status}): ${body}`);
      throw new Error(`Falha ao chamar a OpenAI (chat): ${res.status}`);
    }

    return res.json();
  }

  async embed(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY não configurada no .env da API.');
    }

    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.embeddingModel, input: text }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`OpenAI embeddings falhou (${res.status}): ${body}`);
      throw new Error(`Falha ao chamar a OpenAI (embeddings): ${res.status}`);
    }

    const data = await res.json();
    return data.data[0].embedding;
  }
}
