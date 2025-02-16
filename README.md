# Othello Game Server

A WebSocket server for the Othello (Reversi) game, built with Node.js, TypeScript, Fastify, and Socket.IO.

## Features

- Real-time game updates using WebSocket
- Room-based multiplayer system
- Chat functionality
- Game state management
- Move validation
- Score tracking
- Spectator mode

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Start development server:
```bash
pnpm dev
```

3. Build for production:
```bash
pnpm build
```

4. Start production server:
```bash
pnpm start
```

## WebSocket Events

### Client -> Server

- `create_room`: Create a new game room
  ```typescript
  socket.emit('create_room', callback: (response: { success: boolean, room?: Room, error?: string }) => void)
  ```

- `join_room`: Join an existing room
  ```typescript
  socket.emit('join_room', {
    roomId: string,
    preferredColor?: 'black' | 'white'
  }, callback: (response: { success: boolean, room?: Room, error?: string }) => void)
  ```

- `make_move`: Make a move in the game
  ```typescript
  socket.emit('make_move', {
    roomId: string,
    position: { row: number, col: number }
  }, callback: (response: { success: boolean, error?: string }) => void)
  ```

- `forfeit`: Forfeit the current game
  ```typescript
  socket.emit('forfeit', roomId: string, callback: (response: { success: boolean, error?: string }) => void)
  ```

- `chat_message`: Send a chat message
  ```typescript
  socket.emit('chat_message', {
    roomId: string,
    message: string
  }, callback: (response: { success: boolean, error?: string }) => void)
  ```

- `reset_game`: Reset the game in a room
  ```typescript
  socket.emit('reset_game', roomId: string, callback: (response: { success: boolean, error?: string }) => void)
  ```

- `get_rooms`: Get list of available rooms
  ```typescript
  socket.emit('get_rooms', callback: (response: { success: boolean, rooms?: Room[], error?: string }) => void)
  ```

### Server -> Client

- `room_updated`: Sent when room state changes (moves, chat, players joining/leaving)
  ```typescript
  socket.on('room_updated', (room: Room) => void)
  ```

## Game Rules

1. The game is played on an 8x8 board
2. Players take turns placing pieces on the board
3. Black moves first
4. A valid move must capture at least one opponent's piece
5. Captured pieces are flipped to the current player's color
6. Game ends when:
   - No valid moves are available for either player
   - The board is full
   - A player forfeits
7. The player with the most pieces wins

## Types

### Room
```typescript
{
  id: string;
  players: {
    black?: string;
    white?: string;
  };
  spectators: string[];
  gameState: GameState;
  chat: ChatMessage[];
}
```

### GameState
```typescript
{
  board: Cell[][];
  currentPlayer: 'black' | 'white';
  blackScore: number;
  whiteScore: number;
  isGameOver: boolean;
  winner: 'black' | 'white' | 'draw' | null;
  lastMove: Position | null;
}
```

### ChatMessage
```typescript
{
  playerId: string;
  message: string;
  timestamp: number;
}
```

## Error Handling

All WebSocket events include error handling through the callback function. Possible errors include:
- Room already exists
- Room not found
- Player already in a room
- Invalid move
- Not player's turn
- Game is over
- Color already taken
