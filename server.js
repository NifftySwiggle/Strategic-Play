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
app.use(express.static(__dirname)); // Serve static frontend

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
const tournamentHistory = [];

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
              let resultText = 'Draw', winnerName = null, gameResult = '0.5-0.5';
              const checkmate = (typeof currentGame.chess.isCheckmate === 'function' && currentGame.chess.isCheckmate());
              const drawish = (
                (typeof currentGame.chess.isDraw === 'function' && currentGame.chess.isDraw()) ||
                (typeof currentGame.chess.isStalemate === 'function' && currentGame.chess.isStalemate()) ||
                (typeof currentGame.chess.isThreefoldRepetition === 'function' && currentGame.chess.isThreefoldRepetition()) ||
                (typeof currentGame.chess.isInsufficientMaterial === 'function' && currentGame.chess.isInsufficientMaterial())
              );
              if (checkmate) {
                winnerName = currentGame.chess.turn() === 'w' ? currentGame.blackPlayerName : currentGame.whitePlayerName;
                resultText = winnerName + ' wins (checkmate)';
                if (winnerName === currentGame.whitePlayerName) gameResult = '1-0';
                else if (winnerName === currentGame.blackPlayerName) gameResult = '0-1';
              } else if (drawish) {
                resultText = 'Draw';
                gameResult = '0.5-0.5';
              }

              broadcastToGame(data.gameId, { type: 'gameOver', result: resultText });

              // If this was a tournament game, update tournament state
              if (currentGame.tournamentId) {
                const t = tournaments.get(currentGame.tournamentId);
                if (t) {
                  const rd = currentGame.round || t.currentRound;
                  const white = currentGame.whitePlayerName;
                  const black = currentGame.blackPlayerName;
                  t.results.push({ round: rd, white, black, result: gameResult, winner: winnerName });
                  t.scores[white] = (t.scores[white] || 0) + (gameResult === '1-0' ? 1 : gameResult === '0.5-0.5' ? 0.5 : 0);
                  t.scores[black] = (t.scores[black] || 0) + (gameResult === '0-1' ? 1 : gameResult === '0.5-0.5' ? 0.5 : 0);
                  if (t.activeGames) t.activeGames.delete(currentGame.id);
                  // If all games in round finished, advance or finish
                  if (t.activeGames && t.activeGames.size === 0) {
                    if (t.currentRound < t.rounds) {
                      t.currentRound += 1;
                      startTournamentRound(t);
                    } else {
                      t.finished = true;
                      const maxScore = Math.max(...Object.values(t.scores));
                      const winners = Object.keys(t.scores).filter(p => t.scores[p] === maxScore);
                      broadcastToTournament(t.id, {
                        type: 'tournamentFinished',
                        tournamentId: t.id,
                        winners,
                        scores: t.scores,
                        results: t.results,
                        leaderboard: Object.entries(t.scores).sort((a,b)=>b[1]-a[1])
                      });
                      tournamentHistory.push({
                        ...t,
                        finishedAt: new Date().toISOString(),
                        winners,
                        finalScores: t.scores,
                        finalResults: t.results,
                        leaderboard: Object.entries(t.scores).sort((a,b)=>b[1]-a[1])
                      });
                    }
                  }
                }
              }

              gameHistory.push({
                players: [currentGame.whitePlayerName || 'Unknown', currentGame.blackPlayerName || 'Unknown'],
                result: resultText,
                date: new Date().toISOString()
              });
              games.delete(data.gameId);
              broadcastLobby();
              console.log(`Game ${data.gameId} ended, result: ${resultText}`);
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
            playersCount: t.players ? t.players.length : 0,
            rounds: t.rounds,
            timeControl: t.timeControl,
            creatorName: t.creatorName,
            started: !!t.started
          }))
        }));
        break;

      case 'fetchHistory':
        const today = new Date().toISOString().split('T')[0];
        ws.send(JSON.stringify({
          type: 'history',
          games: gameHistory.filter(g => g.date.startsWith(today)),
          tournaments: tournamentHistory.filter(t => t.finishedAt.startsWith(today))
        }));
        break;

      case 'createTournament': {
  // Accept tournament type (swiss/roundrobin), default to swiss if not provided
  const tournamentType = (data.tournamentType === 'roundrobin' || data.type === 'roundrobin') ? 'roundrobin' : 'swiss';
        const tournamentId = uuidv4();
        const creatorName = clients.get(ws).name;
        tournaments.set(tournamentId, {
          id: tournamentId,
          name: data.name,
          rounds: data.rounds,
          timeControl: data.timeControl,
          type: tournamentType,
          players: [creatorName],
          creatorId: clientId,
          creatorName,
          started: false,
          currentRound: 0,
          results: [],
          scores: {},
          pairings: [],
          finished: false,
          activeGames: new Map()
        });
        // Inform the creator and include creatorName so client can persist identity by name
        ws.send(JSON.stringify({ type: 'tournamentCreated', tournamentId, tournamentType, creatorName }));
        broadcastLobby();
        break;
      }

      case 'joinTournament':
        const tournament = tournaments.get(data.tournamentId);
        if (!tournament) {
          ws.send(JSON.stringify({ type: 'error', message: 'Tournament not found' }));
          return;
        }
        const playerNameJoining = clients.get(ws).name;
        if (!tournament.players.includes(playerNameJoining)) {
          tournament.players.push(playerNameJoining);
        }
        // Broadcast an update including the full player list and creatorName. Clients can determine
        // whether they are the creator by comparing their name to creatorName after reconnect.
        broadcastToTournament(data.tournamentId, {
          type: 'tournamentLobbyUpdate',
          tournamentId: data.tournamentId,
          players: tournament.players,
          creatorName: tournament.creatorName,
          started: !!tournament.started
        });
        broadcastLobby();
        break;

      case 'startTournament': {
        const t = tournaments.get(data.tournamentId);
        if (!t) {
          ws.send(JSON.stringify({ type: 'error', message: 'Not authorized or tournament not found' }));
          return;
        }
        // Allow the creator to act either by the original connection id or by matching name
        const requesterName = clients.get(ws).name;
        if (t.creatorId !== clientId && t.creatorName !== requesterName) {
          ws.send(JSON.stringify({ type: 'error', message: 'Not authorized or tournament not found' }));
          return;
        }
        if (t.started) {
          ws.send(JSON.stringify({ type: 'error', message: 'Tournament already started' }));
          return;
        }
        if (t.players.length < 2) {
          ws.send(JSON.stringify({ type: 'error', message: 'Need at least 2 players to start tournament' }));
          return;
        }
        t.started = true;
        t.currentRound = 1;
        t.results = [];
        t.scores = {};
        t.finished = false;
        t.activeGames = new Map();
        t.players.forEach(p => t.scores[p] = 0);
        // Use helper to start first round (auto-create games and notify players)
        startTournamentRound(t);
        broadcastLobby();
        break;
      }

      case 'deleteTournament': {
        const t = tournaments.get(data.tournamentId);
        if (!t) {
          ws.send(JSON.stringify({ type: 'error', message: 'Tournament not found' }));
          return;
        }
        const requesterName = clients.get(ws).name;
        // Only allow original creator or reconnecting creator by name
        if (t.creatorId !== clientId && t.creatorName !== requesterName) {
          ws.send(JSON.stringify({ type: 'error', message: 'Not authorized to delete this tournament' }));
          return;
        }
        // Notify participants and delete any active games for this tournament
        if (t.activeGames) {
          for (const [gameId] of t.activeGames) {
            const g = games.get(gameId);
            if (g) {
              if (g.timerInterval) clearInterval(g.timerInterval);
              broadcastToGame(gameId, { type: 'gameOver', result: 'Tournament cancelled' });
              games.delete(gameId);
            }
          }
        }
        tournaments.delete(data.tournamentId);
        // Inform clients in the tournament (if any) that it was deleted
        clients.forEach((client, wsClient) => {
          if (wsClient.readyState === WebSocket.OPEN && t.players.includes(client.name)) {
            try {
              wsClient.send(JSON.stringify({ type: 'tournamentDeleted', tournamentId: data.tournamentId }));
            } catch (e) {
              console.error('Error notifying client of tournament deletion:', e);
            }
          }
        });
        broadcastLobby();
        break;
      }

      case 'forfeit':
        const forfeitGame = games.get(data.gameId);
        if (!forfeitGame || !forfeitGame.isActive) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid game' }));
          return;
        }
        const forfeiterId = clients.get(ws).id;
        const forfeiterColor = forfeitGame.whitePlayer === forfeiterId ? 'w' : forfeitGame.blackPlayer === forfeiterId ? 'b' : null;
        if (!forfeiterColor) {
          ws.send(JSON.stringify({ type: 'error', message: 'Not a player in this game' }));
          return;
        }
        const winnerColor = forfeiterColor === 'w' ? 'b' : 'w';
        const winner = winnerColor === 'w' ? forfeitGame.whitePlayerName : forfeitGame.blackPlayerName;
        forfeitGame.isActive = false;
        if (forfeitGame.timerInterval) clearInterval(forfeitGame.timerInterval);
        broadcastToGame(data.gameId, { type: 'gameOver', result: 'forfeit', winner });
        // If tournament game, update results and possibly advance
        if (forfeitGame.tournamentId) {
          const t = tournaments.get(forfeitGame.tournamentId);
          if (t) {
            // Update scores: winner gets 1, loser gets 0
            t.scores[winner] = (t.scores[winner] || 0) + 1;
            const loser = forfeiterColor === 'w' ? forfeitGame.whitePlayerName : forfeitGame.blackPlayerName;
            t.scores[loser] = t.scores[loser] || 0;
            t.results.push({ white: forfeitGame.whitePlayerName, black: forfeitGame.blackPlayerName, result: winnerColor === 'w' ? '1-0' : '0-1', round: t.currentRound });
            // Remove from active games
            t.activeGames.delete(data.gameId);
            // Check if round is complete
            if (t.activeGames.size === 0) {
              t.currentRound++;
              if (t.currentRound > t.rounds) {
                // Tournament finished
                t.finished = true;
                const sorted = Object.entries(t.scores).sort((a, b) => b[1] - a[1]);
                const winnerName = sorted[0][0];
                broadcastToTournament(forfeitGame.tournamentId, { type: 'tournamentOver', winner: winnerName, standings: sorted });
                tournamentHistory.push({
                  id: t.id,
                  name: t.name,
                  winner: winnerName,
                  players: t.players.length,
                  finishedAt: new Date().toISOString()
                });
              } else {
                // Start next round
                startTournamentRound(t);
              }
            }
          }
        }
        gameHistory.push({
          players: [forfeitGame.whitePlayerName || 'Unknown', forfeitGame.blackPlayerName || 'Unknown'],
          result: `${winner} wins (forfeit)`,
          date: new Date().toISOString()
        });
        games.delete(data.gameId);
        broadcastLobby();
        break;

// Swiss pairing: pair by score, avoid repeats
function generateSwissPairings(players, results, round, scores) {
  const sorted = [...players].sort((a, b) => (scores[b] - scores[a]) || (Math.random() - 0.5));
  const pairings = [];
  const used = new Set();
  for (let i = 0; i < sorted.length; i++) {
    if (used.has(sorted[i])) continue;
    let found = false;
    for (let j = i + 1; j < sorted.length; j++) {
      if (used.has(sorted[j])) continue;
      const alreadyPlayed = results.some(r => (r.white === sorted[i] && r.black === sorted[j]) || (r.white === sorted[j] && r.black === sorted[i]));
      if (!alreadyPlayed) {
        pairings.push([sorted[i], sorted[j]]);
        used.add(sorted[i]);
        used.add(sorted[j]);
        found = true;
        break;
      }
    }
    if (!found) {
      pairings.push([sorted[i]]);
      used.add(sorted[i]);
    }
  }
  return pairings;
}

// Round Robin pairing: all play all, one round at a time
function generateRoundRobinPairings(players, round) {
  const n = players.length;
  const arr = [...players];
  if (n % 2 === 1) arr.push(null);
  for (let r = 1; r < round; r++) {
    arr.splice(1, 0, arr.pop());
  }
  const pairings = [];
  for (let i = 0; i < arr.length / 2; i++) {
    const p1 = arr[i];
    const p2 = arr[arr.length - 1 - i];
    if (p1 && p2) pairings.push([p1, p2]);
    else if (p1) pairings.push([p1]);
    else if (p2) pairings.push([p2]);
  }
  return pairings;
}

// Start a tournament round: generate pairings, create games, notify participants, and broadcast assignments
function startTournamentRound(t) {
  const pairings = t.type === 'swiss'
    ? generateSwissPairings(t.players, t.results, t.currentRound, t.scores)
    : generateRoundRobinPairings(t.players, t.currentRound);
  t.pairings = pairings;
  t.activeGames = new Map();
  const assignments = [];

  pairings.forEach(pair => {
    if (pair.length === 2) {
      const [whiteName, blackName] = pair;
      const gameId = uuidv4();
      const chess = new Chess();
      const timeControl = t.timeControl;
      const newGame = {
        id: gameId,
        chess,
        whitePlayer: null,
        whitePlayerName: whiteName,
        blackPlayer: null,
        blackPlayerName: blackName,
        creator: whiteName,
        creatorColor: 'w',
        timeControl,
        timeMode: timeControl.noTime ? 'none' : 'timed',
        whiteTime: timeControl.noTime ? null : timeControl.minutes * 60 * 1000,
        blackTime: timeControl.noTime ? null : timeControl.minutes * 60 * 1000,
        isActive: true,
        timerInterval: null,
        currentTurnStartTime: Date.now(),
        players: 2,
        tournamentId: t.id,
        round: t.currentRound
      };

      // Bind current connected clients by name to white/black
      const entries = Array.from(clients.entries());
      const whiteEntry = entries.find(([_, c]) => c.name === whiteName);
      const blackEntry = entries.find(([_, c]) => c.name === blackName);
      if (whiteEntry) {
        const [whiteWs, whiteClient] = whiteEntry;
        newGame.whitePlayer = whiteClient.id;
        whiteClient.gameId = gameId;
      }
      if (blackEntry) {
        const [blackWs, blackClient] = blackEntry;
        newGame.blackPlayer = blackClient.id;
        blackClient.gameId = gameId;
      }

      games.set(gameId, newGame);
      t.activeGames.set(gameId, { white: whiteName, black: blackName });
      assignments.push({ gameId, white: whiteName, black: blackName, round: t.currentRound });

      // Immediately notify players if connected
      broadcastToGame(gameId, {
        type: 'gameStart',
        gameId,
        whitePlayer: newGame.whitePlayerName,
        blackPlayer: newGame.blackPlayerName,
        fen: newGame.chess.fen(),
        timeMode: newGame.timeMode,
        timeControl: newGame.timeControl,
        whiteTime: newGame.timeControl.noTime ? null : Math.ceil(newGame.whiteTime / 1000),
        blackTime: newGame.timeControl.noTime ? null : Math.ceil(newGame.blackTime / 1000),
        turn: newGame.chess.turn(),
        gameMode: 'tournament'
      });

      if (!newGame.timeControl.noTime) startGameTimer(gameId);
    } else if (pair.length === 1) {
      // Bye -> award 1 point
      const p = pair[0];
      t.results.push({ round: t.currentRound, white: p, black: null, result: '1-0', winner: p });
      t.scores[p] = (t.scores[p] || 0) + 1;
    }
  });

  // Broadcast round start and explicit assignments so clients can auto-rejoin
  broadcastToTournament(t.id, {
    type: 'tournamentRoundStart',
    tournamentId: t.id,
    round: t.currentRound,
    pairings: t.pairings,
    scores: t.scores,
    type: t.type
  });
  broadcastToTournament(t.id, {
    type: 'tournamentGameAssignments',
    tournamentId: t.id,
    round: t.currentRound,
    assignments
  });
}

// (Removed duplicate startTournamentRound definition to avoid conflicts)

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
          // If this was a tournament game, count as forfeit win for the opponent
          if (game.tournamentId) {
            const t = tournaments.get(game.tournamentId);
            if (t) {
              const white = game.whitePlayerName;
              const black = game.blackPlayerName;
              let winnerName = null;
              if (game.whitePlayer === client.id) winnerName = black; else if (game.blackPlayer === client.id) winnerName = white;
              const resultText = winnerName ? `${winnerName} wins (opponent disconnected)` : 'Game ended (disconnect)';
              const gameResult = winnerName === white ? '1-0' : winnerName === black ? '0-1' : '0.5-0.5';
              broadcastToGame(client.gameId, { type: 'gameOver', result: resultText });
              t.results.push({ round: game.round || t.currentRound, white, black, result: gameResult, winner: winnerName });
              if (winnerName === white) t.scores[white] = (t.scores[white] || 0) + 1;
              else if (winnerName === black) t.scores[black] = (t.scores[black] || 0) + 1;
              else {
                t.scores[white] = (t.scores[white] || 0) + 0.5;
                t.scores[black] = (t.scores[black] || 0) + 0.5;
              }
              if (t.activeGames) t.activeGames.delete(game.id);
              if (t.activeGames && t.activeGames.size === 0) {
                if (t.currentRound < t.rounds) {
                  t.currentRound += 1;
                  startTournamentRound(t);
                } else {
                  t.finished = true;
                  const maxScore = Math.max(...Object.values(t.scores));
                  const winners = Object.keys(t.scores).filter(p => t.scores[p] === maxScore);
                  broadcastToTournament(t.id, {
                    type: 'tournamentFinished',
                    tournamentId: t.id,
                    winners,
                    scores: t.scores,
                    results: t.results,
                    leaderboard: Object.entries(t.scores).sort((a,b)=>b[1]-a[1])
                  });
                }
              }
            }
          } else {
            broadcastToGame(client.gameId, { type: 'opponentDisconnected' });
          }
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
      playersCount: t.players ? t.players.length : 0,
      rounds: t.rounds,
      timeControl: t.timeControl,
      creatorName: t.creatorName,
      started: !!t.started
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
        // If tournament game, update results and possibly advance
        if (game.tournamentId) {
          const t = tournaments.get(game.tournamentId);
          if (t) {
            const white = game.whitePlayerName;
            const black = game.blackPlayerName;
            const winnerName = winner === 'white' ? white : black;
            const gameResult = winner === 'white' ? '1-0' : '0-1';
            t.results.push({ round: game.round || t.currentRound, white, black, result: gameResult, winner: winnerName });
            if (winner === 'white') t.scores[white] = (t.scores[white] || 0) + 1;
            else t.scores[black] = (t.scores[black] || 0) + 1;
            if (t.activeGames) t.activeGames.delete(gameId);
            if (t.activeGames && t.activeGames.size === 0) {
              if (t.currentRound < t.rounds) {
                t.currentRound += 1;
                startTournamentRound(t);
              } else {
                t.finished = true;
                const maxScore = Math.max(...Object.values(t.scores));
                const winners = Object.keys(t.scores).filter(p => t.scores[p] === maxScore);
                broadcastToTournament(t.id, {
                  type: 'tournamentFinished',
                  tournamentId: t.id,
                  winners,
                  scores: t.scores,
                  results: t.results,
                  leaderboard: Object.entries(t.scores).sort((a,b)=>b[1]-a[1])
                });
                tournamentHistory.push({
                  ...t,
                  finishedAt: new Date().toISOString(),
                  winners,
                  finalScores: t.scores,
                  finalResults: t.results,
                  leaderboard: Object.entries(t.scores).sort((a,b)=>b[1]-a[1])
                });
              }
            }
          }
        }
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
