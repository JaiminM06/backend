import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { sendNotification } from "../services/notification.service.js"
import { logger } from "../utils/logger.js"

const subscriptionStatus = asyncHandler(async (req, res) => {
    const {channelId} = req.params      

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Channel ID")
    }
    const isSubscribed = await Subscription.findOne(
        {
            subscriber:req.user._id,        
            channel:channelId
        }
    )
    return res
    .status(200)
    .json(new ApiResponse(200,{isSubscribed: !!isSubscribed},"Subscription status fetched successfully"))
})

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    const isSubscribed = await Subscription.findOne(
        {
            subscriber:req.user._id,
            channel:channelId
        }
    )
    if(isSubscribed){
        await Subscription.findByIdAndDelete(isSubscribed._id)
        return res
        .status(200)
        .json(new ApiResponse(200,{},"Channel UnSubscribed Successfully"))
    }
    const subscribed= await Subscription.create({
        subscriber:req.user._id,
        channel:channelId
    })

    // Send real-time notification
    try {
        await sendNotification({
            recipientId: channelId,
            senderId: req.user._id,
            type: 'new_subscriber',
            referenceId: req.user._id,
            referenceModel: null,
            message: `${req.user.username} subscribed to your channel`
        });
    } catch (notificationError) {
        logger.error({ err: notificationError, channelId }, "Failed to send subscription notification");
    }

    return res
    .status(200)
    .json(new ApiResponse(200,subscribed,"Channel Subscribed Successfully"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const page  = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip  = (page - 1) * limit;

    const [subscribers, total] = await Promise.all([
      Subscription.find({ channel: channelId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('subscriber', 'username avatar fullName'),
      Subscription.countDocuments({ channel: channelId })
    ]);

    return res.status(200).json(
      new ApiResponse(200, {
        subscribers: subscribers.map(s => s.subscriber),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }, 'Subscribers fetched successfully')
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    const page  = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip  = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      Subscription.find({ subscriber: subscriberId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('channel', 'username avatar fullName'),
      Subscription.countDocuments({ subscriber: subscriberId })
    ]);

    return res.status(200).json(
      new ApiResponse(200, {
        channels: subscriptions.map(s => s.channel),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }, 'Subscribed channels fetched successfully')
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    subscriptionStatus
}