'use client';

import { useState, useEffect } from 'react';
import { Room } from '@/types/game';
import SocketClient from '@/lib/socket';
import { GameRoom } from '@/components/game-room';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socketId, setSocketId] = useState<string | null>(null);

  useEffect(() => {
    const socket = SocketClient.getInstance();
    const socketInstance = socket.connect();

    const checkConnection = () => {
      const isConnected = socket.isConnected();
      setConnected(isConnected);
      if (isConnected && socketInstance.id) {
        setSocketId(socketInstance.id);
      }
    };

    // Verificar conexão inicial
    checkConnection();

    // Configurar ouvintes de eventos
    socketInstance.on('connect', () => {
      setError(null);
      checkConnection();
      fetchRooms();
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
      setError('Desconectado do servidor. Tentando reconectar...');
    });

    socketInstance.on('connect_error', (err) => {
      setConnected(false);
      setError(`Erro de conexão: ${err.message}`);
    });

    // Buscar salas disponíveis
    const fetchRooms = async () => {
      try {
        const result = await socket.getRooms();
        if (result.success && result.rooms) {
          setRooms(result.rooms);
        } else if (result.error) {
          setError(`Erro ao buscar salas: ${result.error}`);
        }
        setLoading(false);
      } catch (err) {
        setError('Erro ao buscar salas');
        setLoading(false);
      }
    };

    // Tentar buscar salas se estiver conectado
    if (socket.isConnected()) {
      fetchRooms();
    } else {
      setLoading(false);
    }

    // Configurar intervalo para verificar conexão
    const intervalId = setInterval(() => {
      checkConnection();
      if (socket.isConnected()) {
        fetchRooms();
      }
    }, 5000);

    return () => {
      clearInterval(intervalId);
      socketInstance.off('connect');
      socketInstance.off('disconnect');
      socketInstance.off('connect_error');
    };
  }, []);

  // Função para criar uma sala
  const handleCreateRoom = async () => {
    try {
      setError(null);
      const socket = SocketClient.getInstance();
      const result = await socket.createRoom();
      
      if (result.success) {
        alert(`Sala criada com sucesso! ID: ${result.room.id}`);
        // Atualizar lista de salas
        const roomsResult = await socket.getRooms();
        if (roomsResult.success) {
          setRooms(roomsResult.rooms);
        }
      } else {
        setError(result.error || 'Erro ao criar sala');
      }
    } catch (err) {
      setError('Erro ao criar sala');
    }
  };

  // Função para entrar em uma sala
  const handleJoinRoom = (roomId: string) => {
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Teste de Conexão Othello</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-semibold mb-2">Status da Conexão:</h2>
        {connected ? (
          <div className="text-green-600">
            Conectado ao servidor
            {socketId && <div className="text-sm">ID do Socket: {socketId}</div>}
          </div>
        ) : (
          <div className="text-red-600">
            Não conectado ao servidor
            {error && <div className="text-sm mt-1">{error}</div>}
          </div>
        )}
      </div>

      <div className="mb-4">
        <button
          onClick={handleCreateRoom}
          disabled={!connected}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Criar Nova Sala
        </button>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Salas Disponíveis:</h2>
        {loading ? (
          <p>Carregando salas...</p>
        ) : rooms.length > 0 ? (
          <ul className="space-y-2">
            {rooms.map((room) => (
              <li 
                key={room.id} 
                className="border p-3 rounded hover:bg-gray-100 cursor-pointer transition"
                onClick={() => handleJoinRoom(room.id)}
              >
                <div>Sala ID: {room.id}</div>
                <div className="text-sm">
                  Jogadores: {Object.values(room.players).filter(Boolean).length}/2
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhuma sala disponível</p>
        )}
      </div>
    </div>
  );
}
