import { io, Socket } from 'socket.io-client';
import type { GameState } from '../types/game';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return this.socket;

    this.socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
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
