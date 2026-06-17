import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateCompanyAdminDto } from './dto/update-company-admin.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { slugify } from '../../common/slug.util';

interface CompanyAdminRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan_id: string | null;
  plan_name: string | null;
  created_at: Date;
  total_users: bigint;
  total_customers: bigint;
}

@Injectable()
export class PlatformAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listCompanies() {
    const rows = await this.prisma.$queryRaw<CompanyAdminRow[]>`
      SELECT * FROM platform_admin_list_companies()
    `;
    // BigInt não serializa em JSON por padrão — converte para number
    // (contagens de empresas individuais nunca chegam a ultrapassar
    // o limite seguro de Number).
    return rows.map((row) => ({
      ...row,
      total_users: Number(row.total_users),
      total_customers: Number(row.total_customers),
    }));
  }

  // Único caminho para criar uma empresa nova: só chega aqui quem
  // passou pelo PlatformAdminGuard (ou seja, você, logado). Não existe
  // cadastro público — e como é você mesmo definindo a senha aqui,
  // não tem passo de "ativação por e-mail" nenhum: a empresa já
  // consegue logar com essas credenciais imediatamente.
  async createCompany(dto: CreateCompanyDto) {
    const baseSlug = slugify(dto.companyName) || 'empresa';

    const plan = dto.planId
      ? await this.prisma.plan.findUnique({ where: { id: dto.planId } })
      : await this.prisma.plan.findFirst({ orderBy: { monthlyPrice: 'asc' } });

    const passwordHash = await bcrypt.hash(dto.password, 10);

    let slug = baseSlug;
    let attempt = 0;
    const maxAttempts = 5;

    while (attempt <= maxAttempts) {
      const companyId = randomUUID();
      try {
        return await this.prisma.runInTenant(companyId, async (tx) => {
          const company = await tx.company.create({
            data: {
              id: companyId,
              name: dto.companyName,
              slug,
              planId: plan?.id,
            },
          });

          const user = await tx.user.create({
            data: {
              companyId,
              name: dto.name,
              email: dto.email,
              passwordHash,
              role: 'owner',
            },
          });

          return {
            company: { id: company.id, name: company.name, slug: company.slug },
            user: { id: user.id, name: user.name, email: user.email },
          };
        });
      } catch (err: any) {
        if (err?.code === 'P2002') {
          const target: string[] = err.meta?.target ?? [];
          if (target.includes('email')) {
            throw new ConflictException('Este e-mail já está cadastrado.');
          }
          if (target.includes('slug')) {
            // Não há como checar slugs de outras empresas antes (o RLS
            // esconde tudo fora do tenant atual) — então a forma
            // confiável de detectar colisão é deixar o banco recusar e
            // tentar de novo com um sufixo.
            attempt += 1;
            slug = `${baseSlug}-${attempt}`;
            continue;
          }
        }
        throw err;
      }
    }

    throw new ConflictException('Não foi possível gerar um identificador único para esta empresa.');
  }

  // Reaproveita a mesma técnica do seed: como a política de RLS de
  // UPDATE também usa WITH CHECK (id = current_setting(...)), abrir a
  // transação com app.current_company_id = id da própria empresa que
  // está sendo editada satisfaz a política, mesmo vindo de um admin
  // de outra empresa (você).
  updateCompany(id: string, dto: UpdateCompanyAdminDto) {
    return this.prisma.runInTenant(id, (tx) =>
      tx.company.update({ where: { id }, data: dto }),
    );
  }

  listPlans() {
    return this.prisma.plan.findMany({ orderBy: { monthlyPrice: 'asc' } });
  }

  createPlan(dto: CreatePlanDto) {
    return this.prisma.plan.create({ data: dto });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plano não encontrado');
    return this.prisma.plan.update({ where: { id }, data: dto });
  }
}
