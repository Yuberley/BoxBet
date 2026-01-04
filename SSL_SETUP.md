# 🔐 Configuración SSL con Nginx + nip.io

Este documento te guiará para configurar SSL en tu VPS usando Nginx como proxy reverso.

## 📋 Requisitos

- VPS con IP: **147.93.184.134**
- Docker container corriendo en puerto 7001
- Acceso root al VPS

## 🌐 ¿Qué es nip.io?

**nip.io** es un servicio DNS wildcard gratuito que mapea cualquier IP a un dominio:
- `147.93.184.134.nip.io` → resuelve a `147.93.184.134`
- `boxbet.147.93.184.134.nip.io` → resuelve a `147.93.184.134`

## 🚀 Instalación Paso a Paso

### 1. Instalar Nginx y Certbot

```bash
# Conectar al VPS
ssh root@147.93.184.134

# Actualizar sistema
apt update
apt upgrade -y

# Instalar Nginx
apt install -y nginx

# Instalar Certbot (para SSL)
apt install -y certbot python3-certbot-nginx

# Verificar instalación
nginx -v
certbot --version
```

### 2. Configurar Nginx como Proxy Reverso

```bash
# Crear configuración para BoxBet
cat > /etc/nginx/sites-available/boxbet << 'EOF'
server {
    listen 80;
    server_name boxbet.147.93.184.134.nip.io;

    # Headers importantes para WebSocket
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    location / {
        proxy_pass http://localhost:7001;
        proxy_http_version 1.1;
        
        # Configuración crucial para Socket.io
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts para conexiones largas
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
EOF

# Habilitar el sitio
ln -s /etc/nginx/sites-available/boxbet /etc/nginx/sites-enabled/

# Verificar configuración
nginx -t

# Si está OK, reiniciar Nginx
systemctl restart nginx
systemctl status nginx
```

### 3. Abrir Puerto 80 y 443 en el Firewall

```bash
# Permitir HTTP (80) y HTTPS (443)
ufw allow 80/tcp
ufw allow 443/tcp
ufw status

# O con firewalld
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

### 4. Verificar que Funciona sin SSL

```bash
# Desde el VPS
curl -I http://boxbet.147.93.184.134.nip.io

# Desde tu PC (PowerShell)
curl http://boxbet.147.93.184.134.nip.io/health
```

Deberías ver la respuesta del servidor.

### 5. Obtener Certificado SSL con Let's Encrypt

**⚠️ IMPORTANTE**: Let's Encrypt tiene **rate limits** y puede rechazar dominios nip.io por abuso. Si falla, usa la **Opción Alternativa** al final.

```bash
# Obtener certificado SSL automático
certbot --nginx -d boxbet.147.93.184.134.nip.io

# Seguir las instrucciones:
# 1. Ingresar tu email
# 2. Aceptar términos (Y)
# 3. Compartir email (N o Y)
# 4. Redirigir HTTP a HTTPS (opción 2)
```

Certbot automáticamente:
- Obtiene el certificado
- Modifica la configuración de Nginx
- Configura renovación automática

### 6. Verificar SSL Funciona

```bash
# Probar HTTPS
curl -I https://boxbet.147.93.184.134.nip.io
curl https://boxbet.147.93.184.134.nip.io/health
```

### 7. Actualizar CORS en el Backend

Edita [server/index.ts](server/index.ts) y agrega el nuevo dominio:

```typescript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://boxbet.netlify.app',
  'https://boxbet.147.93.184.134.nip.io',  // ← Agregar
];
```

Luego reconstruye el contenedor:

```bash
cd ~/BoxBet
docker compose down
docker compose up -d --build
```

### 8. Actualizar Frontend

Edita `.env.production`:

```env
VITE_SOCKET_URL=https://boxbet.147.93.184.134.nip.io
```

Sube a Netlify:
1. Netlify Dashboard → Site settings → Environment variables
2. Actualizar `VITE_SOCKET_URL` = `https://boxbet.147.93.184.134.nip.io`
3. Deploys → Trigger deploy

## 🔄 Renovación Automática

Certbot configura renovación automática. Verificar:

```bash
# Ver timer de renovación
systemctl status certbot.timer

# Probar renovación (dry-run)
certbot renew --dry-run
```

## 🛠️ Comandos Útiles

```bash
# Ver certificados instalados
certbot certificates

# Renovar manualmente
certbot renew

# Recargar Nginx sin downtime
nginx -t && systemctl reload nginx

# Ver logs de Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Ver estado de Nginx
systemctl status nginx

# Reiniciar Nginx
systemctl restart nginx
```

## 🐛 Troubleshooting

### Error: "Too Many Certificates Already Issued"

Let's Encrypt tiene rate limit de 50 certificados por dominio raíz por semana. Si nip.io está saturado:

**Solución**: Usa la Opción Alternativa (auto-firmado) abajo.

### Error: "Connection refused"

```bash
# Verificar que el contenedor está corriendo
docker ps

# Verificar que Nginx está corriendo
systemctl status nginx

# Verificar logs
docker compose logs boxbet-server
tail -f /var/log/nginx/error.log
```

### WebSocket no conecta

Verifica la configuración de Nginx tenga:
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

### CORS Error

Agrega el dominio nip.io en `allowedOrigins` del backend.

## 📦 Opción Alternativa: Certificado Auto-firmado

Si Let's Encrypt falla con nip.io, usa un certificado auto-firmado (el navegador mostrará advertencia, pero funcionará):

```bash
# Crear certificado auto-firmado
mkdir -p /etc/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/boxbet.key \
  -out /etc/nginx/ssl/boxbet.crt \
  -subj "/C=CO/ST=State/L=City/O=BoxBet/CN=boxbet.147.93.184.134.nip.io"

# Actualizar configuración de Nginx
cat > /etc/nginx/sites-available/boxbet << 'EOF'
server {
    listen 80;
    server_name boxbet.147.93.184.134.nip.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name boxbet.147.93.184.134.nip.io;

    ssl_certificate /etc/nginx/ssl/boxbet.crt;
    ssl_certificate_key /etc/nginx/ssl/boxbet.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    location / {
        proxy_pass http://localhost:7001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
EOF

nginx -t && systemctl restart nginx
```

**Nota**: Los usuarios verán una advertencia de seguridad en el navegador. Deben hacer clic en "Avanzado" → "Continuar al sitio".

## ✅ Verificación Final

1. **Backend accesible**: `curl https://boxbet.147.93.184.134.nip.io/health`
2. **WebSocket funciona**: Abre consola del navegador en Netlify y verifica "Socket connected"
3. **Sin errores CORS**: No hay errores en la consola
4. **Juego funciona**: Crea sala y únete desde otro dispositivo

---

**Documentación adicional**: [DEPLOY_VPS.md](DEPLOY_VPS.md)
