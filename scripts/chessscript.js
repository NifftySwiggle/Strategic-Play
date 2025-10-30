(function() {
  if (window.game) {
    console.error('Global "game" variable already defined:', window.game);
    $('#status').text('Error: Game variable conflict. Check console for details.');
    return;
  }

  let ws = new WebSocket('wss://strategic-play.onrender.com');
  let gameId = localStorage.getItem('gameId');
  let playerName = localStorage.getItem('playerName') || 'Player' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  let playerColor = null;
  let board;
  let game = new Chess();
  let pendingMove = null;
  let gameMode = null;
  let puzzleMode = false;
  let currentPuzzle = null;
  let puzzles = [];
  let gameStarted = false;
  let touchStartSquare = null;
  let touchPiece = null;
  let messageQueue = [];

  const pieceThemes = {
    unicode: piece => {
      const unicodePieces = {
        'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
        'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
      };
      const canvas = document.createElement('canvas');
      canvas.width = 80;
      canvas.height = 80;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000000';
      ctx.font = '60px DejaVu Sans, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(unicodePieces[piece], 40, 40);
      return canvas.toDataURL();
    },
    custom: piece => `./assets/origins/${piece}.png`,
    standard: piece => `./assets/standard/${piece}.png`,
    merida: piece => {
      const pieceMap = {
        'wK': 'Chess_klt45.svg', 'wQ': 'Chess_qlt45.svg', 'wR': 'Chess_rlt45.svg',
        'wB': 'Chess_blt45.svg', 'wN': 'Chess_nlt45.svg', 'wP': 'Chess_plt45.svg',
        'bK': 'Chess_kdt45.svg', 'bQ': 'Chess_qdt45.svg', 'bR': 'Chess_rdt45.svg',
        'bB': 'Chess_bdt45.svg', 'bN': 'Chess_ndt45.svg', 'bP': 'Chess_pdt45.svg'
      };
      return `https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/${pieceMap[piece]}/80px-${pieceMap[piece]}`;
    }
  };

  function connectWebSocket() {
    ws = new WebSocket('wss://strategic-play.onrender.com');
    ws.onopen = () => {
      console.log('WebSocket connected');
      $('#status').text('Connected to server.');
      sendMessage({ type: 'setName', name: playerName });
      if (gameId) sendMessage({ type: 'rejoinGame', gameId, name: playerName });
      sendMessage({ type: 'fetchLobby' });
      messageQueue.forEach(message => ws.send(JSON.stringify(message)));
      messageQueue = [];
    };

    ws.onmessage = event => {
      const data = JSON.parse(event.data);
      console.log('Received WebSocket message:', data);
      switch (data.type) {
        case 'nameSet':
          playerName = data.name;
          localStorage.setItem('playerName', playerName);
          $('#player-name').val(playerName);
          $('#status').text(`Name set to ${playerName}.`);
          sendMessage({ type: 'fetchLobby' });
          break;

        case 'playerNameUpdate':
          if (data.player === 'white') {
            $('#white-player').text(data.name);
            $('#white-timer').text(data.timeMode === 'none' ? 
              `White (${data.name}): No Timer` : 
              `White (${data.name}): ${$('#white-timer').text().split(': ')[1] || '3:00'}`);
          } else if (data.player === 'black') {
            $('#black-player').text(data.name);
            $('#black-timer').text(data.timeMode === 'none' ? 
              `Black (${data.name}): No Timer` : 
              `Black (${data.name}): ${$('#black-timer').text().split(': ')[1] || '3:00'}`);
          }
          sendMessage({ type: 'fetchLobby' });
          break;

        case 'lobbyData':
          updateLobby(data.games, data.tournaments);
          break;

        case 'gameCreated':
          gameId = data.gameId;
          playerColor = data.color;
          gameMode = 'online';
          localStorage.setItem('gameId', gameId);
          $('#player-color').text(`Your Color: ${playerColor === 'w' ? 'White' : 'Black'}`);
          $('#delete-game').removeClass('hidden');
          game.reset();
          board.position('start');
          board.orientation(playerColor === 'w' ? 'white' : 'black');
          gameStarted = true;
          if (data.timeMode === 'none') {
            $('#white-timer').text(`White (${data.whitePlayer || 'Unknown'}): No Timer`).show();
            $('#black-timer').text(`Black (${data.blackPlayer || 'Unknown'}): No Timer`).show();
            $('#status').text(`Game ${gameId} created. Waiting for opponent (No Timer)...`);
          } else {
            $('#white-timer').text(`White (${data.whitePlayer || 'Unknown'}): ${formatTime(data.timeControl.minutes * 60)}`).show();
            $('#black-timer').text(`Black (${data.blackPlayer || 'Unknown'}): ${formatTime(data.timeControl.minutes * 60)}`).show();
            $('#status').text(`Game ${gameId} created. Waiting for opponent...`);
          }
          $('#turn').text('Turn: White');
          break;

        case 'opponentJoined':
          // Handle for compatibility with older server versions
          playerColor = data.color;
          gameMode = 'online';
          $('#player-color').text(`Your Color: ${playerColor === 'w' ? 'White' : 'Black'}`);
          board.orientation(playerColor === 'w' ? 'white' : 'black');
          $('#status').text(`Opponent joined game ${data.gameId}. Waiting for game start...`);
          break;

        case 'gameStart':
          gameId = data.gameId;
          playerColor = data.color;
          gameMode = 'online';
          $('#white-player').text(data.whitePlayer || 'Unknown');
          $('#black-player').text(data.blackPlayer || 'Unknown');
          game.load(data.fen);
          board.position(data.fen);
          board.orientation(playerColor === 'w' ? 'white' : 'black');
          gameStarted = true;
          $('#player-color').text(`Your Color: ${playerColor === 'w' ? 'White' : 'Black'}`);
          if (data.timeMode === 'none') {
            $('#white-timer').text(`White (${data.whitePlayer || 'Unknown'}): No Timer`).show();
            $('#black-timer').text(`Black (${data.blackPlayer || 'Unknown'}): No Timer`).show();
            $('#status').text(`Game ${gameId} started. You play ${playerColor === 'w' ? 'White' : 'Black'} (No Timer).`);
          } else {
            $('#white-timer').text(`White (${data.whitePlayer || 'Unknown'}): ${formatTime(data.whiteTime || data.timeControl.minutes * 60)}`).show();
            $('#black-timer').text(`Black (${data.blackPlayer || 'Unknown'}): ${formatTime(data.blackTime || data.timeControl.minutes * 60)}`).show();
            $('#status').text(`Game ${gameId} started. You play ${playerColor === 'w' ? 'White' : 'Black'}.`);
            if (data.turn === 'w') {
              $('#white-timer').addClass('active');
              $('#black-timer').removeClass('active');
            } else {
              $('#black-timer').addClass('active');
              $('#white-timer').removeClass('active');
            }
          }
          $('#turn').text(`Turn: ${data.turn === 'w' ? 'White' : 'Black'}`);
          break;

        case 'move':
          const moveResult = game.move(data.move);
          if (moveResult) {
            board.position(game.fen());
            $('#turn').text(`Turn: ${game.turn() === 'w' ? 'White' : 'Black'}`);
            updateGameInfo();
          } else {
            //console.error('Failed to apply move:', data.move);
            //$('#status').text('Error applying move. Please try again.');
            board.position(game.fen());
          }
          break;

        case 'timerUpdate':
          const timeStr = formatTime(data.timeLeft);
          if (data.player === 'w') {
            $('#white-timer').text(`White (${$('#white-player').text()}): ${timeStr}`);
            $('#white-timer').addClass('active');
            $('#black-timer').removeClass('active');
          } else {
            $('#black-timer').text(`Black (${$('#black-player').text()}): ${timeStr}`);
            $('#black-timer').addClass('active');
            $('#white-timer').removeClass('active');
          }
          $('#turn').text(`Turn: ${data.player === 'w' ? 'White' : 'Black'}`);
          break;

        case 'gameOver':
          $('#status').text(`Game Over: ${data.result}`);
          if (data.result === 'timeout') {
            alert(`${data.winner.charAt(0).toUpperCase() + data.winner.slice(1)} wins by timeout!`);
          }
          $('#white-timer').text(`White (${$('#white-player').text()}): Game Over`).show();
          $('#black-timer').text(`Black (${$('#black-player').text()}): Game Over`).show();
          localStorage.removeItem('gameId');
          gameId = null;
          gameStarted = false;
          playerColor = null;
          gameMode = null;
          $('#delete-game').addClass('hidden');
          $('#player-color').text('Your Color: None');
          break;

        case 'error':
          $('#status').text(data.message);
          break;

        case 'history':
          displayHistory(data.games);
          break;

        case 'tournamentCreated':
          $('#tournamentInfo').removeClass('hidden');
          $('#tournamentStatus').html(`Tournament <strong>${data.tournamentId}</strong> created. Waiting for players...<br>
            <button id="startTournamentBtn" class="bg-blue-500 text-white px-4 py-2 rounded mt-2 w-full hover:bg-blue-600">Start Tournament</button>`);
          $('#startTournamentBtn').click(() => sendMessage({ type: 'startTournament', tournamentId: data.tournamentId }));
          break;

        case 'tournamentLobbyUpdate':
          $('#tournamentInfo').removeClass('hidden');
          // Determine if current client is the creator by comparing names (survives reconnects)
          const isCreatorLocal = playerName && data.creatorName && playerName === data.creatorName;
          $('#tournamentStatus').html(
            `Tournament <strong>${data.tournamentId}</strong> Lobby<br>
            Players: ${data.players.map(p => `<span>${p}</span>`).join(', ')}<br>
            ${isCreatorLocal ? '<button id="startTournamentBtn" class="bg-blue-500 text-white px-4 py-2 rounded mt-2 w-full hover:bg-blue-600">Start Tournament</button>' : ''}`
          );
          if (isCreatorLocal) {
            $('#startTournamentBtn').click(() => sendMessage({ type: 'startTournament', tournamentId: data.tournamentId }));
          }
          break;

        case 'tournamentRoundStart': {
          // Show pairings and scores for the round
          $('#tournamentInfo').removeClass('hidden');
          let html = `<strong>Round ${data.round}</strong><br>Pairings:<ul>`;
          let foundPair = false;
          // Set gameMode and playerColor if user is in a pairing
          if (playerName) {
            data.pairings.forEach(pair => {
              if (pair.length === 2 && (pair[0] === playerName || pair[1] === playerName)) {
                gameMode = 'tournament';
                playerColor = pair[0] === playerName ? 'w' : 'b';
                board.orientation(playerColor === 'w' ? 'white' : 'black');
                foundPair = true;
              }
            });
            if (!foundPair) {
              gameMode = null;
              playerColor = null;
            }
          }
          data.pairings.forEach(pair => {
            if (pair.length === 2) {
              html += `<li>${pair[0]} vs ${pair[1]}</li>`;
            } else {
              html += `<li>${pair[0]} has a bye</li>`;
            }
          });
          html += '</ul>';
          html += '<strong>Leaderboard</strong><ul>';
          Object.entries(data.scores).sort((a, b) => b[1] - a[1]).forEach(([player, score]) => {
            html += `<li>${player}: ${score}</li>`;
          });
          html += '</ul>';
          $('#tournamentStatus').html(html);
          break;
        }

        case 'tournamentFinished': {
          // Show final leaderboard and results
          $('#tournamentInfo').removeClass('hidden');
          let html = `<strong>Tournament Finished!</strong><br><strong>Final Leaderboard</strong><ul>`;
          data.leaderboard.forEach(([player, score]) => {
            html += `<li>${player}: ${score}</li>`;
          });
          html += '</ul>';
          html += '<strong>Results</strong><ul>';
          data.results.forEach(r => {
            html += `<li>Round ${r.round}: ${r.white} vs ${r.black} - ${r.result}${r.winner ? ` (Winner: ${r.winner})` : ''}</li>`;
          });
          html += '</ul>';
          $('#tournamentStatus').html(html);
          break;
        }

        case 'opponentDisconnected':
          $('#status').text('Opponent disconnected. Game ended.');
          gameStarted = false;
          localStorage.removeItem('gameId');
          gameId = null;
          playerColor = null;
          gameMode = null;
          $('#delete-game').addClass('hidden');
          $('#white-timer').text(`White (${$('#white-player').text()}): Disconnected`).show();
          $('#black-timer').text(`Black (${$('#black-player').text()}): Disconnected`).show();
          $('#player-color').text('Your Color: None');
          break;
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...');
      $('#status').text('Disconnected from server. Reconnecting...');
      $('#white-timer').text(`White (${$('#white-player').text()}): Disconnected`).show();
      $('#black-timer').text(`Black (${$('#black-player').text()}): Disconnected`).show();
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = err => {
      console.error('WebSocket error:', err);
      $('#status').text('WebSocket error. Reconnecting...');
    };
  }

  // Debounce helper for resize events
  function debounce(fn, wait) {
    let t = null;
    return function(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // Ensure board resizes smoothly and stays square on layout changes
  const safeResize = debounce(() => {
    try {
      if (board && typeof board.resize === 'function') board.resize();
    } catch (e) {
      // ignore
    }
  }, 100);

  // Attach debounced resize handler
  window.addEventListener('resize', safeResize);

  function sendMessage(message) {
    if (ws.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', message);
      ws.send(JSON.stringify(message));
    } else {
      console.log('Queueing message:', message);
      messageQueue.push(message);
      $('#status').text('Connecting to server, please wait...');
    }
  }

  function formatTime(seconds) {
    if (seconds == null) return 'No Timer';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('#player-name').val(playerName);
    initializeBoard();

    $('#time-mode').change(function() {
      const mode = $(this).val();
      $('#custom-time-inputs').toggle(mode === 'custom');
    });

    fetch('./puzzles.json')
      .then(response => response.json())
      .then(data => puzzles = data)
      .catch(err => console.error('Failed to load puzzles:', err));

    connectWebSocket();

    $('#online-multiplayer').click(() => $('#online-games-modal').show());
    $('#online-multiplayer').click(() => { $('#online-games-modal').show(); requestAnimationFrame(() => safeResize()); });
    $('#close-online-modal').click(() => { $('#online-games-modal').hide(); requestAnimationFrame(() => safeResize()); });
    // My Creations panel toggle button (floating)
    const $myToggle = $('<button id="show-my-creations" class="bg-gray-800 text-white px-3 py-2 rounded">My Creations</button>');
    $myToggle.css({ position: 'fixed', right: '12px', bottom: '12px', zIndex: 1200 });
    $('body').append($myToggle);
    $myToggle.click(() => { $('#my-creations').toggleClass('hidden'); requestAnimationFrame(() => safeResize()); });
    $('#set-name').click(() => {
      const name = $('#player-name').val();
      if (name && name.trim() && name.length <= 20) {
        sendMessage({ type: 'setName', name: name.trim() });
      } else {
        $('#status').text('Please enter a valid name (1-20 characters).');
      }
    });
    $('#create-game').click(() => {
      const mode = $('#time-mode').val();
      const color = $('#color-choice').val();
      let timeControl;
      if (mode === 'none') {
        timeControl = { noTime: true };
      } else if (mode === 'blitz') {
        timeControl = { noTime: false, minutes: 3, increment: 0 };
      } else if (mode === 'rapid') {
        timeControl = { noTime: false, minutes: 5, increment: 2 };
      } else if (mode === 'classical') {
        timeControl = { noTime: false, minutes: 10, increment: 5 };
      } else if (mode === 'custom') {
        const minutes = parseInt($('#custom-minutes').val());
        const increment = parseInt($('#custom-increment').val());
        if (isNaN(minutes) || minutes < 1 || isNaN(increment) || increment < 0) {
          $('#status').text('Invalid custom time settings.');
          return;
        }
        timeControl = { noTime: false, minutes, increment };
      }
      sendMessage({ type: 'createGame', timeControl, color, creator: playerName });
      $('#online-games-modal').hide();
    });
    $('#delete-game').click(() => {
      if (gameId) {
        sendMessage({ type: 'deleteGame', gameId });
        localStorage.removeItem('gameId');
        gameId = null;
        gameStarted = false;
        playerColor = null;
        gameMode = null;
        $('#delete-game').addClass('hidden');
        $('#player-color').text('Your Color: None');
        $('#status').text('Game deleted. Select a game mode to start.');
      }
    });
    $('#show-history').click(() => sendMessage({ type: 'fetchHistory' }));
    $('#create-tournament-form').submit(e => {
      e.preventDefault();
      const minutes = parseInt($('#tournament-minutes').val());
      const increment = parseInt($('#tournament-increment').val());
      let tournamentType = $('#tournament-type').val();
      // Default to 'swiss' if not set or invalid
      if (tournamentType !== 'swiss' && tournamentType !== 'roundrobin') {
        tournamentType = 'swiss';
      }
      // Send a createTournament message; include tournamentType as a separate property
      sendMessage({
        type: 'createTournament',
        name: $('#tournament-name').val(),
        rounds: parseInt($('#rounds').val()),
        timeControl: { minutes, increment },
        tournamentType: tournamentType
      });
      $('#create-tournament-modal').hide();
    });
    // Hide button inside My Creations panel
    $('#hide-my-creations').click(() => { $('#my-creations').addClass('hidden'); requestAnimationFrame(() => safeResize()); });
  $('#tournament').click(() => { $('#create-tournament-modal').show(); requestAnimationFrame(() => safeResize()); });
  $('#close-tournament-modal').click(() => { $('#create-tournament-modal').hide(); requestAnimationFrame(() => safeResize()); });
    $('#piece-theme').change(function() {
      const selectedTheme = $(this).val();
      initializeBoard(selectedTheme);
    });
    $('#new-game-computer').click(() => {
      gameMode = 'computer';
      playerColor = 'w';
      gameStarted = true;
      game.reset();
      board.position('start');
      board.orientation('white');
      $('#status').text('Game started against computer.');
      $('#white-timer, #black-timer').hide();
      $('#promotionModal').hide();
  $('#tournamentInfo').addClass('hidden');
      $('#online-games-modal').hide();
  requestAnimationFrame(() => safeResize());
      $('#player-color').text('Your Color: White');
      updateGameInfo();
    });
    $('#local-multiplayer').click(() => {
      gameMode = 'local';
      playerColor = 'w';
      gameStarted = true;
      game.reset();
      board.position('start');
      board.orientation('white');
      $('#status').text('Local multiplayer game started.');
      $('#white-timer, #black-timer').hide();
      $('#promotionModal').hide();
  $('#tournamentInfo').addClass('hidden');
  $('#online-games-modal').hide();
  requestAnimationFrame(() => safeResize());
      $('#player-color').text('Your Color: White');
      updateGameInfo();
    });
    $('#puzzle-mode').click(() => {
      if (puzzles.length === 0) {
        $('#status').text('Puzzle mode unavailable: No puzzles loaded.');
        return;
      }
      gameMode = 'puzzle';
      puzzleMode = true;
      gameStarted = true;
      currentPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
      game.load(currentPuzzle.fen);
      playerColor = game.turn();
      board.position(currentPuzzle.fen);
      board.orientation(playerColor === 'w' ? 'white' : 'black');
      $('#status').text(`Puzzle: Find the best move for ${playerColor === 'w' ? 'White' : 'Black'}`);
      $('#white-timer, #black-timer').hide();
      $('#online-games-modal').hide();
      $('#player-color').text(`Your Color: ${playerColor === 'w' ? 'White' : 'Black'}`);
      updateGameInfo();
    });
    $('.piece-option').click(function() {
      if (pendingMove) {
        pendingMove.promotion = $(this).data('piece');
        const result = makeMove(pendingMove);
        if (result !== 'snapback') {
          $('#promotionModal').hide();
          pendingMove = null;
        }
      }
    });
  });

  function initializeBoard(theme = 'standard') {
    board = Chessboard('chessboard', {
      draggable: true,
      dropOffBoard: 'snapback',
      position: game.fen(),
      pieceTheme: pieceThemes[theme],
      orientation: playerColor === 'b' ? 'black' : 'white',
      onDragStart,
      onDrop,
      onSnapEnd
    });
    board.resize();
    window.addEventListener('resize', () => board.resize());
    const boardElement = document.getElementById('chessboard');
    boardElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    boardElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    boardElement.addEventListener('touchend', handleTouchEnd, { passive: false });
  }

  function updateLobby(games, tournaments) {
    const gamesList = $('#available-games').empty();
    games.forEach(game => {
      const timeDisplay = game.timeControl.noTime ? 'No Timer' : `${game.timeControl.minutes}|${game.timeControl.increment}`;
      const creatorName = game.creator || 'Unknown';
      const creatorColor = game.creatorColor === 'w' ? 'White' : game.creatorColor === 'b' ? 'Black' : 'Unknown';
      const item = $(`<div class="game-item" data-game-id="${game.id}">Game by ${creatorName} (${creatorColor}) - ${game.players}/2 - ${timeDisplay}</div>`);
      item.append($('<button class="bg-green-500 text-white px-2 py-1 rounded ml-2 hover:bg-green-600">Join</button>').click(() => {
        sendMessage({ type: 'joinGame', gameId: game.id, name: playerName });
        $('#online-games-modal').hide();
      }));
      gamesList.append(item);
    });

    const tournamentList = $('#active-tournaments').empty();
    if (!tournaments || tournaments.length === 0) {
      tournamentList.append('<div class="game-item">No active tournaments</div>');
    } else {
      tournaments.forEach(t => {
        const timeDisplay = t.timeControl.minutes === 0 ? 'No Timer' : `${t.timeControl.minutes}+${t.timeControl.increment}`;
        const creator = t.creatorName || 'Unknown';
        const playersCount = typeof t.playersCount === 'number' ? t.playersCount : (t.players || 0);
        const isCreator = playerName && creator && playerName === creator;
        const btnLabel = isCreator ? 'Manage' : 'Join';
        const item = $(`
          <div class="game-item" data-tournament-id="${t.id}">
            <strong>${t.name || t.id}</strong> - Creator: ${creator} - Players: ${playersCount} - Rounds: ${t.rounds} - Time: ${timeDisplay}
            <button class="joinTournamentBtn bg-green-500 text-white px-2 py-1 rounded ml-2 hover:bg-green-600">${btnLabel}</button>
          </div>
        `);
        item.find('.joinTournamentBtn').click(() => {
          // Send joinTournament which also triggers a tournamentLobbyUpdate with full player list
          sendMessage({ type: 'joinTournament', tournamentId: t.id });
          $('#online-games-modal').hide();
          $('#tournamentInfo').removeClass('hidden');
          $('#tournamentStatus').text(isCreator ? `Manage Tournament ${t.name || t.id}` : `Joined Tournament ${t.name || t.id}`);
        });
        tournamentList.append(item);
      });
    }

  // populate My Creations panel for this player
  populateMyCreations(games, tournaments);
  }

  function onDragStart(source, piece) {
    if (game.game_over() || !gameStarted) return false;
    // Allow moves for online and tournament games
    if (gameMode === 'online' || gameMode === 'tournament') {
      if (!playerColor || game.turn() !== playerColor || piece[0] !== playerColor) {
        console.log('Move blocked: playerColor=', playerColor, 'game.turn()=', game.turn(), 'piece=', piece);
        return false;
      }
      return true;
    }
    // Local and computer games: allow all moves
    return true;
  }

  function onDrop(source, target) {
    const move = { from: source, to: target, promotion: 'q' };
    const legalMoves = game.moves({ square: source, verbose: true });
    const legalMove = legalMoves.find(m => m.to === target);
    if (legalMove) {
      if (legalMove.flags.includes('p')) {
        pendingMove = move;
        $('#promotionModal').show();
        return;
      } else {
        return makeMove(move);
      }
    }
    return 'snapback';
  }

  function onSnapEnd() {
    if (!pendingMove) board.position(game.fen());
  }

  function makeMove(move) {
    const result = game.move(move);
    if (result) {
      board.position(game.fen());
      if (gameMode === 'online') {
        sendMessage({ type: 'move', gameId, move, player: playerColor });
      } else if (gameMode === 'computer' && !game.game_over() && game.turn() !== playerColor) {
        setTimeout(computerMove, 500);
      } else if (gameMode === 'puzzle') {
        checkPuzzleMove(result);
      }
      updateGameInfo();
      return;
    }
    return 'snapback';
  }

  function computerMove() {
    const moves = game.moves({ verbose: true });
    const bestMove = minimax(game, 3, -Infinity, Infinity, true).move;
    game.move(bestMove);
    board.position(game.fen());
    updateGameInfo();
  }

  function minimax(chess, depth, alpha, beta, maximizing) {
    if (depth === 0 || chess.game_over()) return { score: evaluateBoard(chess) };
    const moves = chess.moves({ verbose: true });
    if (maximizing) {
      let best = { score: -Infinity };
      for (let move of moves) {
        chess.move(move);
        const result = minimax(chess, depth - 1, alpha, beta, false);
        chess.undo();
        if (result.score > best.score) best = { score: result.score, move };
        alpha = Math.max(alpha, result.score);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = { score: Infinity };
      for (let move of moves) {
        chess.move(move);
        const result = minimax(chess, depth - 1, alpha, beta, true);
        chess.undo();
        if (result.score < best.score) best = { score: result.score, move };
        beta = Math.min(beta, result.score);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  function evaluateBoard(chess) {
    const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
    let score = 0;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = String.fromCharCode(97 + j) + (8 - i);
        const piece = chess.get(square);
        if (piece) score += pieceValues[piece.type] * (piece.color === 'w' ? 1 : -1);
      }
    }
    return score;
  }

  function checkPuzzleMove(move) {
    if (move.san === currentPuzzle.solution) {
      $('#status').text('Correct! Loading next puzzle...');
      setTimeout(() => {
        currentPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
        game.load(currentPuzzle.fen);
        playerColor = game.turn();
        board.position(currentPuzzle.fen);
        board.orientation(playerColor === 'w' ? 'white' : 'black');
        $('#status').text(`Puzzle: Find the best move for ${playerColor === 'w' ? 'White' : 'Black'}`);
        $('#player-color').text(`Your Color: ${playerColor === 'w' ? 'White' : 'Black'}`);
      }, 2000);
    } else {
      $('#status').text('Incorrect. Try again.');
      game.undo();
      board.position(game.fen());
    }
  }

  function displayHistory(games) {
    const history = games.map(g => `${g.players.join(' vs ')}: ${g.result} (${new Date(g.date).toLocaleTimeString()})`).join('\n');
    alert(history || 'No games played today.');
  }

  function handleTouchStart(event) {
    event.preventDefault();
    const square = getSquareFromEvent(event);
    if (!square) return;
    const piece = game.get(square);
    if (!piece) return;
    touchPiece = piece.color + piece.type;
    touchStartSquare = square;
    if (!onDragStart(square, touchPiece)) touchStartSquare = touchPiece = null;
  }

  function handleTouchMove(event) {
    event.preventDefault();
  }

  function handleTouchEnd(event) {
    event.preventDefault();
    if (!touchStartSquare || !touchPiece) return;
    const targetSquare = getSquareFromEvent(event);
    if (!targetSquare || targetSquare === touchStartSquare) {
      touchStartSquare = touchPiece = null;
      return;
    }
    const result = onDrop(touchStartSquare, targetSquare);
    if (result !== 'snapback') onSnapEnd();
    touchStartSquare = touchPiece = null;
  }

  function getSquareFromEvent(event) {
    const boardElement = document.getElementById('chessboard');
    const rect = boardElement.getBoundingClientRect();
    const squareSize = rect.width / 8;
    const clientX = event.type.startsWith('touch') ? event.changedTouches[0].clientX : event.clientX;
    const clientY = event.type.startsWith('touch') ? event.changedTouches[0].clientY : event.clientY;
    const x = Math.floor((clientX - rect.left) / squareSize);
    const y = Math.floor((clientY - rect.top) / squareSize);
    if (x < 0 || x > 7 || y < 0 || y > 7) return null;
    return String.fromCharCode(97 + x) + (8 - y);
  }

  // Populate the bottom "My Creations" panel with games and tournaments created by the current player
  function populateMyCreations(games, tournaments) {
    try {
      const $panel = $('#my-creations');
      const $gamesList = $('#created-games-list').empty();
      const $tourneyList = $('#created-tournaments-list').empty();
      const myGames = (games || []).filter(g => g.creator && playerName && g.creator === playerName);
      myGames.forEach(g => {
        const timeDisplay = g.timeControl && g.timeControl.noTime ? 'No Timer' : (g.timeControl ? `${g.timeControl.minutes}+${g.timeControl.increment}` : 'Unknown');
        const $item = $(`<div class="creation-item">Game ${g.id} - Players: ${g.players}/2 - ${timeDisplay}</div>`);
        const $del = $(`<button class="bg-red-500 text-white px-2 py-1 rounded ml-2">Delete</button>`).click(() => {
          if (confirm('Delete this game?')) sendMessage({ type: 'deleteGame', gameId: g.id });
        });
        $item.append($del);
        $gamesList.append($item);
      });

      const myTours = (tournaments || []).filter(t => t.creatorName && playerName && t.creatorName === playerName);
      myTours.forEach(t => {
        const playersCount = typeof t.playersCount === 'number' ? t.playersCount : (t.players || 0);
        const $item = $(`<div class="creation-item">${t.name || t.id} - Players: ${playersCount} - Rounds: ${t.rounds}</div>`);
        const $start = $(`<button class="bg-blue-500 text-white px-2 py-1 rounded ml-2">Start</button>`).click(() => {
          if (confirm('Start this tournament now?')) sendMessage({ type: 'startTournament', tournamentId: t.id });
        });
        const $del = $(`<button class="bg-red-500 text-white px-2 py-1 rounded ml-2">Delete</button>`).click(() => {
          if (confirm('Delete this tournament and cancel its games?')) sendMessage({ type: 'deleteTournament', tournamentId: t.id });
        });
        $item.append($start).append($del);
        $tourneyList.append($item);
      });

      if (myGames.length === 0 && myTours.length === 0) {
        $panel.addClass('hidden');
      } else {
        $panel.removeClass('hidden');
      }
    } catch (e) {
      console.error('populateMyCreations error', e);
    }
  }

  function updateGameInfo() {
    $('#status').text(game.in_checkmate() ? `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!` :
                      game.in_draw() ? 'Draw!' :
                      game.in_check() ? 'Check!' :
                      gameStarted ? `${game.turn() === 'w' ? 'White' : 'Black'} to move` :
                      'Select a game mode to start');
    $('#turn').text(`Turn: ${game.turn() === 'w' ? 'White' : 'Black'}`);
  }
})();