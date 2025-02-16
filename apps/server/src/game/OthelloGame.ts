import { Cell, GameState, Player, Position } from './types';

export class OthelloGame {
  private state: GameState;
  private readonly BOARD_SIZE = 8;

  constructor() {
    this.state = this.initializeGame();
  }

  private initializeGame(): GameState {
    const board: Cell[][] = Array(this.BOARD_SIZE)
      .fill(null)
      .map(() => Array(this.BOARD_SIZE).fill(null));

    // Set up initial pieces
    const center = this.BOARD_SIZE / 2;
    board[center - 1][center - 1] = 'white';
    board[center - 1][center] = 'black';
    board[center][center - 1] = 'black';
    board[center][center] = 'white';

    return {
      board,
      currentPlayer: 'black', // Black always starts
      blackScore: 2,
      whiteScore: 2,
      isGameOver: false,
      winner: null,
      lastMove: null,
    };
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public isValidMove(position: Position, player: Player): boolean {
    const { row, col } = position;

    // Check if position is within bounds
    if (
      row < 0 ||
      row >= this.BOARD_SIZE ||
      col < 0 ||
      col >= this.BOARD_SIZE
    ) {
      return false;
    }

    // Check if cell is already occupied
    if (this.state.board[row][col] !== null) {
      return false;
    }

    // Check all directions for valid moves
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    return directions.some(([dx, dy]) => 
      this.wouldFlipInDirection(row, col, dx, dy, player)
    );
  }

  private wouldFlipInDirection(
    row: number,
    col: number,
    dx: number,
    dy: number,
    player: Player
  ): boolean {
    let x = row + dx;
    let y = col + dy;
    let flips = 0;

    while (
      x >= 0 &&
      x < this.BOARD_SIZE &&
      y >= 0 &&
      y < this.BOARD_SIZE
    ) {
      const cell = this.state.board[x][y];
      if (cell === null) return false;
      if (cell === player) return flips > 0;
      flips++;
      x += dx;
      y += dy;
    }

    return false;
  }

  public makeMove(position: Position, player: Player): boolean {
    if (
      this.state.isGameOver ||
      player !== this.state.currentPlayer ||
      !this.isValidMove(position, player)
    ) {
      return false;
    }

    const { row, col } = position;
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    // Place the piece and flip other pieces
    this.state.board[row][col] = player;
    directions.forEach(([dx, dy]) => {
      if (this.wouldFlipInDirection(row, col, dx, dy, player)) {
        this.flipInDirection(row, col, dx, dy, player);
      }
    });

    // Update scores
    this.updateScores();

    // Update last move
    this.state.lastMove = position;

    // Switch current player
    this.state.currentPlayer = player === 'black' ? 'white' : 'black';

    // Check if game is over
    this.checkGameOver();

    return true;
  }

  private flipInDirection(
    row: number,
    col: number,
    dx: number,
    dy: number,
    player: Player
  ): void {
    let x = row + dx;
    let y = col + dy;

    const toFlip: Position[] = [];

    while (
      x >= 0 &&
      x < this.BOARD_SIZE &&
      y >= 0 &&
      y < this.BOARD_SIZE
    ) {
      const cell = this.state.board[x][y];
      if (cell === null) break;
      if (cell === player) {
        toFlip.forEach(({ row, col }) => {
          this.state.board[row][col] = player;
        });
        break;
      }
      toFlip.push({ row: x, col: y });
      x += dx;
      y += dy;
    }
  }

  private updateScores(): void {
    let blackCount = 0;
    let whiteCount = 0;

    for (let row = 0; row < this.BOARD_SIZE; row++) {
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        const cell = this.state.board[row][col];
        if (cell === 'black') blackCount++;
        if (cell === 'white') whiteCount++;
      }
    }

    this.state.blackScore = blackCount;
    this.state.whiteScore = whiteCount;
  }

  private hasValidMoves(player: Player): boolean {
    for (let row = 0; row < this.BOARD_SIZE; row++) {
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        if (this.isValidMove({ row, col }, player)) {
          return true;
        }
      }
    }
    return false;
  }

  private checkGameOver(): void {
    const currentPlayerHasMoves = this.hasValidMoves(this.state.currentPlayer);
    const otherPlayer = this.state.currentPlayer === 'black' ? 'white' : 'black';
    const otherPlayerHasMoves = this.hasValidMoves(otherPlayer);

    if (!currentPlayerHasMoves && !otherPlayerHasMoves) {
      this.state.isGameOver = true;
      if (this.state.blackScore > this.state.whiteScore) {
        this.state.winner = 'black';
      } else if (this.state.whiteScore > this.state.blackScore) {
        this.state.winner = 'white';
      } else {
        this.state.winner = 'draw';
      }
    } else if (!currentPlayerHasMoves) {
      // Skip turn if current player has no valid moves
      this.state.currentPlayer = otherPlayer;
    }
  }

  public forfeit(player: Player): void {
    this.state.isGameOver = true;
    this.state.winner = player === 'black' ? 'white' : 'black';
  }

  public reset(): void {
    this.state = this.initializeGame();
  }
} 