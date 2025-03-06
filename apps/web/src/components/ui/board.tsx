'use client';

import { useEffect, useState } from 'react';
import { Cell, Position, Player } from '@/types/game';
import { cn } from '@/lib/utils';

interface BoardProps {
  board: Cell[][];
  currentPlayer?: 'black' | 'white';
  isMyTurn?: boolean;
  onMove?: (position: Position) => void;
  lastMove?: Position | null;
}

export function Board({ board, currentPlayer, isMyTurn, onMove, lastMove }: BoardProps) {
  const [validMoves, setValidMoves] = useState<boolean[][]>([]);

  // Calcular movimentos válidos
  useEffect(() => {
    if (!currentPlayer || !isMyTurn) {
      setValidMoves([]);
      return;
    }

    const moves = Array(8).fill(null).map(() => Array(8).fill(false));
    
    // Verificar cada célula vazia para determinar se é um movimento válido
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === null && isValidMove(board, { row, col }, currentPlayer)) {
          moves[row][col] = true;
        }
      }
    }
    
    setValidMoves(moves);
  }, [board, currentPlayer, isMyTurn]);

  const handleCellClick = (row: number, col: number) => {
    if (!isMyTurn || board[row][col] !== null) return;
    onMove?.({ row, col });
  };

  // Função para verificar se um movimento é válido (adaptada do OthelloGame.ts)
  function isValidMove(board: Cell[][], position: Position, player: Player): boolean {
    const { row, col } = position;

    // Verifica se a célula está ocupada
    if (board[row][col] !== null) {
      return false;
    }

    // Verifica todas as direções para movimentos válidos
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    return directions.some(([dx, dy]) => 
      wouldFlipInDirection(board, row, col, dx, dy, player)
    );
  }

  function wouldFlipInDirection(
    board: Cell[][],
    row: number,
    col: number,
    dx: number,
    dy: number,
    player: Player
  ): boolean {
    let x = row + dx;
    let y = col + dy;
    let flips = 0;

    while (
      x >= 0 &&
      x < 8 &&
      y >= 0 &&
      y < 8
    ) {
      const cell = board[x][y];
      if (cell === null) return false;
      if (cell === player) return flips > 0;
      flips++;
      x += dx;
      y += dy;
    }

    return false;
  }

  return (
    <div className="grid grid-cols-8 gap-1 bg-emerald-800 p-4 rounded-lg shadow-lg">
      {board.map((row, rowIndex) => (
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={cn(
              'w-12 h-12 bg-emerald-600 rounded-sm flex items-center justify-center cursor-pointer hover:bg-emerald-500',
              {
                'hover:bg-emerald-600 cursor-not-allowed': !isMyTurn || cell !== null,
                'ring-2 ring-yellow-400': lastMove?.row === rowIndex && lastMove?.col === colIndex,
              }
            )}
            onClick={() => handleCellClick(rowIndex, colIndex)}
          >
            {cell && (
              <div className={cn(
                'w-8 h-8 rounded-full',
                {
                  'bg-black': cell === 'black',
                  'bg-white': cell === 'white',
                  'scale-90': true,
                  'animate-bounce': currentPlayer === cell,
                }
              )} />
            )}
          </div>
        ))
      ))}
    </div>
  );
} 