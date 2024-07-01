const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);
  const io = socketIo(httpServer);

  const users = {};

  io.on('connection', (socket) => {
    socket.on('new-user', (name) => {
      users[socket.id] = name;
      socket.broadcast.emit('user-connected', name);
    });

    socket.on('send-chat-message', (message) => {
      socket.broadcast.emit('chat-message', { message, name: users[socket.id] });
    });

    socket.on('disconnect', () => {
      socket.broadcast.emit('user-disconnected', users[socket.id]);
      delete users[socket.id];
    });
  });

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
  });
});
