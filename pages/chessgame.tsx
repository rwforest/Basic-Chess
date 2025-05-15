import { useState, useEffect } from "react";
import { Chess } from "chess.js"; // Ensure Chess is properly imported
import { Chessboard } from "react-chessboard";

// --- API Helper Function ---
async function fetchMoveFromAPI(fen: string, pgnMovetext: string, token: string | null) {
  // Renamed pgn to pgnMovetext for clarity based on your requirement
  const API_URL = `/best_move?board_state=${encodeURIComponent(fen)}&pgn=${encodeURIComponent(pgnMovetext)}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  token = 'eyJraWQiOiIyMDdhN2JlMDhmMjBjNDBkNmUwZmU2ZWY3MzY5YTgxNjMxYjFlNDliMTg1M2VlNWFjMDhmM2NmNzlmZWUxNWYyIiwidHlwIjoiYXQrand0IiwiYWxnIjoiUlMyNTYifQ.eyJjbGllbnRfaWQiOiJmZDYyNGM0MC1kNWM4LTQ0MDUtYjE0Mi1lZWY3MTE3YzVmYWEiLCJzY29wZSI6Im9mZmxpbmVfYWNjZXNzIGVtYWlsIGlhbS5jdXJyZW50LXVzZXI6cmVhZCBvcGVuaWQgaWFtLmFjY2Vzcy1jb250cm9sOnJlYWQgcHJvZmlsZSIsImlzcyI6Imh0dHBzOi8vYWRiLTgzMzMzMzAyODI4NTkzOTMuMTMuYXp1cmVkYXRhYnJpY2tzLm5ldC9vaWRjIiwiYXVkIjoiODMzMzMzMDI4Mjg1OTM5MyIsInN1YiI6Imphc29uLnlpcEB0cmVkZW5jZS5jb20iLCJpYXQiOjE3NDcyMDk1MjcsImV4cCI6MTc0NzIxMzEyNywianRpIjoiYjFmMDc5MzMtMGJiNC00OTQ2LTk5ZTUtN2M1MTJkODNkNDZiIn0.D-3n94BUkIyfTpYNMfoz-dhUH-Tvx6RmYSlcrZuXI6nXoDUWxPzIVaY3RYH8DvGc7eLkm3dyBYMqZw_lNfzp8fMjOfsrGKOoeMh3y95JlABDdYNeF8dFC0uPVUyotLlRfXlUON5iTLBcqlrQZ4HiqhYxo1TAb9NMNC490ZnTGPWf7uZN-BqQmT0t4gABVLNDqSkrYoMX3s_zaIna0bea5K9rmkmryjCyMXgyq3y9HaUx1nye8BTpPCHDmg8TpMAAhIXE_h0ciL7wvJdI-B2ZiIaoDpgKM3ug-wa-4ryqvSE95sNQGhL8xU-FLpXa4eJV5W6c68hWOse7PQlBLAKxDA';
  // token = 'eyJraWQiOiIyMDdhN2JlMDhmMjBjNDBkNmUwZmU2ZWY3MzY5YTgxNjMxYjFlNDliMTg1M2VlNWFjMDhmM2NmNzlmZWUxNWYyIiwidHlwIjoiYXQrand0IiwiYWxnIjoiUlMyNTYifQ.eyJjbGllbnRfaWQiOiJmYmM2MTNhNC1jYjExLTQ0ZDAtODE2Mi02NmM0OTBhYTViMTMiLCJzY29wZSI6Im9mZmxpbmVfYWNjZXNzIGVtYWlsIGlhbS5jdXJyZW50LXVzZXI6cmVhZCBvcGVuaWQgaWFtLmFjY2Vzcy1jb250cm9sOnJlYWQgcHJvZmlsZSIsImlzcyI6Imh0dHBzOi8vYWRiLTgzMzMzMzAyODI4NTkzOTMuMTMuYXp1cmVkYXRhYnJpY2tzLm5ldC9vaWRjIiwiYXVkIjoiODMzMzMzMDI4Mjg1OTM5MyIsInN1YiI6Imphc29uLnlpcEB0cmVkZW5jZS5jb20iLCJpYXQiOjE3NDcyMTE4MzEsImV4cCI6MTc0NzIxNTQzMSwianRpIjoiZjdhYTlmZGQtYWExYi00OTNhLTllNGYtNWY3ODg0ZmUzZTU2In0.hRaMZCpG7tV4q9BEz9qZVfqqq9nPCJd7D7LXx_L2oDNYuqXS-zYuPajpl0PbtrkltC0lqFhmfPFE4bvj4hD8_sWrvy568AkC99Of7i5sRdbA6M_zoWWIPIgKS3sSnLmNvbe-VubjPURbiNbd7bTnpluK5ebPcBuR_6yahVz0LDpGwYWiwPuIVePg2xWwPlLxQURHxtEBFzWnDOLDKxlfzUaOeBibDM4HRrpTARC-J0d5AFHgPl-hObbVcJqu9XnMoT57E00oBVMur3VXfAC-kzUTOqr5kWjq6vhHunsH2TCcMfW9br_HTWyN0YRACEDlBQB3g3jlePtUcf_ueta6IQ'
  // ?board_state=rn3rk1/pp1qb1pp/2p2n2/3p1pB1/3P4/1QP2N2/PP1N1PPP/R4RK1 w - - 2 12

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

  async function makeEngineMove() {
    if (game.isGameOver() || game.isDraw()) return;

    setIsThinking(true);
    console.log("Engine is thinking. Current FEN for API:", game.fen());

    // Use your toPgn function to get the movetext
    const moveHistoryArray = game.history();
    const pgnMovetextForAPI = toPgn(moveHistoryArray);
    console.log("Sending movetext to API:", pgnMovetextForAPI);

    const engineMoveSAN = await fetchMoveFromAPI(game.fen(), pgnMovetextForAPI, userToken);
    setIsThinking(false);

    if (engineMoveSAN) {
      console.log("Engine move received from API:", engineMoveSAN);
      safeGameMutate((g) => {
        const result = g.move(engineMoveSAN);
        if (result === null) {
          console.error("API returned an invalid move:", engineMoveSAN, "for FEN:", g.fen());
          window.alert(`Engine tried an invalid move: ${engineMoveSAN}. This could be an API or engine logic issue.`);
        }
      });
    } else {
      console.error("Engine failed to get a move from the API.");
      window.alert("Engine failed to get a move. It might be an API issue or no legal moves available.");
    }
  }

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
      setTimeout(makeEngineMove, 500);
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