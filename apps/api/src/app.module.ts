import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantRlsInterceptor } from './common/interceptors/tenant-rls.interceptor';
import { PrismaModule } from './prisma/prisma.module';

import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ServicesModule } from './modules/services/services.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { CustomersModule } from './modules/customers/customers.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { LeadsModule } from './modules/leads/leads.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AgentModule } from './modules/agent/agent.module';

@Module({
  imports: [
    PrismaModule,
    ClsModule.forRoot({ global: true, middleware: { mount: true } }),
    AuthModule,
    CompaniesModule,
    ServicesModule,
    EmployeesModule,
    CustomersModule,
    AppointmentsModule,
    LeadsModule,
    ConversationsModule,
    DocumentsModule,
    DashboardModule,
    IntegrationsModule,
    AgentModule,
  ],
  providers: [
    // Ordem importa: o guard roda primeiro (autentica e popula req.user),
    // só depois o interceptor abre a transação com o tenant já resolvido.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantRlsInterceptor },
  ],
})
export class AppModule {}
