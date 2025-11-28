// lib/websocket.js
import { Server } from 'socket.io';

let io;

export const initWebSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.NODE_ENV === 'production' ? false : ["http://localhost:3000"]
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Join user to their room for private updates
        socket.on('join-user-room', (userId) => {
            socket.join(`user-${userId}`);
        });

        // Join admin room for admin updates
        socket.on('join-admin-room', () => {
            socket.join('admin-room');
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};