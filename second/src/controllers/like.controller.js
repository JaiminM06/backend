import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { sendNotification } from "../services/notification.service.js"
import { logger } from "../utils/logger.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid or missing video ID")
    }
    //TODO: toggle like on video
    const exists = await Like.findOne({
        video:videoId,
        likedBy:req.user._id
    })
    if(exists){
        await Like.findByIdAndDelete(exists._id)
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Video unliked successfully"))
    }
    const newLike = await Like.create({
        video: videoId,
        likedBy: req.user._id
    })

    // Send real-time notification
    try {
        const video = await Video.findById(videoId);
        if (video) {
            await sendNotification({
                recipientId: video.owner,
                senderId: req.user._id,
                type: 'new_like',
                referenceId: video._id,
                referenceModel: 'Video',
                message: `${req.user.username} liked your video`
            });
        }
    } catch (notificationError) {
        logger.error({ err: notificationError, videoId }, "Failed to send like notification");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Video liked successfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid or missing comment ID")
    }
    //TODO: toggle like on comment
    const exists = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })

    if (exists) {
        await Like.findByIdAndDelete(exists._id)
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Comment unliked successfully"))
    }

    const newLike = await Like.create({
        comment: commentId,
        likedBy: req.user._id
    })

    return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Comment liked successfully"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid or missing tweet ID")
    }
    //TODO: toggle like on tweet
    const exists = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })

    if (exists) {
        await Like.findByIdAndDelete(exists._id)
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Tweet unLiked successfully"))
    }

    const newLike = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    })

    return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Tweet liked successfully"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.find({
        likedBy: req.user._id,
        video: { $exists: true, $ne: null }
    })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate({
            path: 'video',
            populate: { path: 'owner', select: 'username avatar fullName' }
        });

    // Filter out likes whose referenced video has been deleted
    const validLikedVideos = likedVideos.filter(like => like.video);

    return res
        .status(200)
        .json(new ApiResponse(200, validLikedVideos, "Fetched all Liked Videos Successfully"))
})

const getTweetLikeStatus = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid or missing tweet ID");
    }

    const count = await Like.countDocuments({ tweet: tweetId });
    const liked = await Like.exists({ tweet: tweetId, likedBy: req.user._id });

    return res
        .status(200)
        .json(new ApiResponse(200, { count, liked: !!liked }, "Tweet like status fetched successfully"));
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getTweetLikeStatus
}
