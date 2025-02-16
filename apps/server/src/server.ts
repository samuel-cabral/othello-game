import fastify from 'fastify';
import { Server } from 'socket.io';
import cors from '@fastify/cors';
import { WebSocketHandler } from './websocket/WebSocketHandler';

const server = fastify({
  logger: true,
});

// Enable CORS
server.register(cors, {
  origin: true, // Allow all origins in development
});

// Create HTTP server
const httpServer = server.server;

// Create Socket.IO instance
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Allow all origins in development
    methods: ['GET', 'POST'],
  },
});

// Initialize WebSocket handler
new WebSocketHandler(io);

// Health check route
server.get('/health', async () => {
  return { status: 'ok' };
});

// Start the server
const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server running on port 3001');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start(); 