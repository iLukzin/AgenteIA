import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

interface AuthUserRow {
  id: string;
  company_id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  is_platform_admin: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    // Usa a função auth_find_user_by_email (migration-002/004), a única
    // consulta do sistema que legitimamente ignora RLS — porque neste
    // momento ainda não sabemos a qual empresa o usuário pertence.
    const rows = await this.prisma.$queryRaw<(AuthUserRow & { password_hash: string })[]>`
      SELECT * FROM auth_find_user_by_email(${dto.email})
    `;
    const user = rows[0];

    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: AuthUserRow) {
    const payload = {
      sub: user.id,
      companyId: user.company_id,
      role: user.role,
      email: user.email,
      isPlatformAdmin: user.is_platform_admin,
    };

    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
        isPlatformAdmin: user.is_platform_admin,
      },
    };
  }
}
