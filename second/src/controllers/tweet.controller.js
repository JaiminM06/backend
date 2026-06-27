import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { indexTweet as indexTweetSync, deleteTweet as deleteTweetSync } from "../services/typesenseSync.service.js"
import { logger } from "../utils/logger.js"
import crypto from "crypto"
import { getImageUploadUrl } from "../utils/s3ImageUpload.js"
import { getIO } from "../config/socket.js"
import { sendNotification } from "../services/notification.service.js"
import { getPersonalizedTweetFeed, getGlobalTweetFeed } from "../services/tweetFeed.service.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const user = req.user._id
    const { content, media } = req.body
    const tweet = await Tweet.create({
        content: content,
        owner: user,
        media: media || []
    })

    // Fire mention notifications for each mentioned user
    if (tweet.mentions && tweet.mentions.length > 0) {
        tweet.mentions.forEach(mentionedUserId => {
            if (mentionedUserId.toString() === req.user._id.toString()) return;

            sendNotification({
                recipientId: mentionedUserId,
                senderId: req.user._id,
                type: 'mention',
                referenceId: tweet._id,
                referenceModel: 'Tweet',
                message: `${req.user.username} mentioned you in a tweet`
            }).catch(err => logger.error({ err }, 'Mention notification failed'));
        });
    }

    // Sync with Typesense (fire and forget)
    Tweet.findById(tweet._id).populate("owner", "username avatar")
        .then(popTweet => {
            if (popTweet) indexTweetSync(popTweet);
        })
        .catch(err => logger.error({ err }, "Typesense tweet index error on create"));

    const savedTweet = await Tweet.findById(tweet._id).populate("owner", "username avatar fullName");

    // Emit new_tweet to all connected clients for real-time feed updates
    try {
        const io = getIO();
        io.emit('new_tweet', { tweet: savedTweet });
    } catch (err) {
        logger.warn({ err }, 'Socket emit failed for new_tweet');
    }

    return res
    .status(200)
    .json(new ApiResponse(200, savedTweet, "Tweet created successfully"))

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
            $set:{
                content:newContent
            }
        },{new:true}
    
    )

    // Sync with Typesense (fire and forget)
    if (updatedContent) {
        Tweet.findById(updatedContent._id).populate("owner", "username avatar")
            .then(popTweet => {
                if (popTweet) indexTweetSync(popTweet);
            })
            .catch(err => logger.error({ err }, "Typesense tweet index error on update"));
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updatedContent,"Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    // Sync with Typesense (fire and forget)
    if (deletedTweet) {
        try {
            deleteTweetSync(tweetId);
        } catch (syncError) {
            logger.error({ err: syncError, tweetId }, "Typesense tweet delete error");
        }
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Tweet deleted successfully"))

})

const requestMediaUploadUrl = asyncHandler(async (req, res) => {
    const { contentType, fileSize } = req.body;

    if (fileSize === undefined || fileSize === null) {
        throw new ApiError(400, "fileSize is required");
    }

    if (!contentType) {
        throw new ApiError(400, "contentType is required");
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
        throw new ApiError(415, "Unsupported media type. Allowed types: jpeg, png, gif, webp");
    }

    if (fileSize > 10485760) {
        throw new ApiError(413, "File size too large. Maximum size is 10MB");
    }

    const extMap = {
        'image/jpeg': 'jpeg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp'
    };
    const ext = extMap[contentType];

    const key = `tweets/media/${req.user._id}/${Date.now()}_${crypto.randomUUID()}.${ext}`;

    const data = await getImageUploadUrl(key, contentType);

    return res
        .status(200)
        .json(new ApiResponse(200, data, "Presigned upload URL generated successfully"));
});

const createRetweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const sourceTweet = await Tweet.findById(tweetId);
    if (!sourceTweet) {
        throw new ApiError(404, "Source tweet not found");
    }

    const existing = await Tweet.findOne({
        owner: req.user._id,
        isRetweet: true,
        originalTweet: tweetId
    });

    if (existing) {
        // Delete the retweet document
        await Tweet.findByIdAndDelete(existing._id);

        // Sync with Typesense (fire and forget)
        try {
            deleteTweetSync(existing._id.toString());
        } catch (syncError) {
            logger.error({ err: syncError, tweetId: existing._id }, "Typesense tweet delete error on un-retweet");
        }

        // Decrement retweetCount
        await Tweet.findByIdAndUpdate(tweetId, { $inc: { retweetCount: -1 } });

        return res
            .status(200)
            .json(new ApiResponse(200, { retweeted: false }, "Retweet removed"));
    } else {
        // Create new retweet
        const newTweet = await Tweet.create({
            owner: req.user._id,
            content: sourceTweet.content,
            isRetweet: true,
            originalTweet: tweetId,
            media: sourceTweet.media || [],
            hashtags: sourceTweet.hashtags || []
        });

        // Increment retweetCount
        await Tweet.findByIdAndUpdate(tweetId, { $inc: { retweetCount: 1 } });

        // Sync with Typesense (fire and forget)
        Tweet.findById(newTweet._id).populate("owner", "username avatar")
            .then(popTweet => {
                if (popTweet) indexTweetSync(popTweet);
            })
            .catch(err => logger.error({ err }, "Typesense tweet index error on retweet"));

        return res
            .status(201)
            .json(new ApiResponse(201, { retweeted: true, retweet: newTweet }, "Retweeted successfully"));
    }
});

const createQuoteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    if (!content || typeof content !== "string" || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

    if (content.length > 280) {
        throw new ApiError(400, "Content cannot exceed 280 characters");
    }

    const sourceTweet = await Tweet.findById(tweetId);
    if (!sourceTweet) {
        throw new ApiError(404, "Source tweet not found");
    }

    const quoteTweetDoc = await Tweet.create({
        owner: req.user._id,
        content,
        quoteTweet: tweetId,
        hashtags: []
    });

    // Fire mention notifications for each mentioned user
    if (quoteTweetDoc.mentions && quoteTweetDoc.mentions.length > 0) {
        quoteTweetDoc.mentions.forEach(mentionedUserId => {
            if (mentionedUserId.toString() === req.user._id.toString()) return;

            sendNotification({
                recipientId: mentionedUserId,
                senderId: req.user._id,
                type: 'mention',
                referenceId: quoteTweetDoc._id,
                referenceModel: 'Tweet',
                message: `${req.user.username} mentioned you in a tweet`
            }).catch(err => logger.error({ err }, 'Mention notification failed'));
        });
    }

    const newTweet = await Tweet.findById(quoteTweetDoc._id).populate("owner", "username avatar");

    // Sync with Typesense (fire and forget)
    if (newTweet) {
        indexTweetSync(newTweet).catch(err => logger.error({ err }, "Typesense tweet index error on quote"));
    }

    try {
        const io = getIO();
        io.to(`tweet-${tweetId}`).emit("new_quote_tweet", { quoteTweet: newTweet });
    } catch (socketError) {
        logger.error({ err: socketError, tweetId }, "Failed to emit new_quote_tweet event");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, { quoteTweet: newTweet }, "Quote tweet created successfully"));
});

const createReply = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    if (!content || typeof content !== "string" || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

    if (content.length > 280) {
        throw new ApiError(400, "Content cannot exceed 280 characters");
    }

    const parentTweet = await Tweet.findById(tweetId);
    if (!parentTweet) {
        throw new ApiError(404, "Parent tweet not found");
    }

    const replyTweet = await Tweet.create({
        owner: req.user._id,
        content,
        parentTweet: tweetId
    });

    // Fire mention notifications for each mentioned user
    if (replyTweet.mentions && replyTweet.mentions.length > 0) {
        replyTweet.mentions.forEach(mentionedUserId => {
            if (mentionedUserId.toString() === req.user._id.toString()) return;

            sendNotification({
                recipientId: mentionedUserId,
                senderId: req.user._id,
                type: 'mention',
                referenceId: replyTweet._id,
                referenceModel: 'Tweet',
                message: `${req.user.username} mentioned you in a tweet`
            }).catch(err => logger.error({ err }, 'Mention notification failed'));
        });
    }

    await Tweet.findByIdAndUpdate(tweetId, { $inc: { replyCount: 1 } });

    const newTweet = await Tweet.findById(replyTweet._id).populate("owner", "username avatar");

    // Sync with Typesense (fire and forget)
    if (newTweet) {
        indexTweetSync(newTweet).catch(err => logger.error({ err }, "Typesense tweet index error on reply"));
    }

    try {
        const io = getIO();
        io.to(`tweet-${tweetId}`).emit("new_reply", { reply: newTweet });
    } catch (socketError) {
        logger.error({ err: socketError, tweetId }, "Failed to emit new_reply event");
    }

    if (String(req.user._id) !== String(parentTweet.owner)) {
        sendNotification({
            recipientId: parentTweet.owner,
            senderId: req.user._id,
            type: 'new_comment',
            referenceId: tweetId,
            referenceModel: 'Tweet',
            message: `${req.user.username} replied to your tweet`
        }).catch(err => logger.error({ err }, "Failed to send notification for reply"));
    }

    return res
        .status(201)
        .json(new ApiResponse(201, { reply: newTweet }, "Reply posted successfully"));
});

const getThread = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const rootTweet = await Tweet.findById(tweetId).populate("owner", "username avatar");
    if (!rootTweet) {
        throw new ApiError(404, "Root tweet not found");
    }

    const replies = await Tweet.find({ parentTweet: tweetId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate("owner", "username avatar");

    return res
        .status(200)
        .json(new ApiResponse(200, {
            rootTweet,
            replies,
            totalReplies: rootTweet.replyCount || 0,
            page,
            limit
        }, "Thread fetched successfully"));
});

const getTweetFeed = asyncHandler(async (req, res) => {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;

    if (limit > 50) limit = 50;
    if (limit < 1) limit = 20;
    if (page < 1) page = 1;

    let result;
    if (req.user) {
        result = await getPersonalizedTweetFeed(req.user._id, page, limit);
    } else {
        result = await getGlobalTweetFeed(page, limit);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Tweet feed fetched successfully"));
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
    requestMediaUploadUrl,
    createRetweet,
    createQuoteTweet,
    createReply,
    getThread,
    getTweetFeed
}