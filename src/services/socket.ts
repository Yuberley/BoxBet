import { io, Socket } from 'socket.io-client';
import type { GameState } from '../types/game';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return this.socket;

    // Usar variable de entorno o localhost por defecto
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:7001';
    
    console.log('🔌 Conectando a Socket.IO:', socketUrl);
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000
    });

    // Event listeners para debugging
    this.socket.on('connect', () => {
      console.log('✅ Conectado a Socket.IO');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión Socket.IO:', error.message);
      console.log('💡 Asegúrate de que el servidor esté corriendo en', socketUrl);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Desconectado de Socket.IO:', reason);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconectado después de', attemptNumber, 'intentos');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  // Crear sala
  createRoom(nickname: string, betAmount: number) {
    this.socket?.emit('create-room', { nickname, betAmount });
  }

  // Unirse a sala
  joinRoom(roomCode: string, nickname: string) {
    this.socket?.emit('join-room', { roomCode, nickname });
  }

  // Tirar dado
  rollDice(roomCode: string) {
    this.socket?.emit('roll-dice', { roomCode });
  }

  // Colocar arista
  placeEdge(roomCode: string, row: number, col: number, type: 'horizontal' | 'vertical') {
    this.socket?.emit('place-edge', { roomCode, row, col, type });
  }

  // Listeners
  onRoomCreated(callback: (data: { roomCode: string; game: GameState }) => void) {
    this.socket?.on('room-created', callback);
  }

  onRoomJoined(callback: (data: { roomCode: string; game: GameState }) => void) {
    this.socket?.on('room-joined', callback);
  }

  onGameUpdated(callback: (game: GameState) => void) {
    this.socket?.on('game-updated', callback);
  }

  onCoinsCompleted(callback: (data: { playerId: string; coins: Array<{ row: number; col: number; value: number }> }) => void) {
    this.socket?.on('coins-completed', callback);
  }

  onPlayerDisconnected(callback: (data: { playerId: string }) => void) {
    this.socket?.on('player-disconnected', callback);
  }

  onError(callback: (data: { message: string }) => void) {
    this.socket?.on('error', callback);
  }

  // Remover listeners
  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

export default new SocketService();
