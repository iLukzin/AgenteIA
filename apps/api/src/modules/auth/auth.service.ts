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
  password_hash: string;
  role: string;
  active: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    // Usa a função auth_find_user_by_email (migration-002-auth-lookup.sql),
    // a única consulta do sistema que legitimamente ignora RLS — porque
    // neste momento ainda não sabemos a qual empresa o usuário pertence.
    const rows = await this.prisma.$queryRaw<AuthUserRow[]>`
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

    const payload = {
      sub: user.id,
      companyId: user.company_id,
      role: user.role,
      email: user.email,
    };

    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
      },
    };
  }
}
