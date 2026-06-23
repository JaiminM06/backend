import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { sendNotification } from "../services/notification.service.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
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
        console.error("Failed to send like notification:", notificationError.message);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Video liked successfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
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
    //TODO: get all liked videos
    const allLikedVideos= await Like.find(
        {
            likedBy:req.user._id,
            video:{$ne:null}
        }
        
    ).populate("video")
    return res
    .status(200)
    .json(new ApiResponse(200,allLikedVideos,"Fetched all Liked Videos Successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}