import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { Prisma } from '@prisma/client';
import { Observable, from, firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  TENANT_PRISMA_KEY,
  TENANT_COMPANY_ID_KEY,
  TENANT_USER_ID_KEY,
} from '../tenant-prisma.service';

/**
 * Para toda rota autenticada, abre uma transação Prisma, aplica
 * SET LOCAL app.current_company_id (via set_config, parametrizado —
 * nunca por interpolação de string) e guarda o client transacional
 * no contexto da requisição (nestjs-cls), para que qualquer
 * service/repositório que injete TenantPrismaService use exatamente
 * essa conexão, onde o RLS do Postgres já está filtrando por tenant.
 *
 * Aviso: isso mantém a transação aberta durante toda a requisição.
 * Para o futuro endpoint de webhook do WhatsApp (que vai chamar a
 * OpenAI e pode demorar alguns segundos), recomenda-se NÃO usar este
 * interceptor — em vez disso, abrir/fechar a transação só em volta
 * das chamadas de banco, e não em volta da chamada à IA.
 */
@Injectable()
export class TenantRlsInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const companyId: string | undefined = req.user?.companyId;
    const userId: string | undefined = req.user?.userId;

    if (!companyId) {
      throw new UnauthorizedException('Tenant não identificado na requisição');
    }

    return from(
      this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw(
          Prisma.sql`SELECT set_config('app.current_company_id', ${companyId}, true)`,
        );

        this.cls.set(TENANT_COMPANY_ID_KEY, companyId);
        this.cls.set(TENANT_USER_ID_KEY, userId);
        this.cls.set(TENANT_PRISMA_KEY, tx);

        return firstValueFrom(next.handle());
      }),
    );
  }
}
