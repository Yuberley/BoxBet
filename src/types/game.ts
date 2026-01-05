export interface Player {
  id: string;
  nickname: string;
  money: number;
  color: string;
  avatarId?: string; // ID del avatar predefinido
}

export interface Edge {
  row: number;
  col: number;
  type: 'horizontal' | 'vertical';
  playerId: string;
}

export interface Coin {
  value: 100 | 200 | 500 | 1000 | 2000 | 5000;
  owner: string | null;
}

export interface GameState {
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

export interface BetOption {
  label: string;
  value: number;
}

export const BET_OPTIONS: BetOption[] = [
  { label: "1.000 COP", value: 1000 },
  { label: "5.000 COP", value: 5000 },
  { label: "10.000 COP", value: 10000 },
  { label: "20.000 COP", value: 20000 }
];
