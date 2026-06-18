import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenAiService, ChatMessage, ToolDefinition } from '../openai/openai.service';
import { RagService } from '../rag/rag.service';
import { EvolutionApiService } from '../../common/evolution-api.service';
import { decrypt } from '../../common/crypto.util';
import { phoneFromRemoteJid } from '../../common/phone.util';
import { isWithinBusinessHours } from '../../common/business-hours.util';
import {
  AppointmentConflictError,
  createAppointmentWithOverlapCheck,
} from '../appointments/appointments.logic';

interface CompanyLookupRow {
  company_id: string;
  whatsapp_number: string | null;
  name: string;
  ai_personality: string;
  greeting_message: string | null;
  away_message: string | null;
  closing_message: string | null;
  handoff_message: string | null;
  business_hours: Record<string, { abre: string; fecha: string } | null> | null;
  credentials_encrypted: string;
}

interface ServiceRow {
  id: string;
  name: string;
  price: any;
  durationMinutes: number;
}

const PERSONALITY_INSTRUCTIONS: Record<string, string> = {
  formal: 'Use um tom formal, respeitoso e direto, evitando gírias.',
  profissional: 'Use um tom profissional e cordial, claro e objetivo.',
  amigavel: 'Use um tom amigável e caloroso, como se estivesse falando com um conhecido.',
  premium: 'Use um tom sofisticado e atencioso, transmitindo exclusividade no atendimento.',
  consultiva:
    'Adote uma postura consultiva: faça perguntas para entender bem a necessidade antes de sugerir algo.',
};

const TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'create_appointment',
      description:
        'Agenda um horário para o cliente atual. Só use depois de confirmar com o cliente o serviço (se houver) e a data/hora exatas.',
      parameters: {
        type: 'object',
        properties: {
          serviceName: {
            type: 'string',
            description: 'Nome do serviço, exatamente como aparece na lista de serviços disponíveis.',
          },
          employeeName: {
            type: 'string',
            description: 'Nome do profissional, se o cliente pediu alguém específico.',
          },
          scheduledAt: {
            type: 'string',
            description: 'Data e hora em ISO 8601, ex: 2026-06-20T14:00:00-03:00',
          },
          durationMinutes: {
            type: 'number',
            description: 'Duração em minutos, se diferente do padrão do serviço.',
          },
        },
        required: ['scheduledAt'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_lead',
      description:
        'Registra uma oportunidade de venda quando o cliente demonstra interesse mas ainda não fechou negócio.',
      parameters: {
        type: 'object',
        properties: {
          notes: { type: 'string', description: 'Resumo do que o cliente está buscando.' },
          estimatedValue: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_human_handoff',
      description:
        'Transfere a conversa para um atendente humano quando você não conseguir ajudar ou o cliente pedir explicitamente para falar com uma pessoa.',
      parameters: {
        type: 'object',
        properties: { reason: { type: 'string' } },
      },
    },
  },
];

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openai: OpenAiService,
    private readonly rag: RagService,
    private readonly evolutionApi: EvolutionApiService,
  ) {}

  async handleIncomingMessage(rawPayload: any): Promise<void> {
    if (rawPayload?.event !== 'messages.upsert') return; // ignora outros tipos de evento
    const data = rawPayload?.data;
    if (!data || data.key?.fromMe) {
      if (data?.key?.fromMe) this.logger.log('Mensagem ignorada: foi enviada pelo próprio número conectado (eco).');
      return;
    }

    const instanceName: string | undefined = rawPayload?.instance;
    const text: string | undefined =
      data.message?.conversation || data.message?.extendedTextMessage?.text;
    const remoteJid: string | undefined = data.key?.remoteJid;

    if (!instanceName || !text || !remoteJid) {
      this.logger.warn('Mensagem ignorada: faltou instanceName, texto ou remoteJid no payload (provavelmente não é uma mensagem de texto).');
      return; // por enquanto só tratamos mensagens de texto
    }

    // JIDs de grupo sempre terminam em "@g.us" (diferente de uma conversa
    // individual, que termina em "@s.whatsapp.net"). O agente não deve
    // responder dentro de grupos — só atendimento individual.
    if (remoteJid.endsWith('@g.us')) {
      this.logger.log(`Mensagem de grupo ignorada (${remoteJid}).`);
      return;
    }

    const customerPhone = phoneFromRemoteJid(remoteJid);
    const pushName: string | undefined = data.pushName;

    const company = await this.findCompanyByInstance(instanceName);
    if (!company) {
      this.logger.warn(`Webhook recebido de instância desconhecida: ${instanceName}`);
      return;
    }

    let credentials: { apiUrl: string; apiKey: string };
    try {
      credentials = JSON.parse(decrypt(company.credentials_encrypted));
    } catch (err) {
      this.logger.error(`Não foi possível decifrar as credenciais da empresa ${company.company_id}`, err as Error);
      return;
    }

    // Passo 1: garante customer + conversation, salva a mensagem recebida
    // e já traz histórico recente + serviços ativos — tudo em uma
    // transação curta (sem chamada de IA no meio).
    const { customerId, conversationId, history, services } = await this.prisma.runInTenant(
      company.company_id,
      async (tx) => {
        let customer = await tx.customer.findFirst({ where: { phone: customerPhone } });
        if (!customer) {
          customer = await tx.customer.create({
            data: {
              companyId: company.company_id,
              phone: customerPhone,
              name: pushName,
              lastInteractionAt: new Date(),
            },
          });
        } else {
          await tx.customer.update({
            where: { id: customer.id },
            data: { lastInteractionAt: new Date(), name: customer.name ?? pushName },
          });
        }

        let conversation = await tx.conversation.findFirst({
          where: { customerId: customer.id, status: 'open' },
          orderBy: { startedAt: 'desc' },
        });
        if (!conversation) {
          conversation = await tx.conversation.create({
            data: {
              companyId: company.company_id,
              customerId: customer.id,
              channel: 'whatsapp',
              status: 'open',
            },
          });
        }

        await tx.message.create({
          data: {
            companyId: company.company_id,
            conversationId: conversation.id,
            senderType: 'customer',
            content: text,
          },
        });

        const recentMessages = await tx.message.findMany({
          where: { conversationId: conversation.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        const activeServices = await tx.service.findMany({ where: { active: true } });

        return {
          customerId: customer.id,
          conversationId: conversation.id,
          history: recentMessages.reverse(),
          services: activeServices,
        };
      },
    );

    // Passo 2: fora do horário de funcionamento, responde com a
    // mensagem padrão e nem chama a IA (mais rápido e mais barato).
    let replyText: string;
    const withinHours = isWithinBusinessHours(company.business_hours);
    this.logger.log(
      `Checagem de horário para empresa ${company.company_id}: business_hours=${JSON.stringify(
        company.business_hours,
      )} (tipo: ${typeof company.business_hours}) => dentro do horário? ${withinHours}`,
    );
    if (!withinHours) {
      replyText =
        company.away_message ||
        'Estamos fora do horário de atendimento agora. Retornaremos assim que possível!';
    } else {
      const queryEmbedding = await this.openai.embed(text);
      const relevantChunks = await this.rag.retrieveRelevantChunks(
        this.prisma,
        company.company_id,
        queryEmbedding,
        5,
      );

      replyText = await this.runAgentLoop({
        company,
        history,
        services,
        relevantChunks,
        customerId,
        conversationId,
      });
    }

    // Passo 3: salva a resposta (transação curta) e envia pelo WhatsApp.
    await this.prisma.runInTenant(company.company_id, (tx) =>
      tx.message.create({
        data: {
          companyId: company.company_id,
          conversationId,
          senderType: 'ai',
          content: replyText,
        },
      }),
    );

    await this.evolutionApi.sendText(
      credentials.apiUrl,
      credentials.apiKey,
      instanceName,
      customerPhone,
      replyText,
    );
  }

  private async findCompanyByInstance(instanceName: string): Promise<CompanyLookupRow | null> {
    const rows = await this.prisma.$queryRaw<CompanyLookupRow[]>`
      SELECT * FROM webhook_find_company_by_instance(${instanceName})
    `;
    return rows[0] ?? null;
  }

  /**
   * Recebe os eventos de "connection.update" da Evolution API e mantém o
   * status salvo da integração sempre fiel à conexão real do WhatsApp —
   * assim o painel sabe identificar sozinho, sem precisar que alguém
   * gere um QR code de novo, se o número caiu ou foi desconectado do
   * celular.
   */
  async handleConnectionUpdate(rawPayload: any): Promise<void> {
    const instanceName: string | undefined = rawPayload?.instance;
    const state: string | undefined = rawPayload?.data?.state;
    if (!instanceName || !state) return;

    const company = await this.findCompanyByInstance(instanceName);
    if (!company) {
      this.logger.warn(`Atualização de conexão de instância desconhecida: ${instanceName}`);
      return;
    }

    const status = state === 'open' ? 'connected' : state === 'connecting' ? 'pending' : 'disconnected';

    await this.prisma.runInTenant(company.company_id, (tx) =>
      tx.integration.updateMany({
        where: { type: 'whatsapp_evolution', instanceName },
        data: { status },
      }),
    );

    this.logger.log(
      `WhatsApp da empresa ${company.company_id} (instância ${instanceName}) mudou para "${status}".`,
    );
  }

  private buildSystemPrompt(
    company: CompanyLookupRow,
    services: ServiceRow[],
    relevantChunks: string[],
    isFirstMessage: boolean,
  ): string {
    const personality =
      PERSONALITY_INSTRUCTIONS[company.ai_personality] || PERSONALITY_INSTRUCTIONS.profissional;

    const servicesList = services.length
      ? services
          .map((s) => `- ${s.name} (${s.durationMinutes} min${s.price ? `, R$ ${s.price}` : ''})`)
          .join('\n')
      : 'Nenhum serviço cadastrado ainda.';

    const knowledge = relevantChunks.length
      ? relevantChunks.map((c, i) => `[Trecho ${i + 1}] ${c}`).join('\n\n')
      : 'Nenhuma informação adicional encontrada na base de conhecimento para esta pergunta.';

    const greetingInstruction =
      isFirstMessage && company.greeting_message
        ? `\n- Esta é a primeira mensagem desta conversa: comece sua resposta no espírito de "${company.greeting_message}" antes de continuar.`
        : '';
    const closingInstruction = company.closing_message
      ? `\n- Se o cliente estiver encerrando a conversa (se despedindo, agradecendo e saindo), encerre no espírito de "${company.closing_message}".`
      : '';
    const handoffInstruction = company.handoff_message
      ? `\n- Ao usar a ferramenta request_human_handoff, avise o cliente no espírito de "${company.handoff_message}".`
      : '';

    return `Você é o atendente virtual da empresa "${company.name}", conversando por WhatsApp.
${personality}

Serviços disponíveis:
${servicesList}

Use as informações abaixo se forem relevantes para a pergunta do cliente:
${knowledge}

Regras importantes:
- Responda sempre em português do Brasil, em mensagens curtas, adequadas para WhatsApp.
- Só use a ferramenta create_appointment depois de confirmar serviço e data/hora com o cliente.
- Se não tiver certeza de algo, ou o cliente pedir para falar com uma pessoa, use request_human_handoff.
- Nunca invente preços, horários ou informações que não estejam nos dados acima.${greetingInstruction}${closingInstruction}${handoffInstruction}`;
  }

  private async runAgentLoop(ctx: {
    company: CompanyLookupRow;
    history: { senderType: string; content: string }[];
    services: ServiceRow[];
    relevantChunks: string[];
    customerId: string;
    conversationId: string;
  }): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: this.buildSystemPrompt(
          ctx.company,
          ctx.services,
          ctx.relevantChunks,
          ctx.history.length <= 1,
        ),
      },
      ...ctx.history.map((m): ChatMessage => ({
        role: m.senderType === 'customer' ? 'user' : 'assistant',
        content: m.content,
      })),
    ];

    const MAX_ITERATIONS = 4;
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await this.openai.chat(messages, TOOLS);
      const choice = response.choices?.[0]?.message;

      if (!choice?.tool_calls?.length) {
        return choice?.content?.trim() || ctx.company.closing_message || 'Certo!';
      }

      messages.push(choice);

      for (const toolCall of choice.tool_calls) {
        let args: Record<string, any> = {};
        try {
          args = JSON.parse(toolCall.function.arguments || '{}');
        } catch {
          // argumentos inválidos — segue com objeto vazio, o executeTool trata
        }

        const result = await this.executeTool(toolCall.function.name, args, ctx);
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }

    return (
      ctx.company.handoff_message ||
      'Vou te transferir para um de nossos atendentes para continuar daqui.'
    );
  }

  private async executeTool(
    name: string,
    args: Record<string, any>,
    ctx: {
      company: CompanyLookupRow;
      services: ServiceRow[];
      customerId: string;
      conversationId: string;
    },
  ): Promise<Record<string, any>> {
    try {
      switch (name) {
        case 'create_appointment': {
          return this.prisma.runInTenant(ctx.company.company_id, async (tx) => {
            let service: ServiceRow | undefined;
            if (args.serviceName) {
              service = ctx.services.find(
                (s) => s.name.toLowerCase() === String(args.serviceName).toLowerCase(),
              );
              if (!service) {
                return {
                  success: false,
                  error: `Serviço "${args.serviceName}" não encontrado. Confira o nome exato na lista de serviços disponíveis.`,
                };
              }
            }

            let employeeId: string | undefined;
            if (args.employeeName) {
              const employee = await tx.employee.findFirst({
                where: { name: { equals: args.employeeName, mode: 'insensitive' }, active: true },
              });
              if (!employee) {
                return {
                  success: false,
                  error: `Profissional "${args.employeeName}" não encontrado. Confirme o nome com o cliente.`,
                };
              }
              employeeId = employee.id;
            }

            try {
              const appointment = await createAppointmentWithOverlapCheck(
                tx,
                ctx.company.company_id,
                {
                  customerId: ctx.customerId,
                  serviceId: service?.id,
                  employeeId,
                  scheduledAt: args.scheduledAt,
                  durationMinutes: args.durationMinutes ?? service?.durationMinutes,
                },
              );
              return { success: true, appointmentId: appointment.id, status: appointment.status };
            } catch (err) {
              if (err instanceof AppointmentConflictError) {
                return { success: false, error: err.message };
              }
              throw err;
            }
          });
        }

        case 'create_lead': {
          await this.prisma.runInTenant(ctx.company.company_id, (tx) =>
            tx.lead.create({
              data: {
                companyId: ctx.company.company_id,
                customerId: ctx.customerId,
                source: 'whatsapp',
                notes: args.notes,
                estimatedValue: args.estimatedValue,
              },
            }),
          );
          return { success: true };
        }

        case 'request_human_handoff': {
          await this.prisma.runInTenant(ctx.company.company_id, (tx) =>
            tx.conversation.update({
              where: { id: ctx.conversationId },
              data: { status: 'transferred' },
            }),
          );
          return { success: true };
        }

        default:
          return { success: false, error: 'ferramenta desconhecida' };
      }
    } catch (err) {
      this.logger.error(`Erro ao executar a ferramenta ${name}`, err as Error);
      return { success: false, error: 'erro interno ao executar a ação' };
    }
  }
}
