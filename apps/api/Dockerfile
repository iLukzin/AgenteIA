# Dockerfile explícito para fugir da detecção automática (Nixpacks) do
# Railway, que em alguns casos instala só as dependências de produção
# e nunca chega a gerar o dist/main.js (faltando o @nestjs/cli, que é
# uma devDependency). Aqui o controle é total: instala tudo, gera o
# client do Prisma, builda e só então define o comando de start.
#
# Usando node:20-slim (Debian) em vez de node:20-alpine: o motor do
# Prisma depende de uma versão específica do OpenSSL que o Alpine
# (musl) frequentemente não tem disponível por padrão — erro clássico
# "Error loading shared library libssl.so.1.1". A imagem slim já vem
# com OpenSSL compatível, evitando esse problema de fábrica.

FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copia primeiro só os manifestos para aproveitar cache do Docker
# quando só o código-fonte muda (sem mudar dependências).
COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["node", "dist/main.js"]
