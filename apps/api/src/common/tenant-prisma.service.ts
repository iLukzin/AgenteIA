import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Prisma } from '@prisma/client';

export const TENANT_PRISMA_KEY = 'tenantPrisma';
export const TENANT_COMPANY_ID_KEY = 'tenantCompanyId';
export const TENANT_USER_ID_KEY = 'tenantUserId';

/**
 * É isto que todo módulo de domínio (services, customers, etc.) injeta
 * em vez do PrismaService global. Garante que toda query feita por
 * eles roda na MESMA transação onde o TenantRlsInterceptor já aplicou
 * o SET LOCAL app.current_company_id — então o isolamento entre
 * empresas é garantido pelo Postgres, não por um WHERE que alguém
 * pode esquecer de escrever.
 */
@Injectable()
export class TenantPrismaService {
  constructor(private readonly cls: ClsService) {}

  get client(): Prisma.TransactionClient {
    const tx = this.cls.get(TENANT_PRISMA_KEY);
    if (!tx) {
      throw new Error(
        'TenantPrismaService usado fora de uma requisição com tenant resolvido. ' +
          'Confirme que esta rota não está marcada com @Public() e que o ' +
          'TenantRlsInterceptor está registrado globalmente.',
      );
    }
    return tx;
  }

  get companyId(): string {
    const companyId = this.cls.get(TENANT_COMPANY_ID_KEY);
    if (!companyId) {
      throw new Error('companyId não disponível no contexto da requisição.');
    }
    return companyId;
  }

  get userId(): string {
    return this.cls.get(TENANT_USER_ID_KEY);
  }
}
