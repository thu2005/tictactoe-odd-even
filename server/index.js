const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8081 });
console.log("WebSocket server started on ws://localhost:8081");

let board = Array(25).fill(0);
let players = { odd: null, even: null };
let gameStatus = "waiting";
const winningLines = [
  // row
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  // column
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  // diagonal
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

// function to check if there's a winner
function checkWinner() {
  console.log("Checking winner ... Board: ", board);

  for (const line of winningLines) {
    const values = line.map((index) => board[index]);

    // check if all 5 numbers are odd
    const allOdd = values.every((v) => v > 0 && v % 2 === 1);
    if (allOdd) {
      return { winner: "ODD", line: line };
    }

    // check if all 5 numbers are even
    const allEven = values.every((v) => v > 0 && v % 2 === 0);
    if (allEven) {
      return { winner: "EVEN", line: line };
    }
  }
  return null; // no winner yet
}

// Function to broadcast to all connected clients
function broadcast(message) {
  if (players.odd && players.odd.readyState === WebSocket.OPEN) {
    players.odd.send(message);
  }
  if (players.even && players.even.readyState === WebSocket.OPEN) {
    players.even.send(message);
  }
}

// Function to reset game
function resetGame() {
  board = Array(25).fill(0);
  gameStatus = "playing";
  
  // Broadcast reset to all clients
  const resetMessage = JSON.stringify({
    type: "RESET_GAME",
    board: board,
    gameStatus: gameStatus
  });
  
  broadcast(resetMessage);
  console.log("Game reset!");
}

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
  if (players.odd && players.odd.readyState === WebSocket.OPEN) {
    players.odd.send(
      JSON.stringify({
        type: "GAME_START",
        gameStatus: "playing",
      })
    );
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

      // Handle NEW_GAME message
      if (data.type === "NEW_GAME") {
        resetGame();
        return;
      }

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

        // check for winner
        const result = checkWinner();
        if (result) {
          gameStatus = "finished";
          console.log(`Player ${result.winner} wins!`);
          console.log("Winning line: ", result.line);

          // broadcast GAME_OVER to all clients
          const gameOverMessage = JSON.stringify({
            type: "GAME_OVER",
            winner: result.winner,
            winningLine: result.line,
          });

          if (players.odd && players.odd.readyState === WebSocket.OPEN) {
            players.odd.send(gameOverMessage);
          }
          if (players.even && players.even.readyState === WebSocket.OPEN) {
            players.even.send(gameOverMessage);
          }
        }
      }
    } catch (e) {
      console.error("Error processing message: ", e);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");

    // reset player slots
    if (players.odd === ws) {
      players.odd = null;
      console.log("ODD player left");
    }
    if (players.even === ws) {
      players.even = null;
      console.log("EVEN player left");
    }

    // reset game if any player leaves
    if (!players.odd || !players.even) {
      gameStatus = "waiting";
      board = Array(25).fill(0);
      console.log("Game reset - waiting for players");
    }
  });
});
