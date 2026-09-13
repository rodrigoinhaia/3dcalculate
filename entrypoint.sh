#!/bin/sh
set -e

# Se a variável BACKEND_URL não for informada no EasyPanel, usa http://backend:3001 como padrão
BACKEND_URL=${BACKEND_URL:-http://backend:3001}

echo "[3D Calc Nginx] Configurando Backend Upstream para: $BACKEND_URL"

# Substitui o placeholder no arquivo de configuração do Nginx com segurança
sed -i "s|__BACKEND_URL__|$BACKEND_URL|g" /etc/nginx/conf.d/default.conf

exec "$@"
