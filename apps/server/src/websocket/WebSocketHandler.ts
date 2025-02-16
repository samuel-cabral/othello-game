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
          const room = this.roomManager.createRoom(socket.id);
          callback({ success: true, room });
        } catch (error) {
          callback({ success: false, error: (error as Error).message });
        }
      });

      // Join room
      socket.on('join_room', (data, callback) => {
        try {
          const { roomId, preferredColor } = joinRoomSchema.parse(data);
          const room = this.roomManager.joinRoom(roomId, socket.id, preferredColor);
          
          socket.join(roomId);
          this.io.to(roomId).emit('room_updated', room);
          
          callback({ success: true, room });
        } catch (error) {
          callback({ success: false, error: (error as Error).message });
        }
      });

      // Make move
      socket.on('make_move', (data, callback) => {
        try {
          const { roomId, position } = moveSchema.parse(data);
          const moveSuccess = this.roomManager.makeMove(roomId, socket.id, position);
          
          if (moveSuccess) {
            const room = this.roomManager.getRoom(roomId);
            this.io.to(roomId).emit('room_updated', room);
            callback({ success: true });
          } else {
            callback({ success: false, error: 'Invalid move' });
          }
        } catch (error) {
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
        for (const room of rooms) {
          if (
            room.players.black === socket.id ||
            room.players.white === socket.id ||
            room.spectators.includes(socket.id)
          ) {
            this.roomManager.leaveRoom(room.id, socket.id);
            this.io.to(room.id).emit('room_updated', this.roomManager.getRoom(room.id));
          }
        }
      });
    });
  }
} 