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
  const totalValue = betAmount * 2; // Total del tablero (ambos jugadores)
  
  // Determinar tamaño del tablero según el total
  let gridSize: number;
  if (totalValue <= 10000) {
    gridSize = 3; // 9 celdas
  } else if (totalValue <= 30000) {
    gridSize = 4; // 16 celdas
  } else {
    gridSize = 5; // 25 celdas
  }

  const totalCells = gridSize * gridSize;
  const denominations: Array<100 | 200 | 500 | 1000 | 2000 | 5000> = [5000, 2000, 1000, 500, 200, 100];
  const coinValues: Array<100 | 200 | 500 | 1000 | 2000 | 5000> = [];
  
  let remaining = totalValue;
  
  // Algoritmo mejorado: usar greedy para la mayoría, ajustar al final
  while (coinValues.length < totalCells) {
    const cellsLeft = totalCells - coinValues.length;
    
    if (cellsLeft === 1) {
      // Última celda: poner exactamente el valor restante
      // Si remaining no es una denominación válida, necesitamos ajustar
      if (denominations.includes(remaining as any)) {
        coinValues.push(remaining as any);
        remaining = 0;
      } else {
        // Buscar la mayor denominación que quepa y ajustar retroactivamente
        const bestDenom = denominations.find(d => d <= remaining) || 100;
        coinValues.push(bestDenom);
        remaining -= bestDenom;
        
        // Si aún sobra, necesitamos ajustar monedas previas
        // Esto es un caso edge que idealmente no debería ocurrir con buena distribución
        if (remaining > 0) {
          console.warn(`Ajustando distribución: remaining=${remaining}`);
          // Agregar el restante a la última moneda si es posible
          const last = coinValues[coinValues.length - 1];
          const newValue = last + remaining;
          if (denominations.includes(newValue as any)) {
            coinValues[coinValues.length - 1] = newValue as any;
            remaining = 0;
          }
        }
      }
      break;
    }
    
    // Calcular el promedio necesario por celda restante
    const avgNeeded = remaining / cellsLeft;
    
    // Seleccionar la mejor denominación
    let bestDenom: 100 | 200 | 500 | 1000 | 2000 | 5000 = 100;
    let bestScore = Infinity;
    
    for (const denom of denominations) {
      // Verificar que podemos usar esta denominación
      const afterUsing = remaining - denom;
      const minNeededForRest = (cellsLeft - 1) * 100;
      
      if (denom <= remaining && afterUsing >= minNeededForRest) {
        // Score basado en qué tan cerca está del promedio
        const score = Math.abs(denom - avgNeeded);
        if (score < bestScore) {
          bestScore = score;
          bestDenom = denom;
        }
      }
    }
    
    coinValues.push(bestDenom);
    remaining -= bestDenom;
  }

  // Verificación final
  const sum = coinValues.reduce((acc, val) => acc + val, 0);
  console.log(`Apuesta total: ${totalValue}, Suma monedas: ${sum}, Celdas: ${totalCells}, Diferencia: ${sum - totalValue}`);
  
  // Si hay diferencia, ajustar
  if (sum !== totalValue) {
    const diff = totalValue - sum;
    console.warn(`Ajustando diferencia de ${diff}`);
    
    // Buscar una moneda que podamos ajustar
    for (let i = coinValues.length - 1; i >= 0; i--) {
      const currentValue = coinValues[i];
      const newValue = currentValue + diff;
      
      if (denominations.includes(newValue as any) && newValue > 0) {
        coinValues[i] = newValue as any;
        break;
      }
    }
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
