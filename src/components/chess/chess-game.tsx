'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Chess, Square as ChessSquare, Move, Piece } from 'chess.js';
import { Chessboard } from './chessboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { suggestMove } from '@/ai/flows/suggest-move';
import { analyzePosition } from '@/ai/flows/analyze-position';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Analysis = {
  white: string;
  black: string;
} | null;

export const ChessGame: React.FC = () => {
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState<(Piece | null)[][]>(game.board());
  const [selectedSquare, setSelectedSquare] = useState<ChessSquare | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<ChessSquare[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [gameStatus, setGameStatus] = useState<string>('');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const updateBoard = useCallback(() => {
    setBoard(game.board());
    setMoveHistory(game.history());
    setGameOver(game.isGameOver());

    if (game.isCheckmate()) {
      setGameStatus(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins.`);
    } else if (game.isDraw()) {
      setGameStatus('Draw!');
    } else if (game.isStalemate()) {
      setGameStatus('Stalemate!');
    } else if (game.isThreefoldRepetition()) {
      setGameStatus('Draw by threefold repetition!');
    } else if (game.isInsufficientMaterial()) {
      setGameStatus('Draw by insufficient material!');
    } else {
      setGameStatus(`${game.turn() === 'w' ? 'White' : 'Black'}'s turn`);
    }
  }, [game]);

  useEffect(() => {
    updateBoard();
  }, [game, updateBoard]);


  const handleSquareClick = useCallback(
    (square: ChessSquare) => {
      if (!isPlayerTurn || gameOver) return;

      if (selectedSquare) {
        // Attempt to make a move
        try {
          const move = game.move({
            from: selectedSquare,
            to: square,
            promotion: 'q', // Always promote to queen for simplicity
          });

          if (move) {
            updateBoard();
            setSelectedSquare(null);
            setPossibleMoves([]);
            setIsPlayerTurn(false); // Switch to AI turn
            setAnalysis(null); // Clear analysis after player move
          } else {
            // Invalid move, maybe select the new square if it has a piece of the current player
            const piece = game.get(square);
            if (piece && piece.color === game.turn()) {
              setSelectedSquare(square);
              const moves = game.moves({ square, verbose: true });
              setPossibleMoves(moves.map((m) => m.to));
            } else {
                setSelectedSquare(null);
                setPossibleMoves([]);
            }
          }
        } catch (error) {
          // This might happen for invalid moves in chess.js v1
          console.warn("Invalid move attempt:", error);
          const piece = game.get(square);
            if (piece && piece.color === game.turn()) {
              setSelectedSquare(square);
              const moves = game.moves({ square, verbose: true });
              setPossibleMoves(moves.map((m) => m.to));
            } else {
                setSelectedSquare(null);
                setPossibleMoves([]);
            }
        }
      } else {
        // Select a square
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          const moves = game.moves({ square, verbose: true });
          setPossibleMoves(moves.map((m) => m.to));
        } else {
            setSelectedSquare(null); // Deselect if clicking empty square or opponent piece
            setPossibleMoves([]);
        }
      }
    },
    [game, isPlayerTurn, selectedSquare, gameOver, updateBoard]
  );

  const makeAiMove = useCallback(async () => {
    if (gameOver || isPlayerTurn) return;

    setIsThinking(true);
    try {
      const fen = game.fen();
      const result = await suggestMove({ boardState: fen });
      console.log("AI suggested move:", result.suggestedMove, "Reasoning:", result.reasoning);


      const move = game.move(result.suggestedMove);

      if (move) {
        updateBoard();
         toast({
           title: "AI Move",
           description: `AI moved ${result.suggestedMove}. ${result.reasoning}`,
         });
         setAnalysis(null); // Clear analysis after AI move
      } else {
        console.error("AI suggested an invalid move:", result.suggestedMove);
        // Fallback: Make a random legal move if AI fails
        const moves = game.moves();
        if (moves.length > 0) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            game.move(randomMove);
            updateBoard();
             toast({
               title: "AI Fallback Move",
               description: `AI made a random move: ${randomMove}`,
               variant: "destructive",
             });
            setAnalysis(null);
        } else {
             console.error("No legal moves available for AI.");
             setGameOver(true); // Should not happen if game state is correct
        }
      }
    } catch (error) {
      console.error('Error getting AI move:', error);
       toast({
          title: "AI Error",
          description: "Could not get move from AI. Making a random move.",
          variant: "destructive",
        });
       // Fallback: Make a random legal move on error
        const moves = game.moves();
        if (moves.length > 0) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            game.move(randomMove);
            updateBoard();
            setAnalysis(null);
        }
    } finally {
      setIsThinking(false);
      setIsPlayerTurn(true);
    }
  }, [game, gameOver, isPlayerTurn, updateBoard, toast]);

  useEffect(() => {
    if (!isPlayerTurn && !gameOver) {
      const timer = setTimeout(() => {
        makeAiMove();
      }, 500); // Add a small delay for AI move
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, gameOver, makeAiMove]);

  const handleResetGame = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setBoard(newGame.board());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setIsPlayerTurn(true);
    setGameOver(false);
    setGameStatus("White's turn");
    setMoveHistory([]);
    setIsThinking(false);
    setAnalysis(null);
    setIsAnalyzing(false);
     toast({ title: "Game Reset", description: "New game started." });
  }, [toast]);


 const handleAnalyzePosition = useCallback(async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysis(null); // Clear previous analysis
    try {
        const fen = game.fen();
        const result = await analyzePosition({ fen });
        setAnalysis({ white: result.whiteSummary, black: result.blackSummary });
         toast({ title: "Analysis Complete", description: "Position analysis generated." });
    } catch (error) {
        console.error("Error analyzing position:", error);
        toast({
          title: "Analysis Error",
          description: "Could not analyze the position.",
          variant: "destructive",
        });
        setAnalysis(null);
    } finally {
        setIsAnalyzing(false);
    }
}, [game, isAnalyzing, toast]);


 const formattedMoveHistory = useMemo(() => {
    const historyPairs: string[][] = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      historyPairs.push([moveHistory[i], moveHistory[i + 1] || '']);
    }
    return historyPairs;
 }, [moveHistory]);

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      <div className="flex flex-col items-center">
        <Chessboard
          board={board}
          selectedSquare={selectedSquare}
          possibleMoves={possibleMoves}
          onSquareClick={handleSquareClick}
          orientation="white" // Player is always white for now
        />
         <div className="mt-4 text-lg font-semibold text-center min-h-[28px]">
           {isThinking && !gameOver ? 'AI is thinking...' : gameStatus}
         </div>

      </div>

      <div className="flex flex-col gap-4 w-full md:w-80">
         <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Game Controls</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button onClick={handleResetGame} disabled={isThinking}>
                Reset Game
              </Button>
               <Button onClick={handleAnalyzePosition} disabled={isAnalyzing || isThinking || gameOver}>
                 {isAnalyzing ? 'Analyzing...' : 'Analyze Position'}
               </Button>
            </CardContent>
          </Card>

        {analysis && (
           <Alert>
             <Terminal className="h-4 w-4" />
             <AlertTitle>Position Analysis</AlertTitle>
             <AlertDescription>
               <p className="font-semibold">White:</p>
               <p className="mb-2">{analysis.white}</p>
               {/* <p className="font-semibold">Black:</p>
               <p>{analysis.black}</p> */}
             </AlertDescription>
           </Alert>
         )}


          <Card className="shadow-md">
             <CardHeader>
               <CardTitle>Move History</CardTitle>
             </CardHeader>
             <CardContent>
                 <ScrollArea className="h-48 w-full pr-4">
                     {formattedMoveHistory.length > 0 ? (
                       <ol className="list-decimal list-inside space-y-1 text-sm">
                         {formattedMoveHistory.map((pair, index) => (
                           <li key={index} className="flex justify-between">
                              <span>{index + 1}. {pair[0]}</span>
                              {pair[1] && <span>{pair[1]}</span>}
                           </li>
                         ))}
                       </ol>
                     ) : (
                       <p className="text-muted-foreground text-sm">No moves yet.</p>
                     )}
                 </ScrollArea>
             </CardContent>
          </Card>
      </div>
    </div>
  );
};
