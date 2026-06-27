import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
    {
        content: {
            type: String,
            required: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        media: {
            type: [String],
            default: [],
            validate: {
                validator: (arr) => arr.length <= 4,
                message: 'Maximum 4 media items per tweet'
            }
        },
        parentTweet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tweet',
            default: null
        },
        quoteTweet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tweet',
            default: null
        },
        isRetweet: {
            type: Boolean,
            default: false
        },
        originalTweet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tweet',
            default: null
        },
        hashtags: {
            type: [String],
            default: [],
            index: true
        },
        mentions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: []
        }],
        views: {
            type: Number,
            default: 0
        },
        retweetCount: {
            type: Number,
            default: 0,
            min: [0, 'retweetCount cannot be negative']
        },
        replyCount: {
            type: Number,
            default: 0,
            min: [0, 'replyCount cannot be negative']
        }
    },
    { timestamps: true }
);

tweetSchema.index({ owner: 1, createdAt: -1 });
tweetSchema.index({ parentTweet: 1 });
tweetSchema.index({ originalTweet: 1 });
tweetSchema.index({ hashtags: 1 });

tweetSchema.index(
    { owner: 1, originalTweet: 1 },
    {
        unique: true,
        partialFilterExpression: { isRetweet: true }
    }
);

tweetSchema.pre('save', function(next) {
    if (this.isRetweet) return next();
    if (this.isModified('content')) {
        this.hashtags = [...new Set(
            (this.content.match(/#[\w]+/g) || []).map(h => h.slice(1).toLowerCase())
        )];
    }
    next();
});

tweetSchema.pre('save', async function(next) {
    if (this.isRetweet) return next();
    if (!this.isModified('content')) return next();

    const mentionedUsernames = [
        ...new Set(
            (this.content.match(/@[\w]+/g) || []).map(m => m.slice(1).toLowerCase())
        )
    ];

    if (mentionedUsernames.length === 0) {
        this.mentions = [];
        return next();
    }

    const User = mongoose.model('User');
    const users = await User.find(
        { username: { $in: mentionedUsernames } },
        '_id username'
    );
    this.mentions = users.map(u => u._id);
    next();
});

export const Tweet = mongoose.model("Tweet", tweetSchema);
