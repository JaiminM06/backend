import { Subscription } from "../models/subscription.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Like } from "../models/like.model.js";

export const getGlobalTweetFeed = async (page, limit) => {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skipNum = (pageNum - 1) * limitNum;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const tweets = await Tweet.aggregate([
        {
            $match: {
                isRetweet: false,
                createdAt: { $gte: sevenDaysAgo }
            }
        },
        {
            $addFields: {
                engagementScore: {
                    $add: [
                        { $multiply: [{ $ifNull: ['$views', 0] }, 0.1] },
                        { $multiply: [{ $ifNull: ['$retweetCount', 0] }, 3] },
                        { $multiply: [{ $ifNull: ['$replyCount', 0] }, 2] }
                    ]
                }
            }
        },
        {
            $sort: { engagementScore: -1, createdAt: -1 }
        },
        {
            $skip: skipNum
        },
        {
            $limit: limitNum
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $lookup: {
                from: "tweets",
                localField: "quoteTweet",
                foreignField: "_id",
                as: "quoteTweet"
            }
        },
        {
            $lookup: {
                from: "tweets",
                localField: "originalTweet",
                foreignField: "_id",
                as: "originalTweet"
            }
        },
        {
            $addFields: {
                quoteTweet: { $cond: [{ $gt: [{ $size: "$quoteTweet" }, 0] }, { $arrayElemAt: ["$quoteTweet", 0] }, null] },
                originalTweet: { $cond: [{ $gt: [{ $size: "$originalTweet" }, 0] }, { $arrayElemAt: ["$originalTweet", 0] }, null] }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "originalTweet.owner",
                foreignField: "_id",
                as: "originalTweetOwner"
            }
        },
        {
            $addFields: {
                "originalTweet.owner": {
                    $cond: [
                        { $and: [{ $ne: ["$originalTweet", null] }, { $gt: [{ $size: "$originalTweetOwner" }, 0] }] },
                        { $arrayElemAt: ["$originalTweetOwner", 0] },
                        null
                    ]
                }
            }
        },
        {
            $project: {
                originalTweetOwner: 0,
                "owner.password": 0,
                "owner.refreshToken": 0,
                "owner.email": 0,
                "owner.watchHistory": 0,
                "originalTweet.owner.password": 0,
                "originalTweet.owner.refreshToken": 0,
                "originalTweet.owner.email": 0,
                "originalTweet.owner.watchHistory": 0
            }
        }
    ]);

    return {
        tweets,
        page: pageNum,
        limit: limitNum,
        isPersonalized: false
    };
};

export const getPersonalizedTweetFeed = async (userId, page, limit) => {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    const following = await Subscription.find({ subscriber: userId }).select('channel');
    const followingIds = following.map(s => s.channel);

    if (followingIds.length === 0) {
        return getGlobalTweetFeed(pageNum, limitNum);
    }

    const candidates = await Tweet.find({
        owner: { $in: [...followingIds, userId] },
        isRetweet: false,
        createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) }
    })
    .populate('owner', 'username avatar fullName')
    .populate('quoteTweet')
    .populate({ path: 'originalTweet', populate: { path: 'owner', select: 'username avatar' } })
    .lean();

    if (candidates.length === 0) {
        return {
            tweets: [],
            totalCount: 0,
            page: pageNum,
            limit: limitNum,
            isPersonalized: true
        };
    }

    const candidateIds = candidates.map(t => t._id);
    const likeCounts = await Like.aggregate([
        { $match: { tweet: { $in: candidateIds }, likedBy: { $exists: true } } },
        { $group: { _id: '$tweet', count: { $sum: 1 } } }
    ]);
    const likeMap = Object.fromEntries(likeCounts.map(l => [l._id.toString(), l.count]));

    for (const tweet of candidates) {
        const likeCount = likeMap[tweet._id.toString()] || 0;
        const ageHours = (Date.now() - new Date(tweet.createdAt)) / (1000 * 60 * 60);
        const recencyScore = Math.max(0, 48 - ageHours) / 48;
        tweet.engagementScore =
            (tweet.views || 0) * 0.1 +
            likeCount * 5 +
            (tweet.retweetCount || 0) * 3 +
            (tweet.replyCount || 0) * 2 +
            recencyScore * 20;
    }

    candidates.sort((a, b) => b.engagementScore - a.engagementScore);
    const paginatedTweets = candidates.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return {
        tweets: paginatedTweets,
        totalCount: candidates.length,
        page: pageNum,
        limit: limitNum,
        isPersonalized: true
    };
};
