import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import jwt from "jsonwebtoken";
import redisClient from "./redis.js";
import { registerRoomHandlers } from "../services/room.service.js";

let io = null;
const onlineUsers = new Map(); // Map<userId (string), socketId (string)>

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || "http://localhost:5173",
            credentials: true,
            methods: ["GET", "POST"]
        }
    });

    // Attach Redis Adapter for horizontal scaling
    if (redisClient) {
        const pubClient = redisClient;
        const subClient = pubClient.duplicate();
        io.adapter(createAdapter(pubClient, subClient));
        console.log("Socket.IO Redis adapter attached successfully.");
    } else {
        console.warn("Redis client not initialized, skipping Socket.IO Redis adapter.");
    }

    // JWT authentication middleware — reads from cookie (httpOnly, sent via withCredentials)
    io.use(async (socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.cookie
                    ?.split(';')
                    .find(c => c.trim().startsWith('accessToken='))
                    ?.split('=')[1];

            if (!token) return next(new Error("Authentication required"));

            const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
            const decoded = jwt.verify(token, secret);
            socket.userId = decoded._id;   // attach verified userId to socket
            next();
        } catch (err) {
            next(new Error("Invalid or expired token"));
        }
    });

    io.on("connection", (socket) => {
        if (socket.userId) {
            onlineUsers.set(socket.userId, socket.id);
            console.log(`Socket connected: User ${socket.userId} on socket ${socket.id}`);
        }

        // Register Video Room handlers
        registerRoomHandlers(socket, io);

        socket.on("disconnect", () => {
            if (socket.userId) {
                onlineUsers.delete(socket.userId);
                console.log(`Socket disconnected: User ${socket.userId}`);
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io is not initialized yet.");
    }
    return io;
};

export const getOnlineUsers = () => {
    return onlineUsers;
};
