/**
 * Cria os dados iniciais para você conseguir logar no painel:
 *   - um plano "Starter"
 *   - uma empresa de exemplo
 *   - um usuário admin (owner) dessa empresa
 *
 * Rodar com: npx prisma db seed
 * (ou: npx ts-node prisma/seed.ts)
 *
 * Edite as constantes abaixo antes de rodar, principalmente o e-mail
 * e a senha do admin.
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@minhaempresa.com.br';
const ADMIN_PASSWORD = 'troque-esta-senha-123';
const COMPANY_NAME = 'Minha Empresa Exemplo';
const COMPANY_SLUG = 'minha-empresa-exemplo';

async function main() {
  let plan = await prisma.plan.findFirst({ where: { name: 'Starter' } });
  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        name: 'Starter',
        monthlyPrice: 0,
        messageLimit: 500,
        whatsappNumbersLimit: 1,
        features: { dashboard: true, agendamento: true },
      },
    });
    console.log('Plano "Starter" criado.');
  }

  const companyId = randomUUID();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await prisma.$transaction(async (tx) => {
    // Necessário para passar pela política de RLS — a linha que está
    // sendo inserida precisa ter id igual ao valor configurado aqui.
    await tx.$executeRaw(
      Prisma.sql`SELECT set_config('app.current_company_id', ${companyId}, true)`,
    );

    const company = await tx.company.create({
      data: {
        id: companyId,
        planId: plan!.id,
        name: COMPANY_NAME,
        slug: COMPANY_SLUG,
        aiPersonality: 'profissional',
        businessHours: {
          seg: { abre: '09:00', fecha: '18:00' },
          ter: { abre: '09:00', fecha: '18:00' },
          qua: { abre: '09:00', fecha: '18:00' },
          qui: { abre: '09:00', fecha: '18:00' },
          sex: { abre: '09:00', fecha: '18:00' },
          sab: { abre: '09:00', fecha: '13:00' },
          dom: null,
        },
        greetingMessage: 'Olá! Como posso ajudar você hoje?',
        awayMessage: 'Estamos fora do horário de atendimento, retornamos em breve.',
        closingMessage: 'Foi um prazer ajudar! Até a próxima.',
        handoffMessage: 'Vou te transferir para um de nossos atendentes.',
      },
    });

    await tx.user.create({
      data: {
        companyId: company.id,
        name: 'Administrador',
        email: ADMIN_EMAIL,
        passwordHash,
        role: 'owner',
      },
    });
  });

  console.log('---------------------------------------------');
  console.log('Seed concluído. Use estas credenciais no login:');
  console.log(`  e-mail: ${ADMIN_EMAIL}`);
  console.log(`  senha:  ${ADMIN_PASSWORD}`);
  console.log('---------------------------------------------');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
