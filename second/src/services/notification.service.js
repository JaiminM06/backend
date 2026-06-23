import Notification from "../models/notification.model.js";
import { getIO, getOnlineUsers } from "../config/socket.js";

export const sendNotification = async (payload) => {
    const { recipientId, senderId, type, referenceId, referenceModel, message } = payload;

    // 1. Create and save a Notification document in MongoDB
    const notification = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type,
        referenceId,
        referenceModel,
        message
    });

    // Populate sender info for frontend rendering
    const savedNotification = await Notification.findById(notification._id)
        .populate("sender", "username avatar");

    // 2. Check if recipient is online
    const onlineUsers = getOnlineUsers();
    const recipientKey = String(recipientId);

    if (onlineUsers.has(recipientKey)) {
        try {
            const socketId = onlineUsers.get(recipientKey);
            const io = getIO();
            io.to(socketId).emit("notification", { notification: savedNotification });
        } catch (socketError) {
            console.error("Failed to deliver real-time notification:", socketError.message);
        }
    }

    return savedNotification;
};
