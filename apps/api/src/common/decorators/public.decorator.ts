import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca uma rota como pública: não exige JWT e não passa pelo
 * TenantRlsInterceptor (não há tenant resolvido ainda nessas rotas).
 * Uso: @Public() acima do método do controller.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
