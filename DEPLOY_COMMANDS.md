# 🚀 Comandos de Despliegue para VPS
## IP del VPS: 147.93.184.134

## 📋 Paso 1: Conectar al VPS

```bash
ssh root@147.93.184.134
```

## 📦 Paso 2: Preparar Directorio

```bash
# Crear directorio para el proyecto
mkdir -p ~/boxbet
cd ~/boxbet
```

## 📤 Paso 3: Subir Archivos (desde tu PC)

**Opción A - Usando Git:**
```bash
# En el VPS
cd ~/boxbet
git clone https://github.com/TU_USUARIO/BoxBet.git .
```

**Opción B - Usando SCP (desde tu PC en PowerShell):**
```powershell
# Subir archivos necesarios
scp docker-compose.yml root@147.93.184.134:~/boxbet/
scp -r server root@147.93.184.134:~/boxbet/
```

## 🐳 Paso 4: Levantar Docker

```bash
# En el VPS
cd ~/boxbet

# Construir y levantar el contenedor
docker-compose up -d --build

# Ver logs
docker-compose logs -f boxbet-server

# Presiona Ctrl+C para salir de los logs
```

## 🔥 Paso 5: Configurar Firewall

**Si tienes UFW (Ubuntu/Debian):**
```bash
sudo ufw allow 7001/tcp
sudo ufw status
```

**Si tienes firewalld (CentOS/RHEL):**
```bash
sudo firewall-cmd --permanent --add-port=7001/tcp
sudo firewall-cmd --reload
sudo firewall-cmd --list-ports
```

## ✅ Paso 6: Verificar

```bash
# Desde el VPS
curl http://localhost:7001/health

# Desde tu PC (PowerShell)
curl http://147.93.184.134:7001/health
```

Deberías ver algo como:
```json
{"status":"ok","timestamp":"2026-01-02T...","activeRooms":0,"uptime":123.45}
```

## 🌐 Paso 7: Configurar Netlify

### A. Editar archivo local
El archivo [.env.production](.env.production) ya está configurado con:
```
VITE_SOCKET_URL=http://147.93.184.134:7001
```

### B. Configurar en Netlify
1. Ve a tu sitio en **Netlify Dashboard**
2. **Site settings** → **Environment variables**
3. Click **Add a variable**
4. Agrega:
   - **Key:** `VITE_SOCKET_URL`
   - **Value:** `http://147.93.184.134:7001`
5. Click **Save**
6. **Deploys** → **Trigger deploy** → **Deploy site**

## 📊 Comandos Útiles

```bash
# Ver estado del contenedor
docker ps

# Ver logs en tiempo real
docker-compose logs -f boxbet-server

# Reiniciar el contenedor
docker-compose restart boxbet-server

# Detener
docker-compose down

# Actualizar código
git pull
docker-compose up -d --build

# Ver uso de recursos
docker stats boxbet-server
```

## 🔍 Troubleshooting

### Error: Puerto ya en uso
```bash
# Ver qué está usando el puerto 7001
sudo lsof -i :7001
# o
sudo netstat -tulpn | grep 7001

# Matar el proceso
sudo kill -9 [PID]
```

### Error: Cannot connect from frontend
```bash
# 1. Verificar que el contenedor está corriendo
docker ps | grep boxbet-server

# 2. Verificar el firewall
sudo ufw status | grep 7001

# 3. Probar desde el VPS
curl http://localhost:7001/health

# 4. Probar desde internet
curl http://147.93.184.134:7001/health

# 5. Ver logs del contenedor
docker-compose logs --tail=50 boxbet-server
```

### CORS Error
Verifica que en [server/index.ts](server/index.ts) el CORS incluye tu dominio de Netlify:
```typescript
origin: ['http://localhost:5173', 'http://localhost:5174', 'https://boxbet.netlify.app']
```

## 🎯 Checklist Completo

- [ ] Conectado al VPS (ssh root@147.93.184.134)
- [ ] Archivos subidos a ~/boxbet/
- [ ] Docker container corriendo (docker ps)
- [ ] Firewall puerto 7001 abierto
- [ ] Health check funciona desde VPS (curl localhost:7001/health)
- [ ] Health check funciona desde internet (curl 147.93.184.134:7001/health)
- [ ] Variable VITE_SOCKET_URL agregada en Netlify
- [ ] Frontend redeployado en Netlify
- [ ] Probado crear sala desde el frontend
- [ ] Probado unirse a sala desde otro dispositivo

## 🎮 Probar el Juego

1. Abre tu sitio de Netlify: `https://TU_SITIO.netlify.app`
2. Presiona F12 → Console
3. Deberías ver: `Socket connected`
4. Crea una sala
5. En otro dispositivo/navegador, únete con el código
6. ¡Juega!

---

**Documentación completa:** [DEPLOY_VPS.md](DEPLOY_VPS.md)
