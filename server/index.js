const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store connected users
const connectedUsers = new Map();
const liveStreams = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join live stream
  socket.on('join-live', (data) => {
    const { username } = data;
    connectedUsers.set(socket.id, { username, joinedAt: new Date() });
    
    // Notify others that user joined
    socket.broadcast.emit('user-joined', { 
      id: socket.id, 
      username,
      participants: Array.from(connectedUsers.values())
    });
    
    // Send current participants to new user
    socket.emit('participants-list', Array.from(connectedUsers.values()));
    
    console.log(`${username} joined the live stream`);
  });

  // Handle WebRTC signaling
  socket.on('offer', (data) => {
    socket.broadcast.emit('offer', {
      offer: data.offer,
      from: socket.id
    });
  });

  socket.on('answer', (data) => {
    socket.broadcast.emit('answer', {
      answer: data.answer,
      from: socket.id
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.broadcast.emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    });
  });

  // Chat messages
  socket.on('chat-message', (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      const message = {
        id: Date.now().toString(),
        user: user.username,
        message: data.message,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      
      io.emit('chat-message', message);
    }
  });

  // Start live stream
  socket.on('start-stream', (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      liveStreams.set(socket.id, { 
        streamer: user.username, 
        startedAt: new Date() 
      });
      io.emit('stream-started', { streamer: user.username });
    }
  });

  // Stop live stream
  socket.on('stop-stream', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      liveStreams.delete(socket.id);
      io.emit('stream-stopped', { streamer: user.username });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      connectedUsers.delete(socket.id);
      liveStreams.delete(socket.id);
      
      io.emit('user-left', { 
        id: socket.id, 
        username: user.username,
        participants: Array.from(connectedUsers.values())
      });
      
      console.log(`${user.username} left the live stream`);
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`WebRTC Server running on port ${PORT}`);
  console.log(`CORS enabled for all origins`);
}); 