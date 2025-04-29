'use client';

import type { Piece, Square as ChessSquare } from 'chess.js';
import React, { useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

type SquareProps = {
  square: ChessSquare;
  piece: Piece | null;
  isLight: boolean;
  isSelected: boolean;
  isPossibleMove: boolean;
  onClick: (square: ChessSquare) => void;
};

const Square: React.FC<SquareProps> = React.memo(
  ({ square, piece, isLight, isSelected, isPossibleMove, onClick }) => {
    const handleClick = useCallback(() => onClick(square), [onClick, square]);

    const pieceSymbol = useMemo(() => {
      if (!piece) return null;
      const symbols: { [key: string]: string } = {
        p: '♙',
        r: '♖',
        n: '♘',
        b: '♗',
        q: '♕',
        k: '♔',
      };
      return symbols[piece.type.toLowerCase()];
    }, [piece]);

    return (
      <div
        className={cn(
          'flex h-12 w-12 cursor-pointer items-center justify-center text-3xl relative transition-colors duration-100', // Increased size
          isLight ? 'bg-[--board-light-square]' : 'bg-[--board-dark-square]',
          isSelected && 'bg-[--board-highlight-select] !bg-opacity-70', // Ensure select highlight is strong
          piece ? (piece.color === 'w' ? 'text-[--board-piece-light]' : 'text-[--board-piece-dark]') : ''
        )}
        onClick={handleClick}
        role="button"
        aria-label={`Square ${square}${piece ? ` with ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
      >
        {isPossibleMove && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-4 w-4 rounded-full bg-[--board-highlight-move] opacity-80"></div>
          </div>
        )}
        <span
           style={{ transform: 'translateY(-1px)' }} // Fine-tune vertical alignment
           className={cn(piece && piece.color === 'b' ? 'font-bold text-[--board-piece-light]' : 'text-[--board-piece-dark]')} // Adjust colors based on square
           aria-hidden="true"
        >
          {pieceSymbol}
        </span>

      </div>
    );
  }
);
Square.displayName = 'Square';


type ChessboardProps = {
  board: (Piece | null)[][];
  selectedSquare: ChessSquare | null;
  possibleMoves: ChessSquare[];
  onSquareClick: (square: ChessSquare) => void;
  orientation?: 'white' | 'black';
};

export const Chessboard: React.FC<ChessboardProps> = ({
  board,
  selectedSquare,
  possibleMoves,
  onSquareClick,
  orientation = 'white',
}) => {
  const ranks = useMemo(() => (orientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]), [orientation]);
  const files = useMemo(() => (orientation === 'white' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']), [orientation]);


  const getSquare = useCallback((rankIndex: number, fileIndex: number): ChessSquare => {
     const rank = ranks[rankIndex];
     const file = files[fileIndex];
     return `${file}${rank}` as ChessSquare;
  }, [ranks, files]);


   const getPiece = useCallback((square: ChessSquare): Piece | null => {
    const fileIndex = files.indexOf(square[0]);
    const rankIndex = ranks.indexOf(parseInt(square[1], 10));
    if (rankIndex === -1 || fileIndex === -1) return null; // Should not happen with valid squares
    return board[rankIndex]?.[fileIndex] ?? null;
  }, [board, files, ranks]);


  return (
    <div className="grid grid-cols-8 grid-rows-8 w-[384px] h-[384px] border-4 border-card rounded-md overflow-hidden shadow-lg">
      {ranks.map((rank, rankIndex) =>
        files.map((file, fileIndex) => {
          const square = getSquare(rankIndex, fileIndex);
          const piece = getPiece(square);
          const isLight = (rankIndex + fileIndex) % 2 !== 0;
          const isSelected = selectedSquare === square;
          const isPossible = possibleMoves.includes(square);

          return (
            <Square
              key={square}
              square={square}
              piece={piece}
              isLight={isLight}
              isSelected={isSelected}
              isPossibleMove={isPossible}
              onClick={onSquareClick}
            />
          );
        })
      )}
    </div>
  );
};
Chessboard.displayName = 'Chessboard';
