#!/bin/bash

# Script de configuración SSL automática para BoxBet
# Uso: ./setup-ssl.sh

set -e

echo "🔐 Configuración SSL para BoxBet"
echo "================================"
echo ""

# Variables
DOMAIN="boxbet.147.93.184.134.nip.io"
BACKEND_PORT=7001

echo "📋 Configuración:"
echo "   Dominio: $DOMAIN"
echo "   Puerto Backend: $BACKEND_PORT"
echo ""

# Verificar que somos root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Este script debe ejecutarse como root"
    echo "   Usa: sudo ./setup-ssl.sh"
    exit 1
fi

# 1. Instalar Nginx
echo "📦 Instalando Nginx..."
apt update
apt install -y nginx

# 2. Crear configuración de Nginx
echo "⚙️  Creando configuración de Nginx..."
cat > /etc/nginx/sites-available/boxbet << 'EOF'
server {
    listen 80;
    server_name boxbet.147.93.184.134.nip.io;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    location / {
        proxy_pass http://localhost:7001;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
EOF

# 3. Habilitar sitio
echo "🔗 Habilitando sitio..."
ln -sf /etc/nginx/sites-available/boxbet /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 4. Verificar configuración
echo "✅ Verificando configuración de Nginx..."
nginx -t

# 5. Reiniciar Nginx
echo "🔄 Reiniciando Nginx..."
systemctl restart nginx
systemctl enable nginx

# 6. Configurar firewall
echo "🔥 Configurando firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo "   UFW configurado"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    echo "   firewalld configurado"
fi

# 7. Probar HTTP
echo ""
echo "🧪 Probando conexión HTTP..."
sleep 2
if curl -sSf -I http://$DOMAIN > /dev/null 2>&1; then
    echo "   ✅ HTTP funciona correctamente"
else
    echo "   ⚠️  No se pudo verificar HTTP"
fi

echo ""
echo "================================"
echo "✅ Configuración básica completa!"
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Instalar Certbot para SSL:"
echo "   apt install -y certbot python3-certbot-nginx"
echo ""
echo "2. Obtener certificado SSL:"
echo "   certbot --nginx -d $DOMAIN"
echo ""
echo "3. Actualizar CORS en server/index.ts:"
echo "   Agregar: 'https://$DOMAIN' a allowedOrigins"
echo ""
echo "4. Reconstruir Docker:"
echo "   cd ~/BoxBet"
echo "   docker compose down"
echo "   docker compose up -d --build"
echo ""
echo "5. Actualizar .env.production:"
echo "   VITE_SOCKET_URL=https://$DOMAIN"
echo ""
echo "6. Redeploy en Netlify"
echo ""
echo "📖 Ver guía completa: SSL_SETUP.md"
