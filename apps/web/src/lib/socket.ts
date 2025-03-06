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
      
      // Get the server URL from environment or fallback to localhost
      const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';
      console.log(`Connecting to server at: ${SERVER_URL}`);
      
      this.socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 30000, // Match server timeout
        autoConnect: true
      });

      this.setupEventHandlers();
    } else if (!this.socket.connected) {
      // If socket exists but is not connected, attempt to reconnect
      console.log('Socket exists but not connected. Attempting to reconnect...');
      this.socket.connect();
    }
    return this.socket;
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server! Socket ID:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server. Reason:', reason);
      
      // Handle transport close errors by attempting to reconnect with polling
      if (reason === 'transport close' || reason === 'transport error') {
        console.log('Attempting to reconnect with fallback to polling...');
        if (this.socket) {
          this.socket.io.opts.transports = ['polling', 'websocket'];
        }
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      console.error('Error message:', error.message);
      console.error('Error type:', (error as SocketError).type);
      console.error('Error description:', (error as SocketError).description);
      
      // If we get a websocket error, try with polling only
      if (error.message.includes('websocket')) {
        console.log('Websocket error detected, trying with polling...');
        if (this.socket) {
          this.socket.io.opts.transports = ['polling'];
        }
      }
      
      // If we can't connect at all, try a different approach
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          console.log('Still not connected after error, trying different transport strategy...');
          this.socket.io.opts.transports = ['polling'];
          this.socket.connect();
        }
      }, 3000);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Tentativa de reconexão #${attemptNumber}`);
    });

    this.socket.on('reconnect', () => {
      console.log('Reconectado ao servidor!');
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Erro na reconexão:', error);
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
      this.socket.emit('forfeit', roomId, resolve);
    });
  }

  resetGame(roomId: string): Promise<any> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: 'Não conectado ao servidor' });
        return;
      }
      this.socket.emit('reset_game', roomId, resolve);
    });
  }

  sendChatMessage(roomId: string, message: string): Promise<any> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: 'Não conectado ao servidor' });
        return;
      }
      this.socket.emit('chat_message', { roomId, message }, resolve);
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