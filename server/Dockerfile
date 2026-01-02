# Dockerfile para BoxBet Server
FROM node:20-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache python3 make g++

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 7001

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=7001

# Comando para iniciar
CMD ["npm", "start"]
