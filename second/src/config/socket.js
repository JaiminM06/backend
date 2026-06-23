import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
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

    io.on("connection", (socket) => {
        let registeredUserId = null;

        socket.on("register", (userId) => {
            if (userId) {
                registeredUserId = String(userId);
                onlineUsers.set(registeredUserId, socket.id);
                console.log(`Socket registered: User ${registeredUserId} on socket ${socket.id}`);
            }
        });

        // Register Video Room handlers
        registerRoomHandlers(socket, io);

        socket.on("disconnect", () => {
            if (registeredUserId) {
                onlineUsers.delete(registeredUserId);
                console.log(`Socket disconnected: User ${registeredUserId}`);
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
