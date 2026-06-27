import client from "../config/typesense.js";
import { logger } from "../utils/logger.js";

export const indexVideo = async (video) => {
    try {
        const document = {
            id: video._id.toString(),
            mongoId: video._id.toString(),
            title: video.title,
            description: video.description || "",
            tags: video.tags || [],
            ownerUsername: video.owner?.username || "",
            ownerAvatar: video.owner?.avatar || "",
            thumbnail: video.thumbnail || "",
            duration: Number(video.duration) || 0,
            views: Number(video.views) || 0,
            isPublished: Boolean(video.isPublished),
            createdAt: Math.floor(new Date(video.createdAt).getTime() / 1000)
        };

        await client.collections("videos").documents().upsert(document);
    } catch (error) {
        logger.error({ err: error, videoId: video._id }, "Failed to index video in Typesense");
    }
};

export const indexTweet = async (tweet) => {
    try {
        const document = {
            id:           tweet._id.toString(),
            mongoId:      tweet._id.toString(),
            content:      tweet.content,
            hashtags:     tweet.hashtags   || [],
            ownerUsername: tweet.owner?.username || '',
            ownerAvatar:   tweet.owner?.avatar   || '',
            views:        tweet.views        || 0,
            retweetCount: tweet.retweetCount || 0,
            replyCount:   tweet.replyCount   || 0,
            isRetweet:    tweet.isRetweet    || false,
            createdAt:    Math.floor(new Date(tweet.createdAt).getTime() / 1000)
        };

        await client.collections("tweets").documents().upsert(document);
    } catch (error) {
        logger.error({ err: error, tweetId: tweet._id }, "Failed to index tweet in Typesense");
    }
};

export const deleteVideo = async (videoId) => {
    try {
        await client.collections("videos").documents(videoId.toString()).delete();
    } catch (error) {
        logger.error({ err: error, videoId }, "Failed to delete video from Typesense");
    }
};

export const deleteTweet = async (tweetId) => {
    try {
        await client.collections("tweets").documents(tweetId.toString()).delete();
    } catch (error) {
        logger.error({ err: error, tweetId }, "Failed to delete tweet from Typesense");
    }
};

export const updateVideoViews = async (videoId, views) => {
    try {
        await client.collections("videos").documents(videoId.toString()).update({ views: Number(views) || 0 });
    } catch (error) {
        logger.error({ err: error, videoId, views }, "Failed to update views for video in Typesense");
    }
};
