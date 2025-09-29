import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    console.log(req.files)
    const videoLocalPath=req.files?.videoFile[0]?.path
    const thumbnailLocalPath=req.files?.thumbnail[0]?.path
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
    console.log(videoDataset)
    const uploadedVideo = await Video.findById(videoDataset._id)
    console.log(uploadedVideo)
    if (!uploadedVideo) {
        throw new ApiError(500, "something went wrong while uploading video")
    }

    return res.status(201).json(
        new ApiResponse(200, uploadedVideo, "video uploaded  successfully")
    )
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId?.trim()){
        throw new ApiError(400,"videoId is missing")
    }
    const video= await Video.findById(videoId)
return res
    .status(200)
    .json(
        new ApiResponse(200,video,"video fetched successfully")
    )
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title,description}=req.body
    const thumbnailLocalPath=req.file?.path
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail is required")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!thumbnail){
        throw new ApiError(400,"thumbnail is required")
    }
    if (!title || !description) {
        throw new ApiError(400, "All fields are required")
    }
    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title:title,
                description:description,
                thumbnail:thumbnail.url
                
            }
        },
        { new: true }
    )
    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video details updated Successfully"))

    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const delVideo=await Video.findByIdAndDelete(videoId)
    return res
    .status(200)
    .json(new ApiResponse(200,delVideo,"Video deleted "))
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video= await Video.findById(videoId)
    if(video.isPublished===true){
        video.isPublished=false
    }
    else{
        video.isPublished=true
    }
    await video.save({ validateBeforeSave: false })

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
    togglePublishStatus
}