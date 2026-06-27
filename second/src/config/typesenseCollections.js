import client from "./typesense.js";
import { logger } from "../utils/logger.js";

const videoCollectionSchema = {
  name: "videos",
  fields: [
    { name: "mongoId",       type: "string" },
    { name: "title",         type: "string" },
    { name: "description",   type: "string" },
    { name: "tags",          type: "string[]", optional: true },
    { name: "ownerUsername", type: "string" },
    { name: "ownerAvatar",   type: "string", optional: true },
    { name: "thumbnail",     type: "string", optional: true },
    { name: "duration",      type: "float" },
    { name: "views",         type: "int32", default: 0 },
    { name: "isPublished",   type: "bool" },
    { name: "createdAt",     type: "int64" }
  ],
  default_sorting_field: "views"
};

const tweetCollectionSchema = {
  name: "tweets",
  fields: [
    { name: "mongoId",       type: "string" },
    { name: "content",       type: "string" },
    { name: "hashtags",      type: "string[]", optional: true },
    { name: "ownerUsername", type: "string" },
    { name: "ownerAvatar",   type: "string", optional: true },
    { name: "views",         type: "int32", default: 0 },
    { name: "retweetCount",  type: "int32", default: 0 },
    { name: "replyCount",    type: "int32", default: 0 },
    { name: "isRetweet",     type: "bool",  default: false },
    { name: "createdAt",     type: "int64" }
  ],
  default_sorting_field: "createdAt"
};

export const initTypesenseCollections = async () => {
    // 1. Videos collection initialization
    try {
        await client.collections("videos").retrieve();
    } catch (error) {
        logger.info("Creating Typesense collection: videos...");
        await client.collections().create(videoCollectionSchema);
    }

    // 2. Tweets collection initialization with change detection
    try {
        const existing = await client.collections('tweets').retrieve();
        const existingFields = existing.fields.map(f => f.name).sort();
        const requiredFields = tweetCollectionSchema.fields.map(f => f.name).sort();
        const schemaChanged = JSON.stringify(existingFields) !== JSON.stringify(requiredFields);

        if (schemaChanged) {
            logger.info('Tweet collection schema changed — dropping and recreating');
            await client.collections('tweets').delete();
            await client.collections().create(tweetCollectionSchema);
            logger.info('Tweet collection recreated. Run bulkIndexTypesense.js to re-index.');
        }
    } catch (err) {
        // Collection doesn't exist — create it
        await client.collections().create(tweetCollectionSchema);
    }

    logger.info("Typesense collections ready");
};
export { videoCollectionSchema, tweetCollectionSchema };
