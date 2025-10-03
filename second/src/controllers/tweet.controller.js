import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const user= req.user._id
    const content=req.body.content
    const tweet=await Tweet.create({
        content:content,
        owner:user,
    })
    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"Tweet created successfully"))

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const user= req.params
    const allTweets= await Tweet.find(
        {
            owner:user
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200,allTweets,"Tweets fetched Successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params

    const newContent=req.body.content
    const updatedContent= await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content:newContent
        }
    
    )
    return res
    .status(200)
    .json(new ApiResponse(200,updatedContent,"Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    await Tweet.findByIdAndDelete(tweetId)
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Tweet deleted successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}