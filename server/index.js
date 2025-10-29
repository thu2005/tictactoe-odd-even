const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8081 });
console.log("WebSocket server started on ws://localhost:8081");

let board = Array(25).fill(0);
let players = { odd: null, even: null };
let gameStatus = "waiting";

wss.on("connection", (ws) => {
  console.log("new client connected");

  let playerRole = null;

  // Assign player role
  if (!players.odd) {
    players.odd = ws;
    playerRole = "ODD";
    console.log("Player assigned: ODD");
  } else if (!players.even) {
    players.even = ws;
    playerRole = "EVEN";
    gameStatus = "playing";
    console.log("Player assigned: EVEN");
    console.log("Game started");
  } else {
    // Game is full, reject connection
    ws.send(
      JSON.stringify({
        type: "ERROR",
        message: "Game is full",
      })
    );
    ws.close();
    return;
  }

  // Send PLAYER_ASSIGNED message to this client
  ws.send(
    JSON.stringify({
      type: "PLAYER_ASSIGNED",
      player: playerRole,
      board: board,
      gameStatus: gameStatus,
    })
  );

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Received: ", data);

      if (data.type === "INCREMENT") {
        const square = data.square;

        // validate square index
        if (square < 0 || square >= 25) {
          console.error("invalid square: ", square);
          return;
        }

        // check game status
        if (gameStatus !== "playing") {
          console.log("Game not started yet");
          return;
        }

        // SERVER AUTHORITY: Server increments the board
        board[square] += 1;
        console.log(`Square ${square} incremented to ${board[square]}`);

        // BROADCAST UPDATE to ALL clients
        const updateMessage = JSON.stringify({
          type: "UPDATE",
          square: square,
          value: board[square],
        });

        // send to both players
        if (players.odd && players.odd.readyState === WebSocket.OPEN) {
          players.odd.send(updateMessage);
        }
        if (players.even && players.even.readyState === WebSocket.OPEN) {
          players.even.send(updateMessage);
        }
      }
    } catch (e) {
      console.error("Error processing message: ", e);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
