import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);

// Configuración de CORS para permitir tanto desarrollo local como producción
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://boxbet.netlify.app',
  'https://boxbet.147.93.184.134.nip.io'
  // Agregar aquí el dominio final de Netlify cuando lo tengas
];

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Permitir requests sin origin (como apps móviles o Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('Blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Tipos
interface Player {
  id: string;
  nickname: string;
  money: number;
  color: string;
}

interface Edge {
  row: number;
  col: number;
  type: 'horizontal' | 'vertical';
  playerId: string;
}

interface Coin {
  value: 100 | 200 | 500 | 1000 | 2000 | 5000;
  owner: string | null;
}

interface GameState {
  roomCode: string;
  betAmount: number;
  gridSize: number;
  players: Player[];
  currentTurn: number;
  diceValue: number | null;
  edgesPlaced: number;
  edges: Edge[];
  coins: Coin[][];
  gameStarted: boolean;
  gameEnded: boolean;
}

interface Room {
  code: string;
  game: GameState;
}

const rooms = new Map<string, Room>();

// Generar código de sala aleatorio
function generateRoomCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Generar tablero de monedas basado en la apuesta
function generateCoins(betAmount: number): { coins: Coin[][], gridSize: number } {
  // IMPORTANTE: El total en juego es la suma de las apuestas de ambos jugadores
  const totalValue = betAmount * 2;
  
  console.log(`💰 Apuesta individual: ${betAmount}, Total en juego: ${totalValue}`);
  
  // Determinar tamaño del tablero y denominaciones según el total del pozo
  let gridSize: number;
  let allowedDenominations: Array<100 | 200 | 500 | 1000 | 2000 | 5000>;
  
  if (totalValue >= 2000 && totalValue <= 5000) {
    // Rango 1: 2,000 a 5,000 - Solo monedas
    gridSize = 3; // 9 celdas
    allowedDenominations = [1000, 500, 200, 100];
    console.log('📊 Rango 1: Matriz 3x3 con monedas (100-1000)');
  } else if (totalValue > 5000 && totalValue <= 10000) {
    // Rango 2: 5,000 a 10,000 - Monedas + billetes de 2,000
    gridSize = 4; // 16 celdas
    allowedDenominations = [2000, 1000, 500, 200, 100];
    console.log('📊 Rango 2: Matriz 4x4 con monedas y billetes de 2,000');
  } else if (totalValue > 10000 && totalValue <= 20000) {
    // Rango 3: 10,000 a 20,000 - Monedas + billetes de 2,000 y 5,000
    gridSize = 5; // 25 celdas
    allowedDenominations = [5000, 2000, 1000, 500, 200, 100];
    console.log('📊 Rango 3: Matriz 5x5 con monedas y billetes de 2,000 y 5,000');
  } else {
    // Rango 4: 20,000 a 40,000+ - Todas las denominaciones
    gridSize = 5; // 25 celdas
    allowedDenominations = [5000, 2000, 1000, 500, 200, 100];
    console.log('📊 Rango 4: Matriz 5x5 con todas las denominaciones');
  }

  const totalCells = gridSize * gridSize;
  const minDenom = allowedDenominations[allowedDenominations.length - 1];
  const maxDenom = allowedDenominations[0];
  
  // Verificar que el total es alcanzable con las denominaciones permitidas
  if (totalValue < minDenom * totalCells || totalValue > maxDenom * totalCells) {
    console.error(`❌ ERROR: Total ${totalValue} no es alcanzable con ${totalCells} celdas y denominaciones ${allowedDenominations}`);
  }
  
  // NUEVO ALGORITMO: Distribución balanceada con ajuste final garantizado
  const coinValues: Array<100 | 200 | 500 | 1000 | 2000 | 5000> = [];
  
  // Paso 1: Calcular promedio ideal por celda
  const avgPerCell = totalValue / totalCells;
  console.log(`📐 Promedio por celda: ${avgPerCell}`);
  
  // Paso 2: Llenar con la denominación más cercana al promedio
  let remaining = totalValue;
  for (let i = 0; i < totalCells; i++) {
    const cellsLeft = totalCells - i;
    const neededAvg = remaining / cellsLeft;
    
    // Encontrar la denominación más cercana al promedio necesario
    let bestDenom = allowedDenominations[0];
    let bestDiff = Math.abs(allowedDenominations[0] - neededAvg);
    
    for (const denom of allowedDenominations) {
      const diff = Math.abs(denom - neededAvg);
      // Verificar que después de usar esta denominación, aún podemos alcanzar el total
      const afterUsing = remaining - denom;
      const cellsRemaining = cellsLeft - 1;
      const minPossible = cellsRemaining * minDenom;
      const maxPossible = cellsRemaining * maxDenom;
      
      if (afterUsing >= minPossible && afterUsing <= maxPossible && diff < bestDiff) {
        bestDiff = diff;
        bestDenom = denom;
      }
    }
    
    coinValues.push(bestDenom);
    remaining -= bestDenom;
  }
  
  // Paso 3: Ajuste final - GARANTIZAR que la suma sea exacta
  let currentSum = coinValues.reduce((acc, val) => acc + val, 0);
  let diff = totalValue - currentSum;
  
  console.log(`🔧 Suma inicial: ${currentSum}, Diferencia: ${diff}`);
  
  // Intentar ajustar hasta que la diferencia sea 0
  let attempts = 0;
  const maxAttempts = 100;
  
  while (diff !== 0 && attempts < maxAttempts) {
    attempts++;
    
    // Buscar una moneda que podamos cambiar para acercarnos al total
    let adjusted = false;
    
    for (let i = 0; i < coinValues.length && !adjusted; i++) {
      const currentValue = coinValues[i];
      
      // Intentar con cada denominación permitida
      for (const targetDenom of allowedDenominations) {
        if (targetDenom === currentValue) continue;
        
        const change = targetDenom - currentValue;
        
        // Si el cambio nos acerca al objetivo
        if (Math.abs(diff - change) < Math.abs(diff)) {
          coinValues[i] = targetDenom;
          diff -= change;
          adjusted = true;
          console.log(`✅ Ajuste ${attempts}: ${currentValue} → ${targetDenom} (diff restante: ${diff})`);
          break;
        }
      }
    }
    
    // Si no pudimos hacer ningún ajuste, intentar con pares
    if (!adjusted) {
      // Intentar intercambiar dos monedas simultáneamente
      for (let i = 0; i < coinValues.length - 1 && !adjusted; i++) {
        for (let j = i + 1; j < coinValues.length && !adjusted; j++) {
          const val1 = coinValues[i];
          const val2 = coinValues[j];
          
          for (const denom1 of allowedDenominations) {
            for (const denom2 of allowedDenominations) {
              const change = (denom1 - val1) + (denom2 - val2);
              
              if (change === diff) {
                coinValues[i] = denom1;
                coinValues[j] = denom2;
                diff = 0;
                adjusted = true;
                console.log(`✅ Ajuste doble: [${val1},${val2}] → [${denom1},${denom2}]`);
                break;
              }
            }
            if (adjusted) break;
          }
        }
      }
    }
    
    if (!adjusted) {
      console.warn(`⚠️ No se pudo ajustar en intento ${attempts}`);
      break;
    }
  }
  
  // Verificación final
  const finalSum = coinValues.reduce((acc, val) => acc + val, 0);
  
  if (finalSum !== totalValue) {
    console.error(`❌ ERROR CRÍTICO: La suma final (${finalSum}) no coincide con el total (${totalValue}) después de ${attempts} intentos`);
    console.error(`Valores generados:`, coinValues);
    
    // Último recurso: forzar ajuste en la última moneda
    const finalDiff = totalValue - finalSum;
    const lastValue = coinValues[coinValues.length - 1];
    const forcedValue = lastValue + finalDiff;
    
    if (allowedDenominations.includes(forcedValue as any)) {
      coinValues[coinValues.length - 1] = forcedValue as any;
      console.log(`🔨 Ajuste forzado: última moneda ${lastValue} → ${forcedValue}`);
    }
  } else {
    console.log(`✅ ÉXITO: Suma correcta = ${finalSum} después de ${attempts} ajustes`);
  }
  
  // Mezclar aleatoriamente
  for (let i = coinValues.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [coinValues[i], coinValues[j]] = [coinValues[j], coinValues[i]];
  }
  
  // Crear matriz de monedas
  const coins: Coin[][] = [];
  let index = 0;
  for (let row = 0; row < gridSize; row++) {
    coins[row] = [];
    for (let col = 0; col < gridSize; col++) {
      coins[row][col] = {
        value: coinValues[index++],
        owner: null
      };
    }
  }
  
  // Verificación final en la matriz
  const matrixSum = coins.flat().reduce((acc, coin) => acc + coin.value, 0);
  console.log(`🎲 Suma en matriz: ${matrixSum}`);

  return { coins, gridSize };
}

// Verificar si una moneda está completamente rodeada
function checkCoinComplete(
  row: number, 
  col: number, 
  edges: Edge[]
): boolean {
  // Una moneda necesita 4 aristas: arriba, abajo, izquierda, derecha
  const hasTop = edges.some(e => 
    e.type === 'horizontal' && e.row === row && e.col === col
  );
  const hasBottom = edges.some(e => 
    e.type === 'horizontal' && e.row === row + 1 && e.col === col
  );
  const hasLeft = edges.some(e => 
    e.type === 'vertical' && e.row === row && e.col === col
  );
  const hasRight = edges.some(e => 
    e.type === 'vertical' && e.row === row && e.col === col + 1
  );

  return hasTop && hasBottom && hasLeft && hasRight;
}

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Crear sala
  socket.on('create-room', (data: { nickname: string, betAmount: number }) => {
    const roomCode = generateRoomCode();
    const { coins, gridSize } = generateCoins(data.betAmount);
    
    const game: GameState = {
      roomCode,
      betAmount: data.betAmount,
      gridSize,
      players: [{
        id: socket.id,
        nickname: data.nickname,
        money: 0,
        color: '#FF6B6B'
      }],
      currentTurn: 0,
      diceValue: null,
      edgesPlaced: 0,
      edges: [],
      coins,
      gameStarted: false,
      gameEnded: false
    };

    rooms.set(roomCode, { code: roomCode, game });
    socket.join(roomCode);
    
    socket.emit('room-created', { roomCode, game });
    console.log(`Sala ${roomCode} creada por ${data.nickname}`);
  });

  // Unirse a sala
  socket.on('join-room', (data: { roomCode: string, nickname: string }) => {
    const room = rooms.get(data.roomCode);
    
    if (!room) {
      socket.emit('error', { message: 'Sala no encontrada' });
      return;
    }

    if (room.game.players.length >= 2) {
      socket.emit('error', { message: 'La sala está llena' });
      return;
    }

    if (room.game.gameStarted) {
      socket.emit('error', { message: 'El juego ya comenzó' });
      return;
    }

    room.game.players.push({
      id: socket.id,
      nickname: data.nickname,
      money: 0,
      color: '#4ECDC4'
    });

    socket.join(data.roomCode);
    
    // Confirmar al jugador que se unió
    socket.emit('room-joined', { roomCode: data.roomCode, game: room.game });
    
    // El juego comienza cuando hay 2 jugadores
    room.game.gameStarted = true;
    
    // Notificar a todos en la sala que el juego se actualizó
    io.to(data.roomCode).emit('game-updated', room.game);
    console.log(`${data.nickname} se unió a la sala ${data.roomCode}`);
  });

  // Tirar dado
  socket.on('roll-dice', (data: { roomCode: string }) => {
    const room = rooms.get(data.roomCode);
    if (!room) return;

    const game = room.game;
    const currentPlayer = game.players[game.currentTurn];
    
    if (currentPlayer.id !== socket.id) {
      socket.emit('error', { message: 'No es tu turno' });
      return;
    }

    if (game.diceValue !== null) {
      socket.emit('error', { message: 'Ya tiraste el dado' });
      return;
    }

    const diceValue = Math.floor(Math.random() * 6) + 1;
    game.diceValue = diceValue;
    game.edgesPlaced = 0;

    io.to(data.roomCode).emit('game-updated', game);
  });

  // Colocar arista
  socket.on('place-edge', (data: { 
    roomCode: string, 
    row: number, 
    col: number, 
    type: 'horizontal' | 'vertical' 
  }) => {
    const room = rooms.get(data.roomCode);
    if (!room) return;

    const game = room.game;
    const currentPlayer = game.players[game.currentTurn];
    
    if (currentPlayer.id !== socket.id) {
      socket.emit('error', { message: 'No es tu turno' });
      return;
    }

    if (game.diceValue === null) {
      socket.emit('error', { message: 'Debes tirar el dado primero' });
      return;
    }

    if (game.edgesPlaced >= game.diceValue) {
      socket.emit('error', { message: 'Ya colocaste todas tus aristas' });
      return;
    }

    // Verificar si la arista ya existe
    const edgeExists = game.edges.some(e => 
      e.row === data.row && e.col === data.col && e.type === data.type
    );

    if (edgeExists) {
      socket.emit('error', { message: 'Esta arista ya está ocupada' });
      return;
    }

    // Colocar arista
    game.edges.push({
      row: data.row,
      col: data.col,
      type: data.type,
      playerId: socket.id
    });

    game.edgesPlaced++;

    // Verificar si se completaron monedas
    const coinsCompleted: { row: number, col: number, value: number }[] = [];
    
    for (let row = 0; row < game.gridSize; row++) {
      for (let col = 0; col < game.gridSize; col++) {
        if (game.coins[row][col].owner === null) {
          if (checkCoinComplete(row, col, game.edges)) {
            game.coins[row][col].owner = socket.id;
            currentPlayer.money += game.coins[row][col].value;
            coinsCompleted.push({ row, col, value: game.coins[row][col].value });
          }
        }
      }
    }

    // Si completó todas las aristas del turno, cambiar turno
    if (game.edgesPlaced >= game.diceValue) {
      game.currentTurn = (game.currentTurn + 1) % game.players.length;
      game.diceValue = null;
      game.edgesPlaced = 0;
    }

    // Verificar si el juego terminó
    const allCoinsOwned = game.coins.every(row => 
      row.every(coin => coin.owner !== null)
    );

    if (allCoinsOwned) {
      game.gameEnded = true;
    }

    io.to(data.roomCode).emit('game-updated', game);
    
    if (coinsCompleted.length > 0) {
      io.to(data.roomCode).emit('coins-completed', { 
        playerId: socket.id,
        coins: coinsCompleted 
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
    
    // Eliminar jugador de todas las salas
    rooms.forEach((room, code) => {
      const playerIndex = room.game.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.game.players.splice(playerIndex, 1);
        
        if (room.game.players.length === 0) {
          rooms.delete(code);
          console.log(`Sala ${code} eliminada`);
        } else {
          io.to(code).emit('player-disconnected', { playerId: socket.id });
        }
      }
    });
  });
});

// Health check endpoint para verificar que el servidor esté funcionando
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeRooms: rooms.size,
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'BoxBet Socket.io Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      socket: '/socket.io'
    }
  });
});

const PORT = process.env.PORT || 7001;
httpServer.listen(PORT, () => {
  console.log(`✅ Servidor ejecutándose en http://0.0.0.0:${PORT}`);
  console.log(`📡 Socket.io listo en puerto ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🌍 Público: http://147.93.184.134:${PORT}`);
});
