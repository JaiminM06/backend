import Notification from "../models/notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getMyNotifications = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const unreadOnly = req.query.unreadOnly === "true";

    const filter = { recipient: req.user._id };
    if (unreadOnly) {
        filter.isRead = false;
    }

    const totalCount = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
        recipient: req.user._id,
        isRead: false
    });

    const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("sender", "username avatar");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { notifications, totalCount, unreadCount, page, limit },
                "Notifications retrieved successfully"
            )
        );
});

const markAsRead = asyncHandler(async (req, res) => {
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new ApiError(400, "notificationIds must be a non-empty array");
    }

    const result = await Notification.updateMany(
        {
            _id: { $in: notificationIds },
            recipient: req.user._id
        },
        {
            $set: { isRead: true }
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { updatedCount: result.modifiedCount },
                "Notifications marked as read successfully"
            )
        );
});

const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        {
            recipient: req.user._id,
            isRead: false
        },
        {
            $set: { isRead: true }
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "All notifications marked as read successfully"
            )
        );
});

export {
    getMyNotifications,
    markAsRead,
    markAllAsRead
};
