FROM node:20-alpine

WORKDIR /app

# Instala apenas dependências de produção para economizar memória e espaço
COPY package.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]
