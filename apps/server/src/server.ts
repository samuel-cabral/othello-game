import fastify from 'fastify';
import { Server } from 'socket.io';
import cors from '@fastify/cors';
import { WebSocketHandler } from './websocket/WebSocketHandler';

// Criar o servidor Fastify
const server = fastify({
  logger: true
});

// Configurar CORS para HTTP
server.register(cors, {
  origin: true, // Permitir todas as origens em desenvolvimento
  credentials: true
});

// Criar servidor HTTP
const httpServer = server.server;

// Criar instância do Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Permitir todas as origens em desenvolvimento
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Inicializar o manipulador de WebSocket
new WebSocketHandler(io);

// Rota de verificação de saúde
server.get('/health', async () => {
  return { status: 'ok' };
});

// Iniciar o servidor
const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 Servidor rodando em http://localhost:3001');
    console.log('👾 Servidor WebSocket está pronto');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start(); 