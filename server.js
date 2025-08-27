// Core modules
const path = require('path');
const http = require('http');

// External dependencies
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { Chess } = require('chess.js');
const { v4: uuidv4 } = require('uuid');

// App setup
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'chess.html'))); // Serve static frontend

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'chess.html'));
});

// Port setup
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
const clients = new Map();
const games = new Map();
const tournaments = new Map();
const gameHistory = [];

wss.on('connection', (ws) => {
  console.log('Client connected');
  const clientId = uuidv4();
  clients.set(ws, { id: clientId, name: `Player${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, gameId: null, ws });

  // Log available Chess methods for debugging
  const chess = new Chess();
  console.log('Chess instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(chess)));

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error('Invalid message format:', e);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      return;
    }

    console.log('Received message:', data);

    switch (data.type) {
      case 'setName':
        if (typeof data.name === 'string' && data.name.trim() && data.name.length <= 20) {
          const oldName = clients.get(ws).name;
          clients.get(ws).name = data.name.trim();
          ws.send(JSON.stringify({ type: 'nameSet', name: clients.get(ws).name }));
          const game = games.get(clients.get(ws).gameId);
          if (game) {
            if (game.whitePlayer === clientId) {
              game.whitePlayerName = clients.get(ws).name;
            } else if (game.blackPlayer === clientId) {
              game.blackPlayerName = clients.get(ws).name;
            }
            broadcastToGame(game.id, {
              type: 'playerNameUpdate',
              player: game.whitePlayer === clientId ? 'white' : 'black',
              name: clients.get(ws).name,
              timeMode: game.timeControl.noTime ? 'none' : 'timed'
            });
          }
          broadcastLobby();
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid name' }));
        }
        break;

      case 'createGame':
        if (!data.timeControl || (!data.timeControl.noTime && 
          (!Number.isInteger(data.timeControl.minutes) || !Number.isInteger(data.timeControl.increment) ||
           data.timeControl.minutes < 1 || data.timeControl.increment < 0))) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid time control' }));
          return;
        }
        if (!['w', 'b'].includes(data.color)) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid color choice' }));
          return;
        }
        const gameId = uuidv4();
        const chess = new Chess();
        const timeControl = data.timeControl;
        const creatorColor = data.color;
        const newGame = {
          id: gameId,
          chess,
          whitePlayer: creatorColor === 'w' ? clientId : null,
          whitePlayerName: creatorColor === 'w' ? clients.get(ws).name : null,
          blackPlayer: creatorColor === 'b' ? clientId : null,
          blackPlayerName: creatorColor === 'b' ? clients.get(ws).name : null,
          creator: clients.get(ws).name,
          creatorColor,
          timeControl,
          timeMode: timeControl.noTime ? 'none' : 'timed',
          whiteTime: timeControl.noTime ? null : timeControl.minutes * 60 * 1000,
          blackTime: timeControl.noTime ? null : timeControl.minutes * 60 * 1000,
          isActive: false,
          timerInterval: null,
          currentTurnStartTime: null,
          players: 1
        };
        games.set(gameId, newGame);
        clients.get(ws).gameId = gameId;
        ws.send(JSON.stringify({
          type: 'gameCreated',
          gameId,
          color: creatorColor,
          timeMode: newGame.timeMode,
          timeControl,
          whitePlayer: newGame.whitePlayerName,
          blackPlayer: newGame.blackPlayerName
        }));
        console.log(`Game created: ${gameId} by ${clients.get(ws).name} as ${creatorColor}`);
        broadcastLobby();
        break;

      case 'joinGame':
        const gameToJoin = games.get(data.gameId);
        if (!gameToJoin) {
          ws.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
          return;
        }
        if (gameToJoin.whitePlayer && gameToJoin.blackPlayer) {
          ws.send(JSON.stringify({ type: 'error', message: 'Game is full' }));
          return;
        }
        const joinerColor = gameToJoin.creatorColor === 'w' ? 'b' : 'w';
        if (joinerColor === 'w') {
          gameToJoin.whitePlayer = clientId;
          gameToJoin.whitePlayerName = data.name || clients.get(ws).name;
        } else {
          gameToJoin.blackPlayer = clientId;
          gameToJoin.blackPlayerName = data.name || clients.get(ws).name;
        }
        gameToJoin.players = 2;
        gameToJoin.isActive = true;
        clients.get(ws).gameId = data.gameId;
        const fen = gameToJoin.chess.fen();
        broadcastToGame(data.gameId, {
          type: 'gameStart',
          gameId: data.gameId,
          whitePlayer: gameToJoin.whitePlayerName,
          blackPlayer: gameToJoin.blackPlayerName,
          fen,
          timeMode: gameToJoin.timeMode,
          timeControl: gameToJoin.timeControl,
          whiteTime: gameToJoin.timeControl.noTime ? null : Math.ceil(gameToJoin.whiteTime / 1000),
          blackTime: gameToJoin.timeControl.noTime ? null : Math.ceil(gameToJoin.blackTime / 1000),
          turn: gameToJoin.chess.turn()
        });
        if (!gameToJoin.timeControl.noTime) {
          startGameTimer(data.gameId);
          console.log(`Timer started for game ${data.gameId}`);
        }
        broadcastLobby();
        break;

      case 'rejoinGame':
        const gameToRejoin = games.get(data.gameId);
        if (!gameToRejoin) {
          ws.send(JSON.stringify({ type: 'error', message: `Game ${data.gameId} not found for rejoin` }));
          console.log(`Rejoin failed: Game ${data.gameId} not found`);
          return;
        }
        clients.get(ws).gameId = data.gameId;
        clients.get(ws).name = data.name || clients.get(ws).name;
        const color = gameToRejoin.whitePlayer === clientId ? 'w' : gameToRejoin.blackPlayer === clientId ? 'b' : null;
        if (!color) {
          ws.send(JSON.stringify({ type: 'error', message: 'Not a player in this game' }));
          console.log(`Rejoin failed: Client ${clientId} not a player in game ${data.gameId}`);
          return;
        }
        if (gameToRejoin.whitePlayer === clientId) {
          gameToRejoin.whitePlayerName = clients.get(ws).name;
        } else {
          gameToRejoin.blackPlayerName = clients.get(ws).name;
        }
        ws.send(JSON.stringify({
          type: 'gameStart',
          gameId: data.gameId,
          color,
          whitePlayer: gameToRejoin.whitePlayerName,
          blackPlayer: gameToRejoin.blackPlayerName,
          fen: gameToRejoin.chess.fen(),
          timeMode: gameToRejoin.timeMode,
          timeControl: gameToRejoin.timeControl,
          whiteTime: gameToRejoin.timeControl.noTime ? null : Math.ceil(gameToRejoin.whiteTime / 1000),
          blackTime: gameToRejoin.timeControl.noTime ? null : Math.ceil(gameToRejoin.blackTime / 1000),
          turn: gameToRejoin.chess.turn()
        }));
        if (gameToRejoin.isActive && !gameToRejoin.timeControl.noTime) {
          startGameTimer(data.gameId);
        }
        console.log(`Client ${clientId} rejoined game ${data.gameId} as ${color}`);
        break;

      case 'move':
        const currentGame = games.get(data.gameId);
        if (!currentGame || !currentGame.isActive) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid game' }));
          return;
        }
        const playerId = clients.get(ws).id;
        const playerColor = currentGame.whitePlayer === playerId ? 'w' : currentGame.blackPlayer === playerId ? 'b' : null;
        if (data.player !== playerColor || currentGame.chess.turn() !== playerColor) {
          ws.send(JSON.stringify({ type: 'error', message: 'Not your turn or color' }));
          return;
        }
        const moveResult = currentGame.chess.move(data.move);
        if (moveResult) {
          if (!currentGame.timeControl.noTime && currentGame.isActive) {
            const timeUsed = Date.now() - currentGame.currentTurnStartTime;
            if (currentGame.chess.turn() === 'w') {
              currentGame.blackTime -= timeUsed;
              currentGame.blackTime += (currentGame.timeControl.increment || 0) * 1000;
              currentGame.blackTime = Math.max(0, currentGame.blackTime);
              broadcastToGame(data.gameId, { 
                type: 'timerUpdate', 
                player: 'black', 
                timeLeft: Math.ceil(currentGame.blackTime / 1000) 
              });
            } else {
              currentGame.whiteTime -= timeUsed;
              currentGame.whiteTime += (currentGame.timeControl.increment || 0) * 1000;
              currentGame.whiteTime = Math.max(0, currentGame.whiteTime);
              broadcastToGame(data.gameId, { 
                type: 'timerUpdate', 
                player: 'white', 
                timeLeft: Math.ceil(currentGame.whiteTime / 1000) 
              });
            }
            currentGame.currentTurnStartTime = Date.now();
            console.log(`Move made in game ${data.gameId}, new times - white: ${currentGame.whiteTime}, black: ${currentGame.blackTime}`);
          }
          broadcastToGame(data.gameId, {
            type: 'move',
            gameId: data.gameId,
            move: moveResult,
            fen: currentGame.chess.fen()
          });
          // Check game over conditions
          try {
            const isGameOver = typeof currentGame.chess.gameOver === 'function'
              ? currentGame.chess.gameOver()
              : (currentGame.chess.isGameOver?.() ||
                 currentGame.chess.isCheckmate?.() ||
                 currentGame.chess.isStalemate?.() ||
                 currentGame.chess.isDraw?.() ||
                 currentGame.chess.isThreefoldRepetition?.() ||
                 currentGame.chess.isInsufficientMaterial?.());
            if (isGameOver) {
              if (currentGame.timerInterval) clearInterval(currentGame.timerInterval);
              currentGame.isActive = false;
              let result = 'Draw';
              if (typeof currentGame.chess.isCheckmate === 'function' && currentGame.chess.isCheckmate()) {
                result = currentGame.chess.turn() === 'w' ? 'Black wins' : 'White wins';
              }
              broadcastToGame(data.gameId, { type: 'gameOver', result });
              gameHistory.push({
                players: [currentGame.whitePlayerName || 'Unknown', currentGame.blackPlayerName || 'Unknown'],
                result,
                date: new Date().toISOString()
              });
              games.delete(data.gameId);
              broadcastLobby();
              console.log(`Game ${data.gameId} ended, result: ${result}`);
            }
          } catch (e) {
            console.error(`Error checking game over in game ${data.gameId}:`, e);
            ws.send(JSON.stringify({ type: 'error', message: 'Error checking game state, continuing game' }));
          }
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid move' }));
        }
        break;

      case 'deleteGame':
        const gameToDelete = games.get(data.gameId);
        if (!gameToDelete) {
          ws.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
          return;
        }
        const playerIdDelete = clients.get(ws).id;
        if (gameToDelete.whitePlayer !== playerIdDelete && gameToDelete.blackPlayer !== playerIdDelete) {
          ws.send(JSON.stringify({ type: 'error', message: 'Not authorized to delete this game' }));
          return;
        }
        if (gameToDelete.timerInterval) clearInterval(gameToDelete.timerInterval);
        broadcastToGame(data.gameId, { type: 'gameOver', result: 'Game deleted' });
        games.delete(data.gameId);
        broadcastLobby();
        console.log(`Game ${data.gameId} deleted by ${clients.get(ws).name}`);
        break;

      case 'fetchLobby':
        ws.send(JSON.stringify({
          type: 'lobbyData',
          games: Array.from(games.values()).map(g => ({
            id: g.id,
            creator: g.creator,
            creatorColor: g.creatorColor,
            players: g.players,
            timeControl: g.timeControl
          })),
          tournaments: Array.from(tournaments.values()).map(t => ({
            id: t.id,
            name: t.name,
            players: t.players ? t.players.length : 0,
            rounds: t.rounds,
            timeControl: t.timeControl
          }))
        }));
        break;

      case 'fetchHistory':
        const today = new Date().toISOString().split('T')[0];
        ws.send(JSON.stringify({
          type: 'history',
          games: gameHistory.filter(g => g.date.startsWith(today))
        }));
        break;

      case 'createTournament':
        const tournamentId = uuidv4();
        tournaments.set(tournamentId, {
          id: tournamentId,
          name: data.name,
          rounds: data.rounds,
          timeControl: data.timeControl,
          players: [clients.get(ws).name],
          creator: clientId,
          started: false
        });
        ws.send(JSON.stringify({ type: 'tournamentCreated', tournamentId }));
        broadcastLobby();
        break;

      case 'joinTournament':
        const tournament = tournaments.get(data.tournamentId);
        if (!tournament) {
          ws.send(JSON.stringify({ type: 'error', message: 'Tournament not found' }));
          return;
        }
        if (!tournament.players.includes(clients.get(ws).name)) {
          tournament.players.push(clients.get(ws).name);
        }
        broadcastToTournament(data.tournamentId, {
          type: 'tournamentLobbyUpdate',
          tournamentId: data.tournamentId,
          players: tournament.players,
          isCreator: clientId === tournament.creator
        });
        broadcastLobby();
        break;

      case 'startTournament':
        const t = tournaments.get(data.tournamentId);
        if (!t || t.creator !== clientId) {
          ws.send(JSON.stringify({ type: 'error', message: 'Not authorized or tournament not found' }));
          return;
        }
        t.started = true;
        broadcastToTournament(data.tournamentId, {
          type: 'tournamentLobbyUpdate',
          tournamentId: data.tournamentId,
          players: t.players,
          isCreator: false
        });
        broadcastLobby();
        break;

      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
        break;
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      if (client.gameId) {
        const game = games.get(client.gameId);
        if (game) {
          if (game.timerInterval) clearInterval(game.timerInterval);
          game.isActive = false;
          broadcastToGame(client.gameId, { type: 'opponentDisconnected' });
          games.delete(client.gameId);
          console.log(`Player ${client.name} disconnected from game ${client.gameId}, game deleted`);
        }
      }
      clients.delete(ws);
      broadcastLobby();
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

function broadcastToGame(gameId, message) {
  const game = games.get(gameId);
  if (game) {
    [game.whitePlayer, game.blackPlayer].forEach(playerId => {
      if (playerId) {
        const clientEntry = Array.from(clients.entries()).find(([_, c]) => c.id === playerId);
        if (clientEntry && clientEntry[0].readyState === WebSocket.OPEN) {
          const ws = clientEntry[0];
          const color = playerId === game.whitePlayer ? 'w' : 'b';
          const msg = { ...message, color };
          try {
            ws.send(JSON.stringify(msg));
          } catch (e) {
            console.error(`Error sending message to client in game ${gameId}:`, e);
          }
        }
      }
    });
  }
}

function broadcastToTournament(tournamentId, message) {
  const tournament = tournaments.get(tournamentId);
  if (tournament) {
    clients.forEach((client, ws) => {
      if (ws.readyState === WebSocket.OPEN && tournament.players.includes(client.name)) {
        try {
          ws.send(JSON.stringify(message));
        } catch (e) {
          console.error(`Error sending message to client in tournament ${tournamentId}:`, e);
        }
      }
    });
  }
}

function broadcastLobby() {
  const lobbyData = {
    type: 'lobbyData',
    games: Array.from(games.values()).map(g => ({
      id: g.id,
      creator: g.creator,
      creatorColor: g.creatorColor,
      players: g.players,
      timeControl: g.timeControl
    })),
    tournaments: Array.from(tournaments.values()).map(t => ({
      id: t.id,
      name: t.name,
      players: t.players ? t.players.length : 0,
      rounds: t.rounds,
      timeControl: t.timeControl
    }))
  };
  clients.forEach((client, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(lobbyData));
      } catch (e) {
        console.error('Error broadcasting lobby:', e);
      }
    }
  });
}

function startGameTimer(gameId) {
  const game = games.get(gameId);
  if (!game || game.timeControl.noTime || !game.isActive) return;

  if (game.timerInterval) clearInterval(game.timerInterval);
  game.currentTurnStartTime = Date.now();
  
  game.timerInterval = setInterval(() => {
    const currentTurn = game.chess.turn();
    const elapsed = Date.now() - game.currentTurnStartTime;
    const playerTime = currentTurn === 'w' ? game.whiteTime : game.blackTime;

    if (game.isActive) {
      const remainingTime = playerTime - elapsed;
      if (remainingTime <= 0) {
        clearInterval(game.timerInterval);
        game.isActive = false;
        const winner = currentTurn === 'w' ? 'black' : 'white';
        broadcastToGame(gameId, { 
          type: 'gameOver', 
          result: 'timeout', 
          winner 
        });
        gameHistory.push({
          players: [game.whitePlayerName || 'Unknown', game.blackPlayerName || 'Unknown'],
          result: `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins (timeout)`,
          date: new Date().toISOString()
        });
        games.delete(gameId);
        broadcastLobby();
        console.log(`Game ${gameId} ended due to timeout, winner: ${winner}`);
      } else {
        broadcastToGame(gameId, {
          type: 'timerUpdate',
          player: currentTurn,
          timeLeft: Math.max(0, Math.ceil(remainingTime / 1000))
        });
      }
    }
  }, 100);
}

console.log(`WebSocket server running on port ${process.env.PORT || 8080}`);