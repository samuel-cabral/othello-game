'use client';

import { GameRoom } from '@/components/game-room';
import { useEffect, useState } from 'react';
import SocketClient from '@/lib/socket';
import { useRouter, useParams } from 'next/navigation';

export default function RoomPage() {
  const params = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const isCreator = searchParams.get('created') === 'true';
  const roomId = params.id as string;
  const router = useRouter();
  const [playerId, setPlayerId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Add beforeunload event listener to warn before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isConnected) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isConnected]);

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
    if (isConnected) {
      setShowExitConfirm(true);
    } else {
      router.push('/');
    }
  };

  const confirmExit = () => {
    router.push('/');
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-xl font-semibold">
              {isCreator ? 'Preparando sua sala de jogo...' : 'Conectando à sala...'}
            </p>
          </div>
        </div>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <GameRoom 
        roomId={roomId} 
        playerId={playerId} 
        isCreator={isCreator}
        onBackToLobby={handleBackToLobby}
      />

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Sair da sala?</h3>
            <p className="mb-6">Você tem certeza que deseja sair? Se você é um jogador, isso pode afetar o jogo.</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={cancelExit}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmExit}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 