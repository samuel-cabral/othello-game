'use client';

import { Cell, Position } from '@/types/game';
import { cn } from '@/lib/utils';

interface BoardProps {
  board: Cell[][];
  currentPlayer?: 'black' | 'white';
  isMyTurn?: boolean;
  onMove?: (position: Position) => void;
  lastMove?: Position | null;
}

export function Board({ board, currentPlayer, isMyTurn, onMove, lastMove }: BoardProps) {
  const handleCellClick = (row: number, col: number) => {
    if (!isMyTurn || board[row][col] !== null) return;
    onMove?.({ row, col });
  };

  return (
    <div className="grid grid-cols-8 gap-1 bg-emerald-800 p-4 rounded-lg shadow-lg">
      {board.map((row, rowIndex) => (
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={cn(
              'w-12 h-12 bg-emerald-600 rounded-sm flex items-center justify-center cursor-pointer hover:bg-emerald-500 transition-colors',
              {
                'hover:bg-emerald-600 cursor-not-allowed': !isMyTurn || cell !== null,
                'ring-2 ring-yellow-400': lastMove?.row === rowIndex && lastMove?.col === colIndex,
              }
            )}
            onClick={() => handleCellClick(rowIndex, colIndex)}
          >
            {cell && (
              <div className={cn(
                'w-8 h-8 rounded-full transition-transform',
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