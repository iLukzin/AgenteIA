# Dockerfile explícito para fugir da detecção automática (Nixpacks) do
# Railway, que em alguns casos instala só as dependências de produção
# e nunca chega a gerar o dist/main.js (faltando o @nestjs/cli, que é
# uma devDependency). Aqui o controle é total: instala tudo, gera o
# client do Prisma, builda e só então define o comando de start.

FROM node:20-alpine

WORKDIR /app

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
