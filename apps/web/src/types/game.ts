export type Player = 'black' | 'white';
export type Cell = Player | null;
export type Position = {
  row: number;
  col: number;
};

export type GameState = {
  board: Cell[][];
  currentPlayer: Player;
  blackScore: number;
  whiteScore: number;
  isGameOver: boolean;
  winner: Player | 'draw' | null;
  lastMove: Position | null;
};

export type GameMove = {
  position: Position;
  player: Player;
};

export type Room = {
  id: string;
  players: {
    black?: string;
    white?: string;
  };
  spectators: string[];
  gameState: GameState;
  chat: ChatMessage[];
};

export type ChatMessage = {
  playerId: string;
  message: string;
  timestamp: number;
}; 