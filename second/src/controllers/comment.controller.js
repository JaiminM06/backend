import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { getIO } from "../config/socket.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // ✅ Validate ObjectId (VERY IMPORTANT)
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid video ID",
        });
    }

    // ✅ Fetch comments
    const comments = await Comment.find({ video: videoId })
        .sort({ createdAt: -1 }) // newest first
        .populate("owner", "username avatar")


    return res.status(200).json({
        success: true,
        data: comments,
    });
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
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
        console.error("Failed to emit new_comment via socket:", socketError.message)
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment Added Successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    const { content } = req.body
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,

        {
            $set: {
                content: content
            }

        },
        {
            new: true
        }
    )
    if (!updatedComment) {
        throw new ApiError(404, "Comment not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment Updated Successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    const deletedComment = await Comment.findByIdAndDelete(commentId)
    if (!deletedComment) {
        throw new ApiError(404, "Comment not found")
    }
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