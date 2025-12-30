import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
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
  value: 100 | 200 | 500 | 1000;
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
  // Determinar tamaño del tablero según la apuesta
  let gridSize: number;
  const totalValue = betAmount * 2; // Total del tablero (ambos jugadores)
  
  if (totalValue <= 10000) {
    gridSize = 3;
  } else if (totalValue <= 30000) {
    gridSize = 4;
  } else {
    gridSize = 5;
  }

  const denominations: Array<100 | 200 | 500 | 1000> = [1000, 500, 200, 100]; // Ordenado de mayor a menor
  const coins: Coin[][] = [];
  const totalCells = gridSize * gridSize;
  const coinValues: Array<100 | 200 | 500 | 1000> = [];
  
  let remaining = totalValue;
  
  // Estrategia: usar monedas grandes primero, luego ajustar con monedas más pequeñas
  // Llenar el tablero mientras queden espacios y dinero
  while (coinValues.length < totalCells && remaining > 0) {
    if (coinValues.length === totalCells - 1) {
      // Última moneda: debe ser exactamente el valor restante
      if (remaining === 100 || remaining === 200 || remaining === 500 || remaining === 1000) {
        coinValues.push(remaining as 100 | 200 | 500 | 1000);
        remaining = 0;
      } else if (remaining >= 1000) {
        coinValues.push(1000);
        remaining -= 1000;
      } else if (remaining >= 500) {
        coinValues.push(500);
        remaining -= 500;
      } else if (remaining >= 200) {
        coinValues.push(200);
        remaining -= 200;
      } else {
        coinValues.push(100);
        remaining -= 100;
      }
    } else {
      // Intentar usar la denominación más grande posible que quepa
      let added = false;
      for (const denom of denominations) {
        // Verificar que con esta moneda no nos quedemos sin opciones para las celdas restantes
        const cellsLeft = totalCells - coinValues.length - 1;
        const minRemainingNeeded = cellsLeft * 100; // Mínimo valor para llenar celdas restantes
        
        if (denom <= remaining && (remaining - denom) >= minRemainingNeeded) {
          coinValues.push(denom);
          remaining -= denom;
          added = true;
          break;
        }
      }
      
      // Si no pudimos agregar ninguna, usar la más pequeña
      if (!added) {
        coinValues.push(100);
        remaining -= 100;
      }
    }
  }
  
  // Si sobra dinero, distribuirlo aumentando valores de monedas existentes
  while (remaining > 0 && coinValues.length > 0) {
    for (let i = 0; i < coinValues.length && remaining > 0; i++) {
      const current = coinValues[i];
      if (current === 100 && remaining >= 100) {
        coinValues[i] = 200;
        remaining -= 100;
      } else if (current === 200 && remaining >= 300) {
        coinValues[i] = 500;
        remaining -= 300;
      } else if (current === 500 && remaining >= 500) {
        coinValues[i] = 1000;
        remaining -= 500;
      }
    }
    // Si no pudimos distribuir más, salir
    if (remaining > 0) {
      // Agregar monedas de 100 si aún hay espacio
      if (coinValues.length < totalCells) {
        coinValues.push(100);
        remaining -= 100;
      } else {
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

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`✅ Servidor ejecutándose en http://localhost:${PORT}`);
});
