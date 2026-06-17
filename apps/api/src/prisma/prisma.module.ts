import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global para que qualquer módulo (incluindo o AuthModule, que precisa
 * do PrismaService cru antes de saber o tenant) consiga injetar
 * PrismaService sem precisar reimportar este módulo em todo lugar —
 * e, principalmente, sem criar uma segunda pool de conexões com o banco.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
