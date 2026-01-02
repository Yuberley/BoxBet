#!/bin/bash

# Script de despliegue rápido para BoxBet Backend
# Uso: ./deploy-vps.sh TU_IP_VPS

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Debes proporcionar la IP del VPS"
    echo "Uso: ./deploy-vps.sh 123.456.789.10"
    exit 1
fi

VPS_IP=$1
VPS_USER=${2:-root}

echo "🚀 Desplegando BoxBet Backend en VPS"
echo "📍 IP: $VPS_IP"
echo "👤 Usuario: $VPS_USER"
echo ""

# Crear archivo temporal con archivos necesarios
echo "📦 Preparando archivos..."
tar -czf boxbet-deploy.tar.gz server/ docker-compose.yml

# Subir al VPS
echo "📤 Subiendo archivos al VPS..."
scp boxbet-deploy.tar.gz $VPS_USER@$VPS_IP:~/

# Ejecutar comandos en el VPS
echo "🔧 Configurando en el VPS..."
ssh $VPS_USER@$VPS_IP << 'ENDSSH'
    cd ~
    
    # Descomprimir
    tar -xzf boxbet-deploy.tar.gz
    rm boxbet-deploy.tar.gz
    
    # Detener contenedor anterior si existe
    docker-compose down 2>/dev/null || true
    
    # Construir y levantar
    docker-compose up -d --build
    
    # Esperar 5 segundos
    sleep 5
    
    # Verificar
    docker ps | grep boxbet-server
    
    # Probar health check
    curl -s http://localhost:7001/health
ENDSSH

# Limpiar archivo temporal
rm boxbet-deploy.tar.gz

echo ""
echo "✅ Despliegue completado!"
echo ""
echo "🔍 Verificar desde internet:"
echo "   curl http://$VPS_IP:7001/health"
echo ""
echo "📋 Ver logs:"
echo "   ssh $VPS_USER@$VPS_IP 'docker-compose logs -f boxbet-server'"
echo ""
echo "🌐 Configurar frontend:"
echo "   1. Edita .env.production:"
echo "      VITE_SOCKET_URL=http://$VPS_IP:7001"
echo "   2. Agrega la variable en Netlify"
echo "   3. Redeploy en Netlify"
