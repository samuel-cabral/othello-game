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
    
    if (!socketClient.isConnected()) {
      socketClient.connect();
    }
    
    // Aguardar pela conexão antes de verificar o playerId
    const checkConnection = () => {
      if (socketClient.isConnected()) {
        setIsConnected(true);
        // Pegar o ID do socket quando conectado
        const socket = socketClient.getSocket();
        if (socket) {
          setPlayerId(socket.id || '');
          setIsLoading(false);
        }
      } else {
        setTimeout(checkConnection, 500);
      }
    };

    checkConnection();

    return () => {
      // Não desconectamos ao sair da página para manter a conexão durante a navegação
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