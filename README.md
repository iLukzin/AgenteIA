# Vetor AI — Painel Administrativo + Agente de IA

Painel administrativo (Next.js) + API multi-tenant (NestJS) + agente de IA
com RAG que atende pelo WhatsApp via Evolution API. Tudo conectado ao banco
Postgres do Supabase que você já criou com `schema-banco-dados.sql`.

```
vetor-ai/
├── apps/
│   ├── api/     # NestJS — autenticação, regras de negócio, RLS, agente de IA
│   └── web/     # Next.js — painel que você vê no navegador
├── migration-002-auth-lookup.sql
└── migration-003-whatsapp-integration.sql
```

O painel **nunca** fala direto com o Supabase. Ele chama a API NestJS, que
abre uma transação por requisição e aplica `SET LOCAL app.current_company_id`
antes de qualquer consulta — é isso que faz o isolamento entre empresas
(Row Level Security) funcionar de verdade, no banco, e não só na aplicação.

## 1. Rode as migrations que faltavam

No SQL Editor do Supabase, rode, nesta ordem (se ainda não rodou):

1. `migration-002-auth-lookup.sql` — permite o login buscar o usuário pelo
   e-mail antes de saber a qual empresa ele pertence.
2. `migration-003-whatsapp-integration.sql` — adiciona o nome da instância
   da Evolution API e a função que o webhook usa para descobrir de qual
   empresa é cada mensagem recebida.

## 2. Configure e rode a API

```bash
cd apps/api
cp .env.example .env
```

Edite `.env`:
- `DATABASE_URL`: connection string do Supabase usando a `app_backend_role`,
  pelo **Transaction pooler** (porta 6543), terminando em `?pgbouncer=true`.
- `JWT_SECRET`: qualquer string longa e aleatória.
- `OPENAI_API_KEY`: sua chave da OpenAI (platform.openai.com).
- `OPENAI_CHAT_MODEL` / `OPENAI_EMBEDDING_MODEL`: já vêm com um valor padrão
  razoável; confira em platform.openai.com se prefere outro modelo.
- `INTEGRATIONS_ENCRYPTION_KEY`: chave usada para cifrar a API key da
  Evolution API guardada no banco. Gere uma com:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

Depois:

```bash
npm install
npx prisma generate
npx prisma db seed   # cria o primeiro usuário (edite prisma/seed.ts antes, se quiser)
npm run start:dev
```

Ela vai rodar em `http://localhost:3001`.

## 3. Configure e rode o painel

Em outro terminal:

```bash
cd apps/web
cp .env.local.example .env.local
npm install
npm run dev
```

Acesse `http://localhost:3000/login` e entre com o e-mail/senha do seed.

## 4. Conecte o WhatsApp (Evolution API)

1. Você precisa de uma Evolution API rodando (própria instância ou
   contratada) e ter criado uma instância nela.
2. No painel, vá em **Configurações** → seção "Integração com WhatsApp" e
   copie a URL do webhook mostrada lá (algo como
   `http://SEU_DOMINIO/webhooks/whatsapp`).
3. Para testar **localmente**, sua API precisa de uma URL pública — use o
   ngrok (`ngrok http 3001`) e use a URL que ele te der no lugar de
   `http://localhost:3001` ao configurar o webhook na Evolution API.
4. Na Evolution API, configure o webhook da sua instância apontando para
   essa URL, com o evento `MESSAGES_UPSERT` habilitado.
5. Volte no painel e preencha nome da instância, URL da sua Evolution API
   e a API key — e salve.
6. Mande uma mensagem de teste pelo WhatsApp para o número conectado.

## 5. Alimente a base de conhecimento

Em **Base de conhecimento**, cole textos que o agente deve saber (FAQ,
políticas, descrições de serviço etc.). Cada texto é dividido em trechos e
indexado automaticamente (embeddings via OpenAI, busca por similaridade via
pgvector) — é isso que o agente consulta antes de responder.

## O que já funciona

- Login com JWT, configurações da empresa, serviços, equipe, clientes,
  agendamentos (com checagem automática de conflito de horário), leads,
  conversas (leitura) e dashboard — tudo isolado por empresa via RLS.
- Agente de IA pelo WhatsApp: recebe a mensagem, verifica o horário de
  funcionamento (responde com a mensagem padrão se estiver fechado), busca
  contexto relevante na base de conhecimento (RAG), conversa usando o tom
  de voz configurado, e pode agendar horários, registrar leads ou
  transferir a conversa para um humano — tudo isso são ferramentas que a
  própria IA decide usar durante a conversa.
- Base de conhecimento com indexação automática de texto colado.
- Credenciais da Evolution API cifradas (AES-256-GCM) antes de ir para o banco.

## O que ainda falta (próximos passos sugeridos)

1. Upload real de arquivo (PDF/DOCX) para a base de conhecimento — hoje só
   aceita texto colado direto; falta extrair texto de arquivos e integrar
   com Supabase Storage.
2. Worker em background para indexação — hoje a geração de embeddings roda
   de forma síncrona na requisição; para textos muito grandes, vale mover
   para uma fila (ex: BullMQ).
3. Suporte a mídia no WhatsApp (áudio, imagem) — hoje o agente só lê
   mensagens de texto.
4. Refresh token — hoje o JWT expira em 8h e exige logar de novo.
5. Deploy — API em um VPS (ou Railway/Render) e o painel na Vercel, com as
   variáveis de ambiente de produção e uma URL pública fixa para o webhook
   (sem precisar de ngrok).
6. Lock contra mensagens simultâneas: se o mesmo cliente mandar duas
   mensagens quase ao mesmo tempo, existe uma pequena chance de criar duas
   conversas em aberto em vez de reaproveitar uma — não é grave, mas um
   lock (ex: pg_advisory_xact_lock por customer_id) resolveria de forma
   definitiva.
