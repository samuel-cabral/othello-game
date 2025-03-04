'use client';

import { useEffect, useState } from 'react';
import { Board } from '@/components/ui/board';
import { Chat } from '@/components/chat';
import { Room, Position } from '@/types/game';
import SocketClient from '@/lib/socket';
import { useRouter } from 'next/navigation';

interface GameRoomProps {
  roomId: string;
  playerId: string;
}

export function GameRoom({ roomId, playerId }: GameRoomProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socket = SocketClient.getInstance();
  const router = useRouter();

  useEffect(() => {
    const socketInstance = socket.connect();

    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
      // Attempt to rejoin room on reconnection
      socket.joinRoom(roomId).catch((err: Error) => {
        setError('Failed to rejoin room');
      });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setError('Disconnected from server. Attempting to reconnect...');
    };

    const handleConnectError = () => {
      setIsConnected(false);
      setError('Failed to connect to server');
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('connect_error', handleConnectError);

    // Initial connection status
    setIsConnected(socketInstance.connected);

    socket.onRoomUpdated((updatedRoom: Room) => {
      setRoom(updatedRoom);
      // Check if the room still exists and if the player is still in it
      const isInRoom = updatedRoom.players.black === playerId || 
                      updatedRoom.players.white === playerId ||
                      updatedRoom.spectators.includes(playerId);
      if (!isInRoom) {
        setError('You have been removed from the room');
        setTimeout(() => router.push('/'), 2000);
      }
    });

    // Initial room join
    socket.joinRoom(roomId).catch((err: Error) => {
      setError('Failed to join room');
      setTimeout(() => router.push('/'), 2000);
    });

    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('connect_error', handleConnectError);
      socket.removeRoomUpdatedListener();
      socket.disconnect();
    };
  }, [roomId, playerId, router]);

  const handleMove = async (position: Position) => {
    if (!isConnected) {
      setError('Not connected to server');
      return;
    }

    try {
      setError(null);
      const result = await socket.makeMove(roomId, position);
      if (!result.success) {
        setError(result.error || 'Invalid move');
      }
    } catch (err) {
      setError('Failed to make move');
    }
  };

  const handleForfeit = async () => {
    if (!isConnected) {
      setError('Not connected to server');
      return;
    }

    try {
      setError(null);
      const result = await socket.forfeitGame(roomId);
      if (!result.success) {
        setError(result.error || 'Failed to forfeit game');
      }
    } catch (err) {
      setError('Failed to forfeit game');
    }
  };

  const handleReset = async () => {
    if (!isConnected) {
      setError('Not connected to server');
      return;
    }

    try {
      setError(null);
      const result = await socket.resetGame(roomId);
      if (!result.success) {
        setError(result.error || 'Failed to reset game');
      }
    } catch (err) {
      setError('Failed to reset game');
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!isConnected) {
      setError('Not connected to server');
      return;
    }

    try {
      setError(null);
      const result = await socket.sendChatMessage(roomId, message);
      if (!result.success) {
        setError(result.error || 'Failed to send message');
      }
    } catch (err) {
      setError('Failed to send message');
    }
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center h-screen">
        {error ? (
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <p className="text-gray-500">Redirecting to home page...</p>
          </div>
        ) : (
          'Loading...'
        )}
      </div>
    );
  }

  const playerColor = room.players.black === playerId ? 'black' : 
                     room.players.white === playerId ? 'white' : undefined;
  
  const isSpectator = !playerColor;
  const isMyTurn = playerColor === room.gameState.currentPlayer;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row items-start gap-8">
        <div className="flex-1">
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Othello Game</h1>
              <p className="text-lg">
                {isSpectator ? 'Spectating' : `You are playing as ${playerColor}`}
              </p>
              {!isConnected && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-4" role="alert">
                  <p className="font-bold">Connection Status</p>
                  <p>{error || 'Connecting to server...'}</p>
                </div>
              )}
              {error && isConnected && (
                <p className="text-red-500 mt-4">{error}</p>
              )}
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className={`p-2 rounded ${room.gameState.currentPlayer === 'black' ? 'bg-black text-white' : 'bg-gray-200'}`}>
                Black: {room.gameState.blackScore}
              </div>
              <div className={`p-2 rounded ${room.gameState.currentPlayer === 'white' ? 'bg-white text-black border' : 'bg-gray-200'}`}>
                White: {room.gameState.whiteScore}
              </div>
            </div>

            <Board
              board={room.gameState.board}
              currentPlayer={room.gameState.currentPlayer}
              isMyTurn={isMyTurn && isConnected}
              onMove={handleMove}
              lastMove={room.gameState.lastMove}
            />

            {!isSpectator && (
              <div className="flex gap-4">
                <button
                  onClick={handleForfeit}
                  disabled={!isConnected}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Forfeit
                </button>
                <button
                  onClick={handleReset}
                  disabled={!isConnected}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset Game
                </button>
              </div>
            )}

            {room.gameState.isGameOver && (
              <div className="text-2xl font-bold">
                {room.gameState.winner === 'draw' 
                  ? "It's a draw!"
                  : `${room.gameState.winner?.toUpperCase()} wins!`}
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-96">
          <Chat
            messages={room.chat}
            onSendMessage={handleSendMessage}
            playerId={playerId}
          />
        </div>
      </div>
    </div>
  );
} 