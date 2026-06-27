import { logger } from "../utils/logger.js";

export const roomViewers = new Map(); // Map<roomKey (string), Set<socketId (string)>>

export const registerRoomHandlers = (socket, io) => {
    // --- join_video_room ---
    socket.on("join_video_room", ({ videoId }) => {
        if (!videoId) return;
        const roomKey = `video-${videoId}`;
        socket.join(roomKey);

        if (!roomViewers.has(roomKey)) {
            roomViewers.set(roomKey, new Set());
        }
        roomViewers.get(roomKey).add(socket.id);

        io.to(roomKey).emit("viewer_count_update", { 
            videoId, 
            count: roomViewers.get(roomKey).size 
        });
    });

    // --- leave_video_room ---
    socket.on("leave_video_room", ({ videoId }) => {
        if (!videoId) return;
        const roomKey = `video-${videoId}`;
        socket.leave(roomKey);

        if (roomViewers.has(roomKey)) {
            const viewers = roomViewers.get(roomKey);
            viewers.delete(socket.id);
            if (viewers.size === 0) {
                roomViewers.delete(roomKey);
            } else {
                io.to(roomKey).emit("viewer_count_update", { 
                    videoId, 
                    count: viewers.size 
                });
            }
        }
    });

    // --- join_tweet_room ---
    socket.on('join_tweet_room', ({ tweetId }) => {
        if (!tweetId) return;
        socket.join(`tweet-${tweetId}`);
        logger.info({ tweetId, socketId: socket.id }, 'Client joined tweet room');
    });

    // --- leave_tweet_room ---
    socket.on('leave_tweet_room', ({ tweetId }) => {
        if (!tweetId) return;
        socket.leave(`tweet-${tweetId}`);
        logger.info({ tweetId, socketId: socket.id }, 'Client left tweet room');
    });

    // --- typing_comment ---
    socket.on("typing_comment", ({ videoId, username }) => {
        if (!videoId) return;
        const roomKey = `video-${videoId}`;
        socket.to(roomKey).emit("user_typing", { username });
    });

    // --- disconnect cleanup ---
    socket.on("disconnect", () => {
        for (const [roomKey, viewers] of roomViewers.entries()) {
            if (viewers.has(socket.id)) {
                viewers.delete(socket.id);
                const videoId = roomKey.replace("video-", "");

                if (viewers.size === 0) {
                    roomViewers.delete(roomKey);
                } else {
                    io.to(roomKey).emit("viewer_count_update", { 
                        videoId, 
                        count: viewers.size 
                    });
                }
            }
        }
        logger.info({ socketId: socket.id }, 'Client disconnected');
    });
};
