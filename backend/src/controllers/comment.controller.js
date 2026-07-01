import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { getIO } from "../config/socket.js"
import { logger } from "../utils/logger.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const page  = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip  = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      throw new ApiError(400, 'Invalid video ID');
    }

    const [comments, total] = await Promise.all([
      Comment.find({ video: videoId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('owner', 'username avatar fullName'),
      Comment.countDocuments({ video: videoId })
    ]);

    return res.status(200).json(
      new ApiResponse(200, {
        comments,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total
      }, 'Comments fetched successfully')
    );
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid or missing video ID")
    }
    const { content } = req.body
    const comment = await Comment.create(
        {
            content: content,
            video: videoId,
            owner: req.user._id
        }
    )

    // Populate owner info for WebSocket real-time delivery
    const savedComment = await Comment.findById(comment._id).populate("owner", "username avatar")

    try {
        const io = getIO()
        const roomKey = `video-${videoId}`
        io.to(roomKey).emit("new_comment", { comment: savedComment })
    } catch (socketError) {
        logger.error({ err: socketError, videoId }, "Failed to emit new_comment via socket")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment Added Successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid or missing comment ID")
    }
    const { content } = req.body

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment")
    }

    comment.content = content
    const updatedComment = await comment.save()

    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment Updated Successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid or missing comment ID")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)
    
    return res
        .status(200)
        .json(new ApiResponse(200, deletedComment, "Comment deleted Successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}