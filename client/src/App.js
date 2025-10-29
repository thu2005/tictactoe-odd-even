import { useEffect, useState } from "react";
import "./App.css";

function App() {
  // State
  const [board, setBoard] = useState(Array(25).fill(0));
  const [playerRole, setPlayerRole] = useState(null);
  const [gameStatus, setGameStatus] = useState("connecting");
  const [ws, setWs] = useState(null);
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState(null);

  // connect to websocket when component mounts
  useEffect(() => {
    console.log("Connecting to WebSocket...");
    const websocket = new WebSocket("wss://tictactoe-odd-even.onrender.com");

    websocket.onopen = () => {
      console.log("Connected to server");
      setGameStatus("waiting");
    };

    websocket.onmessage = (event) => {
      try {
        console.log("Raw message: ", event.data);

        if (!event.data || event.data === "undefined") {
          console.warn("invalid message received");
          return;
        }

        const data = JSON.parse(event.data);
        console.log("Parsed: ", data);

        if (data.type === "PLAYER_ASSIGNED") {
          setPlayerRole(data.player);
          setBoard(data.board);
          setGameStatus(data.gameStatus);
          console.log(`Assigned as ${data.player} player`);
        }

        // handle UPDATE
        if (data.type === "UPDATE") {
          setBoard((prevBoard) => {
            const newBoard = [...prevBoard];
            newBoard[data.square] = data.value;
            return newBoard;
          });
          console.log(`Square ${data.square} update to ${data.value}`);
        }

        // handle GAME_START
        if (data.type === "GAME_START") {
          setGameStatus(data.gameStatus);
          console.log("Game started");
        }

        // Handle RESET_GAME
        if (data.type === "RESET_GAME") {
          setBoard(data.board);
          setGameStatus(data.gameStatus);
          setWinner(null);
          setWinningLine(null);
          console.log("Game reset!");
        }

        // Handle GAME_OVER
        if (data.type === "GAME_OVER") {
          setGameStatus("finished");
          setWinner(data.winner);
          setWinningLine(data.winningLine);
          console.log(`Player ${data.winner} wins!`);
        }
      } catch (error) {
        console.error("Parse error: ", error, "Data: ", event.data);
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error: ", error);
      setGameStatus("error");
    };

    websocket.onclose = () => {
      console.log("Disconnected");
      setGameStatus("disconnected");
    };

    setWs(websocket);

    // cleanup: close connection when component unmounts
    return () => {
      websocket.close();
    };
  }, []); // empty dependency array ensures this runs once on mount

  // handle square click
  const handleSquareClick = (index) => {
    if (!ws || gameStatus !== "playing" || gameStatus === "finished") {
      console.log("Cannot click: game not ready or finished");
      return;
    }

    console.log(`Clicking square ${index}`);
    ws.send(
      JSON.stringify({
        type: "INCREMENT",
        square: index,
      })
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Tic-Tac-Toe Odd-Even</h1>

        {/* Connection & Player Info */}
        <div className="info">
          <p>Status: {gameStatus}</p>
          <p>Role: {playerRole || "Not assigned"}</p>
        </div>

        {/* Game board */}
        <div className="board">
          {board.map((value, index) => {
            const isWinningSquare = winningLine && winningLine.includes(index);
            return (
              <div
                key={index}
                className={`square ${value % 2 === 0 ? "even" : "odd"} ${
                  isWinningSquare ? "winning" : ""
                }`}
                onClick={() => handleSquareClick(index)}
              >
                {value}
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        {gameStatus === "waiting" && (
          <p className="waiting">Waiting for opponent...</p>
        )}
        {gameStatus === "playing" && (
          <p className="instructions">
            Click any square to increment!
            {playerRole === "ODD"
              ? " Try to make a line of odd numbers."
              : " Try to make a line of even numbers."}
          </p>
        )}

        {gameStatus === "finished" && (
          <div className="game-over">
            <h2>Game Over!</h2>
            <p className={`winner ${winner?.toLowerCase()}`}>
              {winner === playerRole ? "You Win!" : "You Lose!"}
            </p>
            <p className="winner-info">
              <strong>{winner} Player</strong> wins!
            </p>
            <button
              className="new-game-btn"
              onClick={() => {
                if (ws) {
                  ws.send(JSON.stringify({ type: "NEW_GAME" }));
                }
              }}
            >
              New Game
            </button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
