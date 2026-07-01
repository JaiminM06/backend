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
import { logger } from "../utils/logger.js"


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
    const page   = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip   = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortType = req.query.sortType === 'asc' ? 1 : -1;
    const query  = req.query.query || '';

    const filter = { owner: req.user._id };

    // Optional search filter by title
    if (query.trim()) {
      filter.title = { $regex: query.trim(), $options: 'i' };
    }

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .sort({ [sortBy]: sortType })
        .skip(skip)
        .limit(limit)
        .populate('owner', 'username avatar fullName'),
      Video.countDocuments(filter)
    ]);

    return res.status(200).json(
      new ApiResponse(200, {
        videos,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total
      }, 'Videos fetched successfully')
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
    throw new ApiError(
      410,
      'Direct video upload is deprecated. Use POST /api/v1/upload/request-url to get a presigned S3 URL, then POST /api/v1/upload/confirm/:videoId to start processing.'
    );
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid or missing video ID")
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
                    logger.error({ err, videoId }, "Typesense view sync failed")
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
        ).catch(err => logger.error({ err, videoId }, "WatchHistory upsert error"));
    }

    const likeCount = await Like.countDocuments({ video: videoId });
    const isLiked = req.user?._id
        ? !!(await Like.exists({ video: videoId, likedBy: req.user._id }))
        : false;

    const videoData = video.toObject();
    videoData.likeCount = likeCount;
    videoData.isLiked = isLiked;

    return res
        .status(200)
        .json(
            new ApiResponse(200, videoData, "video fetched successfully")
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid or missing video ID")
    }
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
            .catch(err => logger.error({ err }, "Typesense index error on update"));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video details updated Successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid or missing video ID")
    }

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
            logger.error({ err: syncError, videoId }, "Typesense delete error");
        }
    }

    // Clean up S3 (do not await)
    if (video.rawFileKey) {
        deleteS3Object(process.env.AWS_S3_RAW_BUCKET, video.rawFileKey)
            .catch(err => logger.error({ err }, "Failed to delete S3 raw object"));
    }
    if (video.hlsManifestUrl) {
        deleteS3Object(process.env.AWS_S3_PROCESSED_BUCKET, `videos/${videoId}`)
            .catch(err => logger.error({ err }, "Failed to delete S3 processed objects"));
    }

    // Clean up orphaned documents (do not await)
    Like.deleteMany({ video: videoId }).catch(err => logger.error({ err }, "Failed to delete video likes"))
    Comment.deleteMany({ video: videoId }).catch(err => logger.error({ err }, "Failed to delete video comments"))
    WatchHistory.deleteMany({ video: videoId }).catch(err => logger.error({ err }, "Failed to delete video watch histories"))

    return res
    .status(200)
    .json(new ApiResponse(200,delVideo,"Video deleted "))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid or missing video ID")
    }
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
        .catch(err => logger.error({ err }, "Typesense index error on toggle publish"));

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