# Othello Game

A real-time multiplayer Othello (Reversi) game built with Next.js and Socket.IO.

## Project Structure

- `apps/server`: Backend server using Fastify and Socket.IO
- `apps/web`: Frontend web application using Next.js

## Testing on Multiple Devices in Local Network

### Step 1: Configure the Local Network IP

1. Find your local network IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1
   ```
   
2. Update the IP address in these files:
   - `apps/web/.env.local`: Update `NEXT_PUBLIC_SERVER_URL` with your local IP
   - `apps/server/src/server.ts`: Update the `networkIP` variable with your local IP

### Step 2: Start the Server

```bash
cd apps/server
npm run dev
```

The server will start and display URLs for both local and network access.

### Step 3: Start the Web Client

```bash
cd apps/web
npm run dev
```

### Step 4: Access the Game

1. On your development computer:
   - Open a browser and go to `http://localhost:3000`

2. On other devices in the same network:
   - Open a browser and go to `http://YOUR_LOCAL_IP:3000`
   - For example: `http://10.0.0.170:3000`

3. Create a room on one device and join it from the other device

## Game Rules

- The goal is to have the most pieces of your color on the board at the end
- Black always moves first
- A valid move must capture at least one opponent piece
- To capture: place your piece such that one or more opponent pieces are "sandwiched" between your new piece and another of your pieces
- The game ends when neither player can make a valid move (board full or no valid moves)
- The player with the most pieces wins

## Development Commands

```bash
# Start the server
cd apps/server
npm run dev

# Start the web client
cd apps/web
npm run dev
```

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
