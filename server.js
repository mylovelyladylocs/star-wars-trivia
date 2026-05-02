'use strict';

const express   = require('express');
const http      = require('http');
const { Server } = require('socket.io');
const path      = require('path');
const QUESTIONS = require('./data/questions');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

const PORT = process.env.PORT || 3000;
const QUESTION_DURATION_MS = 20000;

// ── Static files ──────────────────────────────────────────────────────────────
const publicDir = path.join(__dirname, 'public');
console.log('Serving static files from:', publicDir);
app.use(express.static(publicDir));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.send('OK'));

// ── Fallback: serve index.html for all non-API routes ─────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// ── In-memory rooms ───────────────────────────────────────────────────────────
// Map<roomCode, RoomState>
const rooms = new Map();

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function uniqueCode() {
  let code;
  do { code = makeCode(); } while (rooms.has(code));
  return code;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function prepareQuestions() {
  return shuffle(QUESTIONS).map(q => {
    const correctText = q.options[q.correct];
    const opts = shuffle(q.options);
    return { text: q.text, options: opts, correct: opts.indexOf(correctText) };
  });
}

function playersList(room) {
  return Array.from(room.players.values()).map(p => ({
    name: p.name,
    score: p.score,
    correctCount: p.correctCount,
    connected: p.connected,
  }));
}

function connectedCount(room) {
  let n = 0;
  room.players.forEach(p => { if (p.connected) n++; });
  return n;
}

function answeredConnectedCount(room) {
  let n = 0;
  room.players.forEach(p => { if (p.connected && p.answered) n++; });
  return n;
}

// ── Room cleanup ──────────────────────────────────────────────────────────────
function deleteRoom(room) {
  if (room.timerHandle)  clearTimeout(room.timerHandle);
  if (room.revealHandle) clearTimeout(room.revealHandle);
  rooms.delete(room.code);
}

// ── Core game logic ───────────────────────────────────────────────────────────
function sendQuestion(room) {
  room.status = 'question';
  room.currentQuestionIndex++;

  // Reset per-question player state
  room.players.forEach(p => {
    p.answered    = false;
    p.answeredAt  = null;
    p.answerIdx   = null;
  });

  const q = room.questions[room.currentQuestionIndex];
  room.questionStartTime = Date.now();

  io.to(room.code).emit('question', {
    questionIndex:    room.currentQuestionIndex,
    text:             q.text,
    options:          q.options,
    totalQuestions:   room.questions.length,
    questionDuration: QUESTION_DURATION_MS,
    serverTimestamp:  room.questionStartTime,
  });

  // Server-side authoritative timer
  room.timerHandle = setTimeout(() => revealQuestion(room), QUESTION_DURATION_MS);
}

function revealQuestion(room) {
  if (room.status !== 'question') return;
  room.status = 'reveal';

  if (room.timerHandle) { clearTimeout(room.timerHandle); room.timerHandle = null; }

  const q       = room.questions[room.currentQuestionIndex];
  const elapsed = Date.now() - room.questionStartTime;

  const playerResults = [];
  room.players.forEach(p => {
    let delta = 0;
    if (p.answered && p.answerIdx === q.correct) {
      const answerElapsed = p.answeredAt - room.questionStartTime;
      delta = 1000 + Math.round(500 * ((QUESTION_DURATION_MS - answerElapsed) / QUESTION_DURATION_MS));
    } else if (p.answered && p.answerIdx !== q.correct) {
      delta = -500;
    }
    // No answer = 0 delta
    p.score = Math.max(0, p.score + delta);
    if (p.answered && p.answerIdx === q.correct) p.correctCount++;

    playerResults.push({
      name:     p.name,
      answerIdx: p.answerIdx,
      correct:  p.answered && p.answerIdx === q.correct,
      delta,
      newScore: p.score,
    });
  });

  io.to(room.code).emit('question_reveal', {
    correctIndex:  q.correct,
    playerResults,
  });

  // Show leaderboard after a short delay
  room.revealHandle = setTimeout(() => sendLeaderboard(room), 3000);
}

function sendLeaderboard(room) {
  room.status = 'leaderboard';
  const isLast = room.currentQuestionIndex >= room.questions.length - 1;

  const sorted = Array.from(room.players.values())
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({
      name:         p.name,
      score:        p.score,
      correctCount: p.correctCount,
      rank:         i + 1,
      connected:    p.connected,
    }));

  io.to(room.code).emit('leaderboard', { players: sorted, isLastQuestion: isLast });

  if (isLast) {
    room.status = 'finished';
    io.to(room.code).emit('game_over', { players: sorted });
  }
}

// ── Socket.io ─────────────────────────────────────────────────────────────────
io.on('connection', socket => {

  // ── create_room ─────────────────────────────────────────────────────────────
  socket.on('create_room', ({ name }) => {
    if (!name || typeof name !== 'string') return;
    name = name.trim().slice(0, 20);
    if (!name) return;

    const code = uniqueCode();
    const room = {
      code,
      hostSocketId: socket.id,
      players: new Map(),
      status: 'lobby',
      questions: [],
      currentQuestionIndex: -1,
      questionStartTime: null,
      questionDuration: QUESTION_DURATION_MS,
      timerHandle: null,
      revealHandle: null,
    };

    room.players.set(socket.id, {
      socketId: socket.id,
      name,
      score: 0,
      correctCount: 0,
      answered: false,
      answeredAt: null,
      answerIdx: null,
      connected: true,
    });

    rooms.set(code, room);
    socket.join(code);
    socket.emit('room_created', { code, isHost: true, players: playersList(room) });
  });

  // ── join_room ────────────────────────────────────────────────────────────────
  socket.on('join_room', ({ code, name }) => {
    if (!code || !name) return;
    code = code.trim().toUpperCase().slice(0, 4);
    name = name.trim().slice(0, 20);
    if (!code || !name) return;

    const room = rooms.get(code);
    if (!room) { socket.emit('room_not_found'); return; }
    if (room.status !== 'lobby') { socket.emit('error', { message: 'Game already in progress.' }); return; }

    // Check for duplicate name
    for (const p of room.players.values()) {
      if (p.name.toLowerCase() === name.toLowerCase()) {
        socket.emit('name_taken'); return;
      }
    }

    room.players.set(socket.id, {
      socketId: socket.id,
      name,
      score: 0,
      correctCount: 0,
      answered: false,
      answeredAt: null,
      answerIdx: null,
      connected: true,
    });

    socket.join(code);
    socket.emit('room_joined', { code, players: playersList(room), isHost: false });
    io.to(code).emit('player_joined', { players: playersList(room) });
  });

  // ── start_game ───────────────────────────────────────────────────────────────
  socket.on('start_game', () => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;
    if (room.hostSocketId !== socket.id) return;
    if (room.status !== 'lobby') return;
    if (room.players.size < 1) return;

    room.questions = prepareQuestions();
    room.currentQuestionIndex = -1;
    io.to(room.code).emit('game_started');
    sendQuestion(room);
  });

  // ── submit_answer ────────────────────────────────────────────────────────────
  socket.on('submit_answer', ({ questionIndex, answerIdx }) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.status !== 'question') return;
    if (questionIndex !== room.currentQuestionIndex) return;

    const player = room.players.get(socket.id);
    if (!player || player.answered) return;

    player.answered   = true;
    player.answeredAt = Date.now();
    player.answerIdx  = answerIdx;

    socket.emit('answer_accepted', { questionIndex });

    const total     = connectedCount(room);
    const answered  = answeredConnectedCount(room);
    io.to(room.code).emit('player_answered', { answeredCount: answered, totalCount: total });

    // Early reveal if all connected players answered
    if (answered >= total) {
      clearTimeout(room.timerHandle);
      room.timerHandle = null;
      revealQuestion(room);
    }
  });

  // ── request_next ─────────────────────────────────────────────────────────────
  socket.on('request_next', () => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;
    if (room.hostSocketId !== socket.id) return;
    if (room.status !== 'leaderboard') return;
    if (room.currentQuestionIndex >= room.questions.length - 1) return;

    sendQuestion(room);
  });

  // ── disconnect ───────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    player.connected = false;
    const leftName = player.name;

    // If room is empty, delete it
    const stillConnected = Array.from(room.players.values()).filter(p => p.connected);
    if (stillConnected.length === 0) {
      deleteRoom(room);
      return;
    }

    // Host left
    if (room.hostSocketId === socket.id) {
      if (room.status === 'lobby') {
        // Promote next player
        const next = stillConnected[0];
        room.hostSocketId = next.socketId;
        io.to(room.code).emit('player_left', { players: playersList(room), leftName });
        io.to(room.code).emit('host_changed', { newHostName: next.name });
      } else {
        // Mid-game abort
        io.to(room.code).emit('host_left_game');
        deleteRoom(room);
      }
      return;
    }

    // Regular player left
    io.to(room.code).emit('player_left', { players: playersList(room), leftName });

    // If mid-question, check if remaining connected players all answered
    if (room.status === 'question') {
      const total    = connectedCount(room);
      const answered = answeredConnectedCount(room);
      io.to(room.code).emit('player_answered', { answeredCount: answered, totalCount: total });
      if (total > 0 && answered >= total) {
        clearTimeout(room.timerHandle);
        room.timerHandle = null;
        revealQuestion(room);
      }
    }
  });
});

// ── Utility: find room by socket id ──────────────────────────────────────────
function getRoomBySocket(socketId) {
  for (const room of rooms.values()) {
    if (room.players.has(socketId)) return room;
  }
  return null;
}

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`Star Wars Trivia server running on port ${PORT}`);
});
