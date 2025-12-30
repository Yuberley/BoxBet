# 💰 BoxBet - Juego de Monedas Colombianas

Prueba de concepto de un juego multijugador en tiempo real donde dos jugadores compiten por capturar monedas colombianas colocando aristas alrededor de ellas.

## 🎮 Características

- **Juego en tiempo real**: Conexión instantánea entre dos jugadores
- **Sistema de salas**: Crea o únete a una sala con código de 4 dígitos
- **Monedas colombianas**: Valores de 100, 200, 500 y 1000 pesos
- **Mecánica de dado**: Tira el dado para determinar cuántas aristas puedes colocar
- **Tablero dinámico**: El tamaño del tablero depende del monto de apuesta (3x3 a 5x5)
- **Interfaz moderna**: Diseño minimalista con animaciones suaves
- **Efectos de sonido**: Feedback auditivo para las acciones del juego

## 🚀 Instalación

### Prerrequisitos
- Node.js (v18 o superior)
- npm o yarn

### Pasos de instalación

1. Clona el repositorio (o ya lo tienes abierto)

2. Instala las dependencias:
```bash
npm install
```

## 🎯 Cómo ejecutar

### Opción 1: Ejecutar todo con un solo comando
```bash
npm run dev:all
```

Este comando inicia tanto el servidor backend (puerto 3001) como el cliente frontend (puerto 5173).

### Opción 2: Ejecutar por separado

**Terminal 1 - Servidor:**
```bash
npm run server
```

**Terminal 2 - Cliente:**
```bash
npm run dev
```

## 🎲 Cómo jugar

### Crear una sala

1. Abre tu navegador en `http://localhost:5173`
2. Haz clic en "Crear Sala"
3. Ingresa tu nickname
4. Selecciona el monto de apuesta:
   - 5.000 COP
   - 10.000 COP
   - 20.000 COP
   - 50.000 COP
   - 100.000 COP
5. Comparte el código de 4 dígitos con tu oponente

### Unirse a una sala

1. Abre tu navegador en `http://localhost:5173`
2. Haz clic en "Unirse a Sala"
3. Ingresa tu nickname
4. Ingresa el código de sala de 4 dígitos
5. ¡Comienza a jugar!

### Mecánica del juego

1. **Turnos alternados**: Los jugadores se turnan para jugar
2. **Tirar el dado**: En tu turno, haz clic en "Tirar Dado" para obtener un número del 1 al 6
3. **Colocar aristas**: Debes colocar exactamente la cantidad de aristas que te salió en el dado
4. **Capturar monedas**: Cuando completas las 4 aristas alrededor de una moneda, la capturas
5. **Ganar**: El jugador con más dinero acumulado al final gana

### Valores de las monedas

- 🟡 100 pesos
- 🟠 200 pesos
- 🔵 500 pesos
- 🟣 1000 pesos

## 🛠️ Tecnologías utilizadas

### Frontend
- React 19
- TypeScript
- Socket.io Client
- Vite
- CSS3 con animaciones

### Backend
- Node.js
- Express
- Socket.io
- TypeScript

## 📁 Estructura del proyecto

```
BoxBet/
├── src/
│   ├── components/
│   │   ├── GameSetup.tsx       # Pantalla de inicio
│   │   ├── WaitingRoom.tsx     # Sala de espera
│   │   └── GameBoard.tsx       # Tablero de juego
│   ├── services/
│   │   └── socket.ts           # Cliente Socket.io
│   ├── types/
│   │   └── game.ts             # Tipos TypeScript
│   ├── App.tsx                 # Componente principal
│   └── main.tsx                # Punto de entrada
├── server/
│   └── index.ts                # Servidor Socket.io
└── package.json
```

## 🎨 Características visuales

- Gradientes modernos en púrpura y azul
- Animaciones suaves al colocar aristas
- Efecto de celebración al capturar monedas
- Indicador visual del turno actual
- Modal de fin de juego con podio de ganadores

## 🔊 Efectos de sonido

El juego incluye sonidos simples generados con Web Audio API para:
- Inicio del juego
- Captura de monedas
- Tirada de dados
- Colocación de aristas

## 🐛 Solución de problemas

### El servidor no se conecta
- Verifica que el puerto 3001 no esté en uso
- Asegúrate de que el servidor esté ejecutándose con `npm run server`

### El cliente no puede conectarse
- Verifica que el servidor esté ejecutándose primero
- Confirma que la URL del servidor en `src/services/socket.ts` sea `http://localhost:3001`

### Error de CORS
- El servidor ya está configurado con CORS para permitir conexiones desde `http://localhost:5173`

## 📝 Notas de desarrollo

Esta es una **prueba de concepto** diseñada para demostrar:
- Conectividad en tiempo real con Socket.io
- Sincronización de estado del juego entre múltiples clientes
- Sistema de salas para emparejar jugadores
- Lógica de juego compleja con turnos y validaciones
- Interfaz de usuario moderna y responsiva

## 🚧 Mejoras futuras posibles

- Modo de juego contra IA
- Sistema de ranking y estadísticas
- Chat en tiempo real
- Partidas con más de 2 jugadores
- Torneos y ligas
- Personalización de avatares
- Efectos de sonido más elaborados
- Animaciones 3D para las monedas

## 📄 Licencia

Este proyecto es una prueba de concepto educativa.

---

¡Disfruta jugando BoxBet! 🎉
