import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Client Prisma "cru", sem tenant configurado. Só deve ser usado:
 *  - dentro do TenantRlsInterceptor, para abrir a transação e
 *    aplicar o SET LOCAL;
 *  - no AuthService, no momento do login (única rota que roda antes
 *    de sabermos o tenant);
 *  - no AgentService (webhook do WhatsApp), via runInTenant() abaixo —
 *    de propósito, com transações curtas, para não segurar uma
 *    conexão aberta enquanto esperamos a resposta da OpenAI.
 * Qualquer outro lugar do código deve usar TenantPrismaService.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Abre uma transação curta só para a operação de banco passada em
   * `fn`, já com app.current_company_id configurado. Use isso fora do
   * ciclo normal de requisição HTTP (ex: no fluxo do agente de IA),
   * onde não faz sentido segurar uma transação durante todo o tempo
   * de uma chamada à OpenAI.
   */
  async runInTenant<T>(
    companyId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT set_config('app.current_company_id', ${companyId}, true)`,
      );
      return fn(tx);
    });
  }
}
