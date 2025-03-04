import { io, Socket } from 'socket.io-client';
import { Position, Room } from '@/types/game';

type SocketResponse<T = undefined> = {
  success: boolean;
  error?: string;
} & (T extends undefined ? {} : Partial<{ [K in keyof T]: T[K] }>);

type RoomResponse = SocketResponse<{ room: Room }>;
type RoomsResponse = SocketResponse<{ rooms: Room[] }>;

interface SocketError extends Error {
  type?: string;
  description?: string;
  context?: any;
}

class SocketClient {
  private socket: Socket | null = null;
  private static instance: SocketClient;

  private constructor() {}

  static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  connect() {
    if (!this.socket) {
      console.log('Tentando conectar ao servidor WebSocket...');
      
      this.socket = io('http://localhost:3001', {
        transports: ['websocket', 'polling'],
      });

      this.setupEventHandlers();
    }
    return this.socket;
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Conectado ao servidor! ID:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Desconectado do servidor. Motivo:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erro de conexão:', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Funções para o jogo
  createRoom(): Promise<any> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: 'Não conectado ao servidor' });
        return;
      }
      this.socket.emit('create_room', resolve);
    });
  }

  joinRoom(roomId: string, preferredColor?: 'black' | 'white'): Promise<any> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: 'Não conectado ao servidor' });
        return;
      }
      this.socket.emit('join_room', { roomId, preferredColor }, resolve);
    });
  }

  makeMove(roomId: string, position: Position): Promise<any> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: 'Não conectado ao servidor' });
        return;
      }
      this.socket.emit('make_move', { roomId, position }, resolve);
    });
  }

  forfeitGame(roomId: string): Promise<any> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: 'Não conectado ao servidor' });
        return;
      }
      this.socket.emit('forfeit_game', { roomId }, resolve);
    });
  }

  resetGame(roomId: string): Promise<any> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: 'Não conectado ao servidor' });
        return;
      }
      this.socket.emit('reset_game', { roomId }, resolve);
    });
  }

  sendChatMessage(roomId: string, message: string): Promise<any> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: 'Não conectado ao servidor' });
        return;
      }
      this.socket.emit('send_message', { roomId, message }, resolve);
    });
  }

  getRooms(): Promise<any> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: 'Não conectado ao servidor', rooms: [] });
        return;
      }
      this.socket.emit('get_rooms', resolve);
    });
  }

  // Event listeners
  onRoomUpdated(callback: (room: Room) => void) {
    this.socket?.on('room_updated', callback);
  }

  removeRoomUpdatedListener() {
    this.socket?.off('room_updated');
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
  
  getSocket(): Socket | null {
    return this.socket;
  }
}

export default SocketClient; 