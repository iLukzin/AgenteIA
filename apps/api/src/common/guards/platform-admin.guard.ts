import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!req.user?.isPlatformAdmin) {
      throw new ForbiddenException('Acesso restrito a administradores da plataforma.');
    }
    return true;
  }
}
