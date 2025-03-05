import { Server, Socket } from 'socket.io';
import { RoomManager } from '../game/RoomManager';
import { Player, Position } from '../game/types';
import { z } from 'zod';

const joinRoomSchema = z.object({
  roomId: z.string(),
  preferredColor: z.enum(['black', 'white']).optional(),
});

const moveSchema = z.object({
  roomId: z.string(),
  position: z.object({
    row: z.number().min(0).max(7),
    col: z.number().min(0).max(7),
  }),
});

const chatSchema = z.object({
  roomId: z.string(),
  message: z.string().min(1).max(500),
});

export class WebSocketHandler {
  private roomManager: RoomManager;

  constructor(private io: Server) {
    this.roomManager = new RoomManager();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Create room
      socket.on('create_room', (callback) => {
        try {
          console.log(`Player ${socket.id} is creating a room`);
          
          // Gerar um ID de sala único (usando o timestamp + random)
          const roomId = `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          
          // Criar a sala e adicionar o jogador como preto
          const room = this.roomManager.createRoom(roomId);
          
          // Adicionar o jogador à sala
          this.roomManager.joinRoom(roomId, socket.id, 'black');
          
          // Adicionar o socket à sala também no Socket.IO
          socket.join(roomId);
          console.log(`Player ${socket.id} joined room ${roomId} as creator`);
          
          // Obter a sala atualizada
          const updatedRoom = this.roomManager.getRoom(roomId);
          
          // Emitir evento room_updated para todos na sala (neste caso, apenas o criador)
          this.io.to(roomId).emit('room_updated', updatedRoom);
          console.log(`Room ${roomId} created with players:`, updatedRoom.players);
          
          callback({ success: true, room: updatedRoom });
        } catch (error) {
          console.error(`Error creating room:`, error);
          callback({ success: false, error: (error as Error).message });
        }
      });

      // Join room
      socket.on('join_room', (data, callback) => {
        try {
          const { roomId, preferredColor } = joinRoomSchema.parse(data);
          console.log(`Player ${socket.id} is joining room ${roomId} with preferred color ${preferredColor || 'none'}`);
          
          const room = this.roomManager.joinRoom(roomId, socket.id, preferredColor);
          
          socket.join(roomId);
          console.log(`Player ${socket.id} joined room ${roomId} successfully`);
          console.log(`Room ${roomId} now has players:`, room.players);
          
          this.io.to(roomId).emit('room_updated', room);
          
          callback({ success: true, room });
        } catch (error) {
          console.error(`Error joining room:`, error);
          callback({ success: false, error: (error as Error).message });
        }
      });

      // Make move
      socket.on('make_move', (data, callback) => {
        try {
          const { roomId, position } = moveSchema.parse(data);
          console.log(`Player ${socket.id} attempting move at position (${position.row},${position.col}) in room ${roomId}`);
          
          // Obter a sala e verificar o estado atual para depuração
          const room = this.roomManager.getRoom(roomId);
          console.log(`Current player in game state: ${room.gameState.currentPlayer}`);
          
          const moveSuccess = this.roomManager.makeMove(roomId, socket.id, position);
          
          if (moveSuccess) {
            const updatedRoom = this.roomManager.getRoom(roomId);
            console.log(`Move successful! New current player: ${updatedRoom.gameState.currentPlayer}`);
            this.io.to(roomId).emit('room_updated', updatedRoom);
            callback({ success: true });
          } else {
            console.log(`Invalid move! Position may not be valid for ${room.gameState.currentPlayer}`);
            callback({ success: false, error: 'Invalid move' });
          }
        } catch (error) {
          console.error(`Error in make_move:`, error);
          callback({ success: false, error: (error as Error).message });
        }
      });

      // Forfeit game
      socket.on('forfeit', (roomId: string, callback) => {
        try {
          this.roomManager.forfeitGame(roomId, socket.id);
          const room = this.roomManager.getRoom(roomId);
          this.io.to(roomId).emit('room_updated', room);
          callback({ success: true });
        } catch (error) {
          callback({ success: false, error: (error as Error).message });
        }
      });

      // Send chat message
      socket.on('chat_message', (data, callback) => {
        try {
          const { roomId, message } = chatSchema.parse(data);
          this.roomManager.addChatMessage(roomId, socket.id, message);
          const room = this.roomManager.getRoom(roomId);
          this.io.to(roomId).emit('room_updated', room);
          callback({ success: true });
        } catch (error) {
          callback({ success: false, error: (error as Error).message });
        }
      });

      // Reset game
      socket.on('reset_game', (roomId: string, callback) => {
        try {
          this.roomManager.resetGame(roomId);
          const room = this.roomManager.getRoom(roomId);
          this.io.to(roomId).emit('room_updated', room);
          callback({ success: true });
        } catch (error) {
          callback({ success: false, error: (error as Error).message });
        }
      });

      // Get available rooms
      socket.on('get_rooms', (callback) => {
        try {
          const rooms = this.roomManager.getRooms();
          callback({ success: true, rooms });
        } catch (error) {
          callback({ success: false, error: (error as Error).message });
        }
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        // Find and leave any rooms the player is in
        const rooms = this.roomManager.getRooms();
        console.log(`Checking ${rooms.length} rooms for player ${socket.id}`);
        
        for (const room of rooms) {
          if (
            room.players.black === socket.id ||
            room.players.white === socket.id ||
            room.spectators.includes(socket.id)
          ) {
            console.log(`Player ${socket.id} is leaving room ${room.id}`);
            console.log(`Room ${room.id} before leaving:`, JSON.stringify(room.players));
            
            this.roomManager.leaveRoom(room.id, socket.id);
            
            try {
              const updatedRoom = this.roomManager.getRoom(room.id);
              console.log(`Room ${room.id} after leaving:`, JSON.stringify(updatedRoom.players));
              this.io.to(room.id).emit('room_updated', updatedRoom);
            } catch (error) {
              console.log(`Room ${room.id} was deleted after player left`);
            }
          }
        }
      });
    });
  }
} 