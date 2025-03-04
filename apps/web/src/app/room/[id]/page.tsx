'use client';

import { GameRoom } from '@/components/game-room';
import { useEffect, useState } from 'react';
import SocketClient from '@/lib/socket';
import { useRouter, useParams } from 'next/navigation';

export default function RoomPage() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  const [playerId, setPlayerId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socketClient = SocketClient.getInstance();
    const socket = socketClient.connect();
    
    // Set up event listeners for connection state
    const handleConnect = () => {
      setIsConnected(true);
      setPlayerId(socket.id || '');
      setIsLoading(false);
      setError(null);
    };

    const handleDisconnect = (reason: string) => {
      console.log('Disconnected in room page:', reason);
      setIsConnected(false);
      
      // Only show loading if it's a temporary disconnect that might recover
      if (reason !== 'io client disconnect') {
        setError('Disconnected from server. Attempting to reconnect...');
      }
    };

    const handleConnectError = (err: Error) => {
      console.error('Connection error in room page:', err);
      setIsConnected(false);
      setError(`Connection error: ${err.message}`);
    };

    // Check initial connection state
    if (socket.connected) {
      setIsConnected(true);
      setPlayerId(socket.id || '');
      setIsLoading(false);
    }

    // Set up event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      // Don't disconnect when navigating to maintain connection between pages
    };
  }, []);

  const handleBackToLobby = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl mb-4">Conectando ao servidor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl text-red-500 mb-4">{error}</p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleBackToLobby}
        >
          Voltar ao Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sala de Jogo: {roomId}</h1>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          onClick={handleBackToLobby}
        >
          Voltar ao Lobby
        </button>
      </div>
      
      {isConnected && playerId ? (
        <GameRoom roomId={roomId} playerId={playerId} />
      ) : (
        <p>Conectando ao servidor...</p>
      )}
    </div>
  );
} 