import { useEffect, useState } from "react";
import "./App.css";

function App() {
  // State
  const [Board, setBoard] = useState(Array(25).fill(0));
  const [playerRole, setPlayerRole] = useState(null);
  const [gameStatus, setGameStatus] = useState("connecting");
  const [ws, setWs] = useState(null);

  // connect to websocket when component mounts
  useEffect(() => {
    console.log("Connecting to WebSocket...");
    const websocket = new WebSocket("ws://localhost:8081");

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
    if (!ws || gameStatus !== "playing") {
      console.log("Cannot click: game not ready");
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
      <h1>Tic-Tac-Toe Odd-Even</h1>
      <p>Status: {gameStatus}</p>
      <p>Role: {playerRole || "Not assigned"}</p>
    </div>
  );
}

export default App;
