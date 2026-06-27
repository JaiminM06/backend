import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
    requestMediaUploadUrl,
    createRetweet,
    createQuoteTweet,
    createReply,
    getThread,
    getTweetFeed,
} from "../controllers/tweet.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import optionalAuth from "../middlewares/optionalAuth.middleware.js"
import {validate} from "../middlewares/validate.middleware.js"
import {createTweetSchema, updateTweetSchema, createReplySchema} from "../validators/tweet.validators.js"

const router = Router();

// Public / Optional Auth routes
router.route("/feed").get(optionalAuth, getTweetFeed);
router.route("/:tweetId/thread").get(getThread);

// Protected routes
router.use(verifyJWT); // Apply verifyJWT middleware to all routes below this line

router.route("/").post(validate(createTweetSchema), createTweet);
router.route("/media/upload-url").post(requestMediaUploadUrl);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId")
    .patch(validate(updateTweetSchema), updateTweet)
    .delete(deleteTweet);

router.route("/:tweetId/retweet").post(createRetweet);
router.route("/:tweetId/quote").post(createQuoteTweet);
router.route("/:tweetId/reply").post(validate(createReplySchema), createReply);

export default router;