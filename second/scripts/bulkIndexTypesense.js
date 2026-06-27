import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../src/db/index.js";
import { initTypesenseCollections } from "../src/config/typesenseCollections.js";
import client from "../src/config/typesense.js";
import { User } from "../src/models/user.model.js"; // Needs to be loaded for populate
import { Video } from "../src/models/video.model.js";
import { Tweet } from "../src/models/tweet.model.js";

const run = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await connectDB();

        console.log("Initializing Typesense collections...");
        await initTypesenseCollections();

        console.log("Publishing completed/ready videos in MongoDB...");
        const migrationResult = await Video.updateMany(
            { processingStatus: "ready", isPublished: false },
            { $set: { isPublished: true } }
        );
        console.log(`Updated ${migrationResult.modifiedCount} ready videos to isPublished: true.`);

        console.log("Indexing videos...");
        let videoCount = 0;
        let videoPage = 0;
        const limit = 100;

        while (true) {
            const videos = await Video.find({ isPublished: true })
                .populate("owner", "username avatar")
                .skip(videoPage * limit)
                .limit(limit);

            if (videos.length === 0) break;

            const docs = videos.map(video => ({
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
            }));

            await client.collections("videos").documents().import(docs, { action: "upsert" });
            videoCount += videos.length;
            videoPage++;
            console.log(`Indexed ${videoCount} videos...`);
        }

        console.log("Indexing tweets...");
        let tweetCount = 0;
        let tweetPage = 0;

        while (true) {
            const tweets = await Tweet.find()
                .populate("owner", "username avatar")
                .skip(tweetPage * limit)
                .limit(limit);

            if (tweets.length === 0) break;

            const docs = tweets.map(tweet => ({
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
            }));

            await client.collections("tweets").documents().import(docs, { action: "upsert" });
            tweetCount += tweets.length;
            tweetPage++;
            console.log(`Indexed ${tweetCount} tweets...`);
        }

        console.log(`Success: Indexed ${videoCount} videos, ${tweetCount} tweets`);
    } catch (error) {
        console.error("Bulk indexing failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("MongoDB disconnected.");
        process.exit(0);
    }
};

run();
