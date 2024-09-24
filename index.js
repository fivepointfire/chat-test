const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

let userCount = 0;
let socketToUserId = new Map(); // Map from socketID to userID (which is the userCount)

io.on('connection', (socket) => {
    // Assign a user ID to the connected socket
    userCount++;
    socketToUserId.set(socket.id, userCount);
    console.log('A user connected with socketID:', socket.id);

    // Broadcast typing event when a user is typing
    socket.on('typing', () => {
        const userId = socketToUserId.get(socket.id);
        socket.broadcast.emit('typing', userId); // Send to all other clients
    });

    // Broadcast stop typing event when a user stops typing
    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing'); // Send to all other clients
    });

    // Handle chat message
    socket.on('chat message', (msg) => {
        const userId = socketToUserId.get(socket.id);
        console.log('User', socket.id, 'message:', msg);
        // Emit the message to all clients
        io.emit('chat message', { id: userId, message: msg });
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        console.log('User', socket.id, 'disconnected');
        socketToUserId.delete(socket.id); // Clean up the map on disconnect
    });
});

// Start the server
server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
