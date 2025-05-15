import { useState, useEffect } from "react";
import { Chess } from "chess.js"; // Ensure Chess is properly imported
import { Chessboard } from "react-chessboard";

// --- API Helper Function ---
async function fetchMoveFromAPI(fen: string, pgnMovetext: string, token: string | null) {
  // Renamed pgn to pgnMovetext for clarity based on your requirement

  const API_URL = `/api/best_move?board_state=${encodeURIComponent(fen)}&pgn=${encodeURIComponent(pgnMovetext)}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  token = '';

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    if (data && data.move) {
      return data.move;
    } else {
      console.error("API response did not contain a move:", data);
      return null;
    }
  } catch (error) {
    console.error("Error fetching move from API:", error);
    return null;
  }
}

export default function PlayApiMoveEngine() {
  const [game, setGame] = useState(new Chess());
  const [isThinking, setIsThinking] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);

  // New state to trigger engine move and pass necessary data
  const [engineMoveTrigger, setEngineMoveTrigger] = useState<{ fen: string; pgn: string } | null>(null);

  useEffect(() => {
    const tokenElement = document.getElementById('user_token') as HTMLInputElement | null;
    if (tokenElement && tokenElement.value) {
      setUserToken(tokenElement.value);
    } else {
      console.warn('User token element not found in DOM or has no value.');
    }
  }, []);

  // safeGameMutate now returns the new game instance
  function safeGameMutate(modify: (gameInstance: Chess) => void): Chess {
    let mutatedGame: Chess | null = null;
    setGame((currentGame) => {
      const newGame = new Chess(currentGame.fen());
      modify(newGame);
      mutatedGame = newGame;
      return newGame;
    });
    return mutatedGame!; // Non-null assertion: setGame's updater runs sync
  }

  // Your toPgn function for generating movetext without headers
  const toPgn = (moveHistoryArray: string[]): string => {
    let oneLineMovetext: string = '';
    let moveNumber: number = 1;
    for (let i = 0; i < moveHistoryArray.length; i++) {
      if (i % 2 === 0) {
        oneLineMovetext += `${moveNumber}. `;
      }
      oneLineMovetext += moveHistoryArray[i] + ' ';
      if (i % 2 !== 0) {
        moveNumber++;
      }
    }
    return oneLineMovetext.trim();
  };

 // useEffect to handle making the engine's move
 useEffect(() => {
  if (engineMoveTrigger) {
    const { fen, pgn } = engineMoveTrigger;

    // Double-check conditions based on the FEN that triggered the move
    const tempGameForCheck = new Chess(fen);
    if (tempGameForCheck.isGameOver() || tempGameForCheck.isDraw() || tempGameForCheck.turn() === 'w') {
      console.log("[useEffect-EngineMove] Conditions not met for engine move based on trigger FEN (game over, draw, or not engine's turn). FEN:", fen);
      setEngineMoveTrigger(null); // Reset trigger
      return;
    }

    const performApiCall = async () => {
      console.log("[useEffect-EngineMove] Calling API with FEN:", fen, "PGN:", pgn);
      setIsThinking(true);
      const engineMoveSAN = await fetchMoveFromAPI(fen, pgn, userToken);
      setIsThinking(false);

      if (engineMoveSAN) {
        console.log("[useEffect-EngineMove] Engine move received:", engineMoveSAN);
        // safeGameMutate uses setGame, which correctly bases its update
        // on the 'currentGame' state passed by React, which will be up-to-date.
        safeGameMutate((g) => {
          // It's good practice to ensure 'g' is in the expected state or use 'fen' if there's a mismatch risk.
          // However, since this effect runs after the player's move has set 'game', 'g.fen()' should typically match 'fen'.
          if (g.fen() !== fen) {
              console.warn(`[useEffect-EngineMove] Discrepancy: Current game FEN (${g.fen()}) differs from trigger FEN (${fen}). Applying to current game state.`);
              // You might decide to load 'fen' into 'g' if this is a concern: g.load(fen);
          }
          const result = g.move(engineMoveSAN);
          if (result === null) {
            console.error("API returned an invalid move (useEffect):", engineMoveSAN, "for FEN:", g.fen()); // g.fen() is after the attempted move
            window.alert(`Engine tried an invalid move: ${engineMoveSAN}. The board state was FEN: ${fen}`);
          }
        });
      } else {
        console.error("[useEffect-EngineMove] Engine failed to get a move from the API.");
        window.alert("Engine failed to get a move. API issue or no legal moves.");
      }
      setEngineMoveTrigger(null); // Reset the trigger
    };

    // Optional: If you still want a slight delay for the "thinking" feel
    const timerId = setTimeout(performApiCall, 100); // A small delay
    return () => clearTimeout(timerId); // Cleanup timeout if component unmounts or trigger changes
  }
}, [engineMoveTrigger, userToken]); // Add fetchMoveFromAPI if it's not stable / defined outside


  function onDrop(sourceSquare: string, targetSquare: string): boolean {
    if (isThinking || game.turn() !== 'w') {
      console.log("Not player's turn or engine is thinking.");
      return false;
    }

    let moveMadeSuccessfully = false;
    const gameAfterPlayerMove = safeGameMutate((gInstance) => {
      try {
        const moveResult = gInstance.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });
        if (moveResult) {
          moveMadeSuccessfully = true;
        } else {
          console.log("Invalid player move (chess.js):", sourceSquare, targetSquare, "on FEN:", gInstance.fen());
        }
      } catch (e) {
        console.error("Error making player move:", e);
        moveMadeSuccessfully = false;
      }
    });

    if (!moveMadeSuccessfully) {
      return false;
    }

    // Check game status on the *updated* game state.
    if (!gameAfterPlayerMove.isGameOver() && !gameAfterPlayerMove.isDraw()) {
      // Instead of setTimeout, set the state to trigger the useEffect hook
      setEngineMoveTrigger({
        fen: gameAfterPlayerMove.fen(),
        pgn: toPgn(gameAfterPlayerMove.history()),
      });
    }

    return true;
  }

  useEffect(() => {
    if (game.isCheckmate()) {
      const winner = game.turn() === "w" ? "Black" : "White";
      console.log("Checkmate!");
      // Get movetext for final log if preferred
      const finalMovetext = toPgn(game.history());
      console.log("Final movetext:", finalMovetext);
      setTimeout(() => window.alert(`Checkmate! ${winner} wins.`), 200);
    } else if (game.isDraw()) {
      let reason = "Draw!";
      if (game.isStalemate()) reason = "Stalemate!";
      else if (game.isThreefoldRepetition()) reason = "Draw by threefold repetition!";
      else if (game.isInsufficientMaterial()) reason = "Draw by insufficient material!";
      else reason = "Draw by 50-move rule or other reason!";
      console.log(reason);
      const finalMovetext = toPgn(game.history());
      console.log("Final movetext:", finalMovetext);
      setTimeout(() => window.alert(reason), 200);
    }
  }, [game]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: '800px', height: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Chessboard
          position={game.fen()}
          onPieceDrop={onDrop}
          areArrowsAllowed={true}
        />
        {isThinking && <div style={{ marginTop: '20px', fontSize: '18px' }}>Engine is thinking...</div>}
        <div style={{ marginTop: '20px', fontSize: '16px' }}>Turn: {game.turn() === 'w' ? 'White (Player)' : 'Black (Engine)'}</div>
        { (game.isGameOver() || game.isDraw()) &&
          <div style={{marginTop: '20px', fontSize: '20px', color: 'red'}}>
            GAME OVER
          </div>
        }
      </div>
    </div>
  );
}