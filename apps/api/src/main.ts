import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

// Rede de segurança: em versões recentes do Node.js, uma promise rejeitada
// sem .catch() (unhandledRejection) ou um erro síncrono sem try/catch em
// código assíncrono (uncaughtException) DERRUBAM O PROCESSO INTEIRO, não
// só a requisição que causou o erro — o serviço inteiro reinicia, e todas
// as conversas em andamento naquele instante se perdem, sem deixar rastro.
// Aqui só registramos o erro e seguimos rodando, em vez de deixar isso
// matar o servidor.
process.on('unhandledRejection', (reason) => {
  logger.error('Promise rejeitada sem tratamento (processo continua rodando):', reason as any);
});
process.on('uncaughtException', (err) => {
  logger.error('Exceção não tratada (processo continua rodando):', err.stack);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // O padrão do Express é de só 100kb por requisição — pequeno demais
  // para os webhooks da Evolution API, que embutem fotos, áudios e
  // outras mídias como base64 direto no corpo da requisição. Sem isso,
  // toda mensagem com mídia maior é rejeitada antes de chegar no
  // nosso código (PayloadTooLargeError).
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Vetor AI API rodando em http://localhost:${port}`);
}

bootstrap();
