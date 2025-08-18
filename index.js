const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app); // Create an HTTP server from our Express app

// Create a Socket.IO server on top of the HTTP server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow connections from anywhere for our development
    methods: ["GET", "POST"]
  }
});

// This block runs every time a new client (our app) connects
io.on('connection', (socket) => {
  console.log('A user connected with id:', socket.id);

  // Send a welcome message to the user that just connected
  socket.emit('message', 'Welcome to the Fixer backend!');

  // This block runs when that specific user disconnects
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// A simple route for testing that the HTTP server is still working
app.get('/', (req, res) => {
  res.send({ status: 'Server is running' });
});

const port = process.env.PORT || 10000; // Render provides a PORT env var

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
