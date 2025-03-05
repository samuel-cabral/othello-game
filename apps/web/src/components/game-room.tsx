'use client';

import { useEffect, useState, useMemo } from 'react';
import { Board } from '@/components/ui/board';
import { Chat } from '@/components/chat';
import { Room, Position } from '@/types/game';
import SocketClient from '@/lib/socket';
import { useRouter } from 'next/navigation';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';

export interface GameRoomProps {
  roomId: string;
  playerId: string;
  isCreator?: boolean;
  onBackToLobby?: () => void;
}

export const GameRoom: React.FC<GameRoomProps> = ({ 
  roomId, 
  playerId,
  isCreator = false,
  onBackToLobby 
}) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const socket = SocketClient.getInstance();
  const router = useRouter();

  useEffect(() => {
    const socketInstance = socket.connect();

    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
      
      // Attempt to join room on reconnection with a small delay
      // to ensure socket is fully established
      setTimeout(() => {
        console.log("Attempting to join room after connection:", roomId);
        socket.joinRoom(roomId).then((response) => {
          if (!response.success) {
            setError(response.error || 'Failed to join room');
            setTimeout(() => router.push('/'), 2000);
          }
        }).catch((err: Error) => {
          console.error("Error joining room:", err);
          setError('Failed to join room: ' + err.message);
          setTimeout(() => router.push('/'), 2000);
        });
      }, 500);
    };

    const handleDisconnect = (reason: string) => {
      console.log("Socket disconnected in GameRoom:", reason);
      setIsConnected(false);
      setError(`Disconnected from server (${reason}). Attempting to reconnect...`);
    };

    const handleConnectError = (error: Error) => {
      console.error("Connect error in GameRoom:", error);
      setIsConnected(false);
      setError('Failed to connect to server: ' + error.message);
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('connect_error', handleConnectError);

    // Initial connection status
    if (socketInstance.connected) {
      setIsConnected(true);
      
      // Initial room join for already connected socket
      console.log("Socket already connected, joining room:", roomId);
      socket.joinRoom(roomId).then((response) => {
        if (!response.success) {
          setError(response.error || 'Failed to join room');
          setTimeout(() => router.push('/'), 2000);
        }
      }).catch((err: Error) => {
        console.error("Error joining room:", err);
        setError('Failed to join room: ' + err.message);
        setTimeout(() => router.push('/'), 2000);
      });
    }

    socket.onRoomUpdated((updatedRoom: Room) => {
      console.log("Room updated:", updatedRoom);
      
      // Verificar se a sala é a mesma que estamos tentando acessar
      if (updatedRoom.id === roomId) {
        setRoom(updatedRoom);
        
        // Check if the player is still in the room
        const isInRoom = updatedRoom.players.black === playerId || 
                        updatedRoom.players.white === playerId ||
                        updatedRoom.spectators.includes(playerId);
        
        if (!isInRoom) {
          console.log("Player not in room, attempting to rejoin...");
          // Tentar entrar na sala novamente
          socket.joinRoom(roomId).then((response) => {
            if (!response.success) {
              setError('You have been removed from the room and could not rejoin');
              setTimeout(() => router.push('/'), 2000);
            }
          }).catch((err: Error) => {
            setError('Failed to rejoin room: ' + err.message);
            setTimeout(() => router.push('/'), 2000);
          });
        }
      }
    });

    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('connect_error', handleConnectError);
      socket.removeRoomUpdatedListener();
      // We don't disconnect here to allow for navigation without losing connection
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

  // Função para compartilhar o link da sala
  const handleCopyRoomLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => console.error('Erro ao copiar: ', err));
  };

  // Verificação para QR code dinâmico
  const qrCodeUrl = useMemo(() => {
    if (!room) return null;
    const roomUrl = `${window.location.origin}/room/${roomId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(roomUrl)}`;
  }, [room, roomId]);

  // Informações sobre a sala e o jogador
  const roomInfo = useMemo(() => {
    if (!room) return { gameCanStart: false, hasOpponent: false, playerColor: null };
    
    const blackPlayer = room.players.black;
    const whitePlayer = room.players.white;
    const playerColor = playerId === blackPlayer ? 'black' : playerId === whitePlayer ? 'white' : null;
    const hasOpponent = Boolean(blackPlayer && whitePlayer);
    const gameCanStart = hasOpponent;
    
    return { gameCanStart, hasOpponent, playerColor };
  }, [room, playerId]);

  // Verificar se é a vez do jogador atual
  const isMyTurn = useMemo(() => {
    if (!room || !roomInfo.gameCanStart || !roomInfo.playerColor) return false;
    return room.gameState.currentPlayer === roomInfo.playerColor;
  }, [room, roomInfo.gameCanStart, roomInfo.playerColor]);

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

  const renderBoard = () => {
    if (!room) return null;
    return room.gameState.board.map((row, rowIndex) => (
      row.map((cell, colIndex) => (
        <div
          key={`${rowIndex}-${colIndex}`}
          className={`w-full h-full aspect-square ${
            cell === 'black' ? 'bg-black' : 
            cell === 'white' ? 'bg-white' : 'bg-green-600 dark:bg-green-700 hover:bg-green-500 dark:hover:bg-green-600 cursor-pointer'
          }`}
          onClick={() => {
            if (!cell && isMyTurn) {
              handleMove({ row: rowIndex, col: colIndex });
            }
          }}
        ></div>
      ))
    ));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBackToLobby}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Voltar
        </button>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCopyRoomLink}
            className="flex items-center text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copySuccess ? 'Link copiado!' : 'Copiar link'}
          </button>
          
          <ThemeSwitcher />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-8">
        <div className="flex-1">
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Othello Game</h1>
              
              {/* Informações sobre o jogador atual */}
              <div className="mb-3">
                {roomInfo.playerColor ? (
                  <p className="text-lg">
                    Você está jogando com as peças <span className="font-bold">{roomInfo.playerColor === 'black' ? 'pretas' : 'brancas'}</span>
                  </p>
                ) : (
                  <p className="text-lg">Você está assistindo como espectador</p>
                )}
              </div>
              
              {/* Status do jogo */}
              {!roomInfo.gameCanStart ? (
                <div className="flex flex-col items-center justify-center p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
                  <div className="flex items-center mb-2">
                    <div className="w-5 h-5 mr-2 animate-pulse bg-yellow-400 dark:bg-yellow-600 rounded-full"></div>
                    <p className="text-lg font-medium text-yellow-800 dark:text-yellow-300">Aguardando oponente</p>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                    Compartilhe o ID da sala ou o link para convidar alguém para jogar
                  </p>
                  {qrCodeUrl && (
                    <div className="mt-2 mb-2">
                      <img src={qrCodeUrl} alt="QR Code para sala" width="120" height="120" />
                    </div>
                  )}
                </div>
              ) : (
                <div className={`p-3 rounded-lg mb-4 ${isMyTurn 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'}`}>
                  <p className={`text-lg ${isMyTurn 
                    ? 'text-green-800 dark:text-green-300' 
                    : 'text-blue-800 dark:text-blue-300'}`}>
                    {isMyTurn ? 'É a sua vez de jogar!' : 'Aguardando jogada do oponente...'}
                  </p>
                </div>
              )}
              
              {/* Status da conexão */}
              {error && (
                <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
            </div>
            
            {/* Game Board: Exibido apenas quando o jogo pode começar */}
            {roomInfo.gameCanStart ? (
              <div className="max-w-md w-full">
                <div className="grid grid-cols-8 gap-1 bg-green-800 dark:bg-green-900 p-1 rounded" 
                    style={{
                      width: 'min(100%, 400px)',
                      height: 'min(100%, 400px)'
                    }}>
                  {renderBoard()}
                </div>
              </div>
            ) : (
              <div className="max-w-md w-full h-64 flex items-center justify-center">
                <div className="animate-pulse text-center">
                  <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-md mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">O tabuleiro será exibido quando o oponente entrar na sala</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-80 mt-6 lg:mt-0">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-sm">
            <h2 className="text-xl font-bold mb-3">Placar</h2>
            <div className="flex justify-between mb-3">
              <div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-black dark:bg-black mr-2"></div>
                  <span className="font-semibold">Pretas</span>
                </div>
                <div className="text-2xl font-bold mt-1">{room?.gameState.blackScore || 0}</div>
              </div>
              <div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-white border border-gray-300 dark:border-gray-400 mr-2"></div>
                  <span className="font-semibold">Brancas</span>
                </div>
                <div className="text-2xl font-bold mt-1">{room?.gameState.whiteScore || 0}</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <h2 className="text-xl font-bold mb-2">Jogadores</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-black mr-2"></div>
                  <span>Jogador Preto</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${room?.players.black 
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                  {room?.players.black ? 'Conectado' : 'Aguardando'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-white border border-gray-300 dark:border-gray-400 mr-2"></div>
                  <span>Jogador Branco</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${room?.players.white 
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                  {room?.players.white ? 'Conectado' : 'Aguardando'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Adicionar mais informações ou controles do jogo aqui */}
        </div>
      </div>
    </div>
  );
}; 