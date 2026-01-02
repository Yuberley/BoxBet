# 🚀 Despliegue de BoxBet en VPS

## 📋 Requisitos
- VPS con Docker instalado ✅
- IP pública del VPS
- Acceso SSH al VPS
- Cuenta en Netlify

---

## 🖥️ PARTE 1: Desplegar Backend en VPS

### 1. Conectar al VPS
```bash
ssh usuario@TU_IP_VPS
```

### 2. Instalar Git (si no lo tienes)
```bash
sudo apt update
sudo apt install git -y
```

### 3. Clonar el repositorio (o subir archivos)

**Opción A - Con Git:**
```bash
cd ~
git clone TU_REPOSITORIO_GITHUB
cd BoxBet
```

**Opción B - Subir archivos manualmente:**
```bash
# Desde tu PC (PowerShell), comprime solo la carpeta server:
Compress-Archive -Path ".\server",".\docker-compose.yml" -DestinationPath boxbet-server.zip

# Sube al VPS usando SCP:
scp boxbet-server.zip usuario@TU_IP_VPS:~/

# En el VPS:
unzip boxbet-server.zip
```

### 4. Construir y levantar el contenedor
```bash
# En el directorio donde está docker-compose.yml
docker-compose up -d --build
```

### 5. Verificar que funciona
```bash
# Ver logs
docker-compose logs -f boxbet-server

# Verificar que está corriendo
docker ps

# Probar endpoint de health
curl http://localhost:7001/health
```

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "...",
  "activeRooms": 0,
  "uptime": 123.45
}
```

### 6. Abrir puerto 7001 en el firewall

**Ubuntu/Debian:**
```bash
sudo ufw allow 7001/tcp
sudo ufw reload
```

**CentOS/RHEL:**
```bash
sudo firewall-cmd --permanent --add-port=7001/tcp
sudo firewall-cmd --reload
```

### 7. Probar desde internet
```bash
# Desde tu PC (PowerShell):
curl http://TU_IP_VPS:7001/health
```

Si funciona, ¡el backend está listo! 🎉

---

## 🌐 PARTE 2: Configurar Frontend en Netlify

### 1. Editar archivo .env.production local
```bash
# Abre: .env.production
# Reemplaza TU_IP_VPS con tu IP real:
VITE_SOCKET_URL=http://123.456.789.10:7001
```

### 2. Agregar variable de entorno en Netlify

1. Ve a tu sitio en Netlify Dashboard
2. **Site settings** → **Environment variables**
3. Click **Add a variable**
4. Agrega:
   - **Key:** `VITE_SOCKET_URL`
   - **Value:** `http://TU_IP_VPS:7001`
5. Click **Save**

### 3. Redeploy en Netlify

**Opción A - Desde Git:**
```bash
git add .
git commit -m "Actualizar URL del backend"
git push origin main
```
Netlify detectará el push y redeplegará automáticamente.

**Opción B - Manual:**
1. En Netlify Dashboard
2. **Deploys** → **Trigger deploy** → **Deploy site**

### 4. Verificar que funciona
1. Abre tu sitio de Netlify: `https://tu-sitio.netlify.app`
2. Abre la consola del navegador (F12)
3. Deberías ver: "Socket connected" (sin errores)
4. Crea una sala y prueba el juego

---

## 🔧 Comandos Útiles en el VPS

### Ver logs del servidor
```bash
docker-compose logs -f boxbet-server
```

### Reiniciar servidor
```bash
docker-compose restart boxbet-server
```

### Detener servidor
```bash
docker-compose down
```

### Actualizar código
```bash
# Si usas Git:
git pull origin main
docker-compose up -d --build

# Si subes manualmente:
# 1. Sube el nuevo código
# 2. Ejecuta:
docker-compose up -d --build
```

### Ver contenedores corriendo
```bash
docker ps
```

### Ver estadísticas de recursos
```bash
docker stats boxbet-server
```

### Entrar al contenedor (debugging)
```bash
docker exec -it boxbet-server sh
```

---

## 🛡️ Seguridad Básica (Recomendado)

### 1. Cambiar puerto SSH (opcional)
```bash
sudo nano /etc/ssh/sshd_config
# Cambiar Port 22 a otro puerto
sudo systemctl restart sshd
```

### 2. Configurar firewall básico
```bash
# Permitir solo lo necesario
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 7001/tcp
sudo ufw enable
```

### 3. Instalar fail2ban (protección contra ataques)
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 🐛 Troubleshooting

### El backend no inicia
```bash
# Ver logs detallados
docker-compose logs boxbet-server

# Revisar si el puerto está en uso
sudo lsof -i :7001

# Reiniciar todo
docker-compose down
docker-compose up -d --build
```

### Frontend no se conecta
1. Verifica que el puerto 7001 esté abierto:
   ```bash
   curl http://TU_IP_VPS:7001/health
   ```
2. Revisa la consola del navegador (F12) para ver errores
3. Verifica que `VITE_SOCKET_URL` esté correcto en Netlify
4. Asegúrate de haber redeplegado después de cambiar la variable

### Error de CORS
Si ves errores de CORS en la consola:
1. Verifica que `https://tu-sitio.netlify.app` esté en `allowedOrigins` en `server/index.ts`
2. Reconstruye el contenedor:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

### Contenedor se reinicia constantemente
```bash
# Ver qué está pasando
docker-compose logs -f boxbet-server

# Verificar health check
curl http://localhost:7001/health
```

---

## 📊 Monitoreo

### Ver cuánta memoria usa
```bash
docker stats boxbet-server --no-stream
```

### Ver salas activas
```bash
curl http://TU_IP_VPS:7001/health | jq
```

### Ver conexiones Socket.io
```bash
docker-compose logs boxbet-server | grep "Usuario conectado"
```

---

## 🎯 Checklist Final

- [ ] Backend desplegado en VPS (puerto 7001)
- [ ] Puerto 7001 abierto en firewall
- [ ] `/health` responde desde internet
- [ ] Variable `VITE_SOCKET_URL` configurada en Netlify
- [ ] Frontend redeplegado en Netlify
- [ ] Puedes crear y unirte a salas desde internet
- [ ] El juego funciona desde móviles/otros dispositivos

---

## 💡 Mejoras Futuras

1. **Dominio propio + SSL:**
   - Compra un dominio (ej: Namecheap ~$10/año)
   - Configura Nginx como reverse proxy
   - Instala Let's Encrypt SSL gratuito
   - Cambia a `https://api.tudominio.com`

2. **Monitoreo:**
   - Instala Portainer para gestión visual de Docker
   - Configura alertas con UptimeRobot

3. **Backups:**
   - Si en el futuro usas base de datos, configura backups automáticos

4. **Auto-deploy:**
   - Configura webhook de GitHub para auto-deploy en push

---

## 📞 Soporte

Si algo falla:
1. Revisa los logs: `docker-compose logs -f boxbet-server`
2. Verifica firewall: `sudo ufw status`
3. Prueba health check: `curl http://localhost:7001/health`
4. Revisa errores en consola del navegador (F12)
