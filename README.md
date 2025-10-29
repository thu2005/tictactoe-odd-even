# Odd-Even Tic Tac Toe

A distributed multiplayer game demonstrating real-time synchronization and concurrent actions handling. Two players compete to create lines of odd or even numbers, while the server maintains consistency across all clients.

## Link
- https://tictactoe-odd-even.vercel.app/
  
## Key Distributed System Concepts

- **Server Authority**: Server is the single source of truth for game state
- **Concurrent Actions**: Both players can click simultaneously without conflicts
- **Real-time Synchronization**: All clients stay in sync through WebSocket
- **Operational Transforms**: Using operations (INCREMENT) instead of states prevents race conditions

## Game Rules

- 5x5 board, all squares start at 0
- First player is ODD, second player is EVEN
- Click any square to increment its number
- Both players can click simultaneously
- ODD player wins: Get a line of 5 odd numbers
- EVEN player wins: Get a line of 5 even numbers

## Implementation Highlights

### Distributed System Architecture
- Server maintains authoritative game state
- Clients send operations, not states (INCREMENT vs SET_VALUE)
- Server processes actions sequentially to maintain consistency
- All updates are broadcasted to maintain synchronization

### Tech Stack
- Frontend: React (UI + WebSocket client)
- Backend: Node.js with WebSocket (Game state & logic)
- Protocol: WebSocket (Real-time bidirectional communication)

## Getting Started

1. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

2. Start the server:
```bash
cd server
node index.js
```

3. Start the client:
```bash
cd client
npm start
```

4. Open in browser:
- Open http://localhost:3000 in two browser tabs
- First tab = ODD player
- Second tab = EVEN player

## How It Works

### Game Flow
1. Server starts, waiting for WebSocket connections
2. First client connects → assigned as ODD player
3. Second client connects → assigned as EVEN player
4. Players click squares → send INCREMENT operations
5. Server:
   - Processes each operation in order
   - Updates game state
   - Broadcasts new state to all clients
6. Clients update UI only after server confirmation

### Example: Handling Concurrent Clicks
```
Initial state: Square(12) = 5

Time    Player    Action           Server    Result
0ms     ODD      Click Square 12  5 → 6     Both clients see 6
50ms    EVEN     Click Square 12  6 → 7     Both clients see 7

✓ Both clicks processed
✓ All clients in sync
✓ No race conditions
```

## Project Structure

```
├── client/           # React frontend
│   ├── src/         
│   │   ├── App.js   # Game UI and WebSocket client
│   │   └── App.css  # Styles
│   └── package.json
└── server/          
    ├── index.js     # WebSocket server & game logic
    └── package.json
```
