import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import WatchHistory from "../models/watchHistory.model.js"
import {Like} from "../models/like.model.js"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {deleteS3Object} from "../utils/s3.js"
import redisClient from "../config/redis.js"
import { 
    indexVideo as indexVideoSync, 
    deleteVideo as deleteVideoSync, 
    updateVideoViews as updateVideoViewsSync 
} from "../services/typesenseSync.service.js"


const getInfiniteHomeFeed = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)
    const skip = (page - 1) * limit

    const videos = await Video.find({ isPublished: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("owner", "username avatar")

    const total = await Video.countDocuments({ isPublished: true })

    return res
        .status(200)
        .json(new ApiResponse(200, { videos, total, page, limit }, "videos fetched Successfully"))
})


const getAllVideos = asyncHandler(async (req, res) => {
    const videos= await Video.find(
        {
            owner:req.user._id
        }
    ).populate("owner", "username");
    return res
    .status(200)
    .json(new ApiResponse(200,videos,"videos fetched Successfully"))

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    let videoLocalPath;
    if (req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0) {
        videoLocalPath = req.files.videoFile[0].path;
    }
    let thumbnailLocalPath;
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files.thumbnail[0].path;
    }
    if (!videoLocalPath) {
        throw new ApiError(401, "video is required")
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail is required")
    }

    const video = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if(!video){
        throw new ApiError(400,"video is required")
    }
    if(!thumbnail){
        throw new ApiError(400,"thumbnail is required")
    }
    const videoDataset = await Video.create({
        videoFile:video.url,
        thumbnail:thumbnail.url,
        description,
        duration:video.duration,
        owner:req.user._id,
        title
    })
    const uploadedVideo = await Video.findById(videoDataset._id)
    if (!uploadedVideo) {
        throw new ApiError(500, "something went wrong while uploading video")
    }

    // Sync with Typesense (fire and forget)
    Video.findById(uploadedVideo._id).populate("owner", "username avatar")
        .then(popVideo => {
            if (popVideo) indexVideoSync(popVideo);
        })
        .catch(err => console.error("Typesense index error on publish:", err.message));

    return res.status(201).json(
        new ApiResponse(200, uploadedVideo, "video uploaded  successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId?.trim()){
        throw new ApiError(400,"videoId is missing")
    }

    let video = await Video.findById(videoId).populate("owner", "username avatar")

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const ownerId = video.owner?._id || video.owner
    const isOwner = req.user?._id && ownerId && ownerId.toString() === req.user._id.toString()

    if (!isOwner) {
        const viewerIdentifier = req.user?._id 
            ? `user:${req.user._id}` 
            : `ip:${req.ip}`;
        const viewKey = `view:${videoId}:${viewerIdentifier}`;
        const alreadyViewed = await redisClient.get(viewKey)
        if (!alreadyViewed) {
            // Increment video views
            video = await Video.findByIdAndUpdate(
                videoId,
                { $inc: { views: 1 } },
                { new: true }
            ).populate("owner", "username avatar")

            await redisClient.setex(viewKey, 86400, '1') // 24 hour TTL

            // Sync views to Typesense (fire and forget) if the video is ready and published
            if (video.isPublished && video.processingStatus === "ready") {
                updateVideoViewsSync(videoId, video.views).catch(err =>
                    console.error("Typesense view sync failed:", err.message)
                )
            }
        }
    }

    // Add to user watch history
    if (req.user?._id) {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $addToSet: {
                    watchHistory: videoId
                }
            }
        )
    }

    // Fire-and-forget record watch history in WatchHistory collection if authenticated
    if (req.user?._id) {
        WatchHistory.findOneAndUpdate(
            { user: req.user._id, video: videoId },
            { $set: { watchedAt: new Date() } },
            { upsert: true }
        ).catch(err => console.error("WatchHistory upsert error:", err.message));
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "video fetched successfully")
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    const thumbnailLocalPath = req.file?.path

    const videoObj = await Video.findById(videoId)
    if (!videoObj) {
        throw new ApiError(404, "Video not found")
    }
    if (videoObj.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video")
    }

    const updateFields = {}
    if (title) updateFields.title = title
    if (description) updateFields.description = description

    if (thumbnailLocalPath) {
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if (thumbnail) {
            updateFields.thumbnail = thumbnail.url
        } else {
            throw new ApiError(500, "Failed to upload new thumbnail")
        }
    }

    if (Object.keys(updateFields).length === 0) {
        throw new ApiError(400, "At least one field (title, description, or thumbnail) must be updated")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: updateFields
        },
        { new: true }
    )

    // Sync with Typesense (fire and forget)
    if (video) {
        Video.findById(video._id).populate("owner", "username avatar")
            .then(popVideo => {
                if (popVideo) indexVideoSync(popVideo);
            })
            .catch(err => console.error("Typesense index error on update:", err.message));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video details updated Successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video")
    }

    const delVideo = await Video.findByIdAndDelete(videoId)

    // Sync with Typesense (fire and forget)
    if (delVideo) {
        try {
            deleteVideoSync(videoId);
        } catch (syncError) {
            console.error("Typesense delete error:", syncError.message);
        }
    }

    // Clean up S3 (do not await)
    if (video.rawFileKey) deleteS3Object(process.env.AWS_S3_RAW_BUCKET, video.rawFileKey).catch(console.error)
    if (video.hlsManifestUrl) deleteS3Object(process.env.AWS_S3_PROCESSED_BUCKET, `videos/${videoId}`).catch(console.error)

    // Clean up orphaned documents (do not await)
    Like.deleteMany({ video: videoId }).catch(console.error)
    Comment.deleteMany({ video: videoId }).catch(console.error)
    WatchHistory.deleteMany({ video: videoId }).catch(console.error)

    return res
    .status(200)
    .json(new ApiResponse(200,delVideo,"Video deleted "))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video= await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found")
    if(video.isPublished===true){
        video.isPublished=false
    }
    else{
        video.isPublished=true
    }
    await video.save({ validateBeforeSave: false })

    // Sync status change with Typesense (fire and forget)
    Video.findById(videoId).populate("owner", "username avatar")
        .then(popVideo => {
            if (popVideo) {
                indexVideoSync(popVideo);
            }
        })
        .catch(err => console.error("Typesense index error on toggle publish:", err.message));

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "published is toggled Successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getInfiniteHomeFeed
}