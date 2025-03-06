'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SocketClient from '@/lib/socket';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState('');

  useEffect(() => {
    const socket = SocketClient.getInstance();
    const socketInstance = socket.connect();
    
    const handleConnect = () => {
      console.log('Connected to server with ID:', socketInstance.id);
      if (socketInstance.id) {
        setSocketId(socketInstance.id);
      }
    };

    // Adicionar listener para evento 'connect'
    socketInstance.on('connect', handleConnect);

    // Se já estiver conectado, atualizar o socketId
    if (socketInstance.connected && socketInstance.id) {
      setSocketId(socketInstance.id);
    }

    // Cleanup on component unmount
    return () => {
      socketInstance.off('connect', handleConnect);
    };
  }, []);

  const handleCreateRoom = async () => {
    try {
      setIsCreatingRoom(true);
      setError(null);
      
      const socketClient = SocketClient.getInstance();
      const result = await socketClient.createRoom();
      
      if (result.success) {
        // Redirecionar para a sala com parâmetro de consulta indicando que é o criador
        router.push(`/room/${result.room.id}?created=true`);
      } else {
        setError(result.error || 'Erro ao criar sala');
        setIsCreatingRoom(false);
      }
    } catch (err) {
      setError((err as Error).message || 'Erro ao criar sala');
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = () => {
    if (!roomIdInput.trim()) {
      setError('Por favor, insira um ID de sala válido');
      return;
    }
    
    router.push(`/room/${roomIdInput.trim()}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      
      <h1 className="text-4xl font-bold text-center mb-8">Othello Game</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-md">
          <p>{error}</p>
        </div>
      )}
      
      <div className="w-full max-w-md space-y-6">
        <button
          onClick={handleCreateRoom}
          disabled={isCreatingRoom}
          className="w-full py-3 px-4 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center justify-center disabled:bg-emerald-400"
        >
          {isCreatingRoom ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Criando sala...
            </>
          ) : (
            'Criar Nova Sala'
          )}
        </button>
        
        <div className="flex items-center">
          <div className="flex-grow h-px bg-gray-300 dark:bg-gray-700"></div>
          <span className="px-3 text-gray-500 dark:text-gray-400 text-sm">OU</span>
          <div className="flex-grow h-px bg-gray-300 dark:bg-gray-700"></div>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value)}
            placeholder="Digite o ID da sala"
            className="flex-1 py-3 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handleJoinRoom}
            className="py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Entrar
          </button>
        </div>
      </div>
      
      <p className="mt-12 text-sm text-gray-600 dark:text-gray-400">
        {socketId ? (
          <span>Conectado ao servidor. ID: {socketId.substring(0, 8)}...</span>
        ) : (
          <span>Conectando ao servidor...</span>
        )}
      </p>
    </main>
  );
}
