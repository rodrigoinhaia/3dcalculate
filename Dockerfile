# ==========================================
# Estágio 1: Build da Aplicação Vite
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências aproveitando cache de camadas Docker
COPY package.json package-lock.json ./
RUN npm ci

# Copia todo o código-fonte da aplicação
COPY . .

# Compila os arquivos de produção para /app/dist
RUN npm run build

# ==========================================
# Estágio 2: Servidor Nginx Otimizado (Produção)
# ==========================================
FROM nginx:alpine AS runner

# Remove a configuração padrão do Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copia nossa configuração otimizada de SPA e compressão
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos compilados do estágio de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Porta padrão de escuta para o EasyPanel
EXPOSE 80

# Inicia o Nginx em primeiro plano
CMD ["nginx", "-g", "daemon off;"]
