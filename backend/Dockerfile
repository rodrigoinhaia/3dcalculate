FROM node:20-alpine

WORKDIR /app

# Copia os arquivos do backend a partir da raiz do repositório (padrão do EasyPanel)
COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./

EXPOSE 3001

CMD ["node", "src/server.js"]
