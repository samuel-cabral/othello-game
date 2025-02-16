import { Room, Player, Position, ChatMessage } from './types';
import { OthelloGame } from './OthelloGame';

export class RoomManager {
  private rooms: Map<string, Room>;

  constructor() {
    this.rooms = new Map();
  }

  public createRoom(roomId: string): Room {
    if (this.rooms.has(roomId)) {
      throw new Error('Room already exists');
    }

    const room: Room = {
      id: roomId,
      players: {},
      spectators: [],
      gameState: new OthelloGame().getState(),
      chat: [],
    };

    this.rooms.set(roomId, room);
    return room;
  }

  public joinRoom(roomId: string, playerId: string, preferredColor?: Player): Room {
    const room = this.getRoom(roomId);

    if (this.isPlayerInAnyRoom(playerId)) {
      throw new Error('Player is already in a room');
    }

    // If player is requesting a specific color
    if (preferredColor) {
      if (room.players[preferredColor]) {
        throw new Error(`Color ${preferredColor} is already taken`);
      }
      room.players[preferredColor] = playerId;
      return room;
    }

    // Assign player to any available color
    if (!room.players.black) {
      room.players.black = playerId;
    } else if (!room.players.white) {
      room.players.white = playerId;
    } else {
      room.spectators.push(playerId);
    }

    return room;
  }

  public leaveRoom(roomId: string, playerId: string): void {
    const room = this.getRoom(roomId);

    // Remove from players
    if (room.players.black === playerId) {
      room.players.black = undefined;
    } else if (room.players.white === playerId) {
      room.players.white = undefined;
    } else {
      // Remove from spectators
      const spectatorIndex = room.spectators.indexOf(playerId);
      if (spectatorIndex !== -1) {
        room.spectators.splice(spectatorIndex, 1);
      }
    }

    // Delete room if empty
    if (!room.players.black && !room.players.white && room.spectators.length === 0) {
      this.rooms.delete(roomId);
    }
  }

  public makeMove(roomId: string, playerId: string, position: Position): boolean {
    const room = this.getRoom(roomId);
    const game = new OthelloGame();
    game.getState().board = room.gameState.board;
    game.getState().currentPlayer = room.gameState.currentPlayer;

    // Determine player's color
    let playerColor: Player | undefined;
    if (room.players.black === playerId) playerColor = 'black';
    if (room.players.white === playerId) playerColor = 'white';

    if (!playerColor) {
      throw new Error('Player is not in this game');
    }

    const moveSuccess = game.makeMove(position, playerColor);
    if (moveSuccess) {
      room.gameState = game.getState();
    }

    return moveSuccess;
  }

  public forfeitGame(roomId: string, playerId: string): void {
    const room = this.getRoom(roomId);
    const game = new OthelloGame();
    game.getState().board = room.gameState.board;

    // Determine player's color
    let playerColor: Player | undefined;
    if (room.players.black === playerId) playerColor = 'black';
    if (room.players.white === playerId) playerColor = 'white';

    if (!playerColor) {
      throw new Error('Player is not in this game');
    }

    game.forfeit(playerColor);
    room.gameState = game.getState();
  }

  public addChatMessage(roomId: string, playerId: string, message: string): void {
    const room = this.getRoom(roomId);
    const chatMessage: ChatMessage = {
      playerId,
      message,
      timestamp: Date.now(),
    };
    room.chat.push(chatMessage);
  }

  public resetGame(roomId: string): void {
    const room = this.getRoom(roomId);
    const game = new OthelloGame();
    room.gameState = game.getState();
  }

  public getRoom(roomId: string): Room {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    return room;
  }

  private isPlayerInAnyRoom(playerId: string): boolean {
    for (const room of this.rooms.values()) {
      if (
        room.players.black === playerId ||
        room.players.white === playerId ||
        room.spectators.includes(playerId)
      ) {
        return true;
      }
    }
    return false;
  }

  public getRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
} 