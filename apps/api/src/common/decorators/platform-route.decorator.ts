import { SetMetadata } from '@nestjs/common';

export const IS_PLATFORM_ROUTE_KEY = 'isPlatformRoute';

/**
 * Marca uma rota como "de plataforma": continua exigindo JWT válido
 * (diferente de @Public()), mas não passa pelo TenantRlsInterceptor —
 * porque, por definição, essas rotas operam atravessando várias
 * empresas (ex: listar todas as empresas clientes), não dentro de uma
 * só. A autorização real (checar se quem está logado é admin da
 * plataforma) é feita pelo PlatformAdminGuard.
 */
export const PlatformRoute = () => SetMetadata(IS_PLATFORM_ROUTE_KEY, true);
