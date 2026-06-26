import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import helmet from 'helmet';
import hpp from 'hpp';
import { httpLogger } from './utils/httpLogger.js';
import { logger } from "./utils/logger.js";
import { generalLimiter } from './middlewares/rateLimiter.middleware.js';

const app = express();

app.use(helmet());      // security headers
app.use(hpp());         // HTTP parameter pollution protection
app.use(httpLogger);    // HTTP request logging via pino-http
app.use('/api/v1', generalLimiter); // Apply general rate limit to all /api/v1 routes

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

app.use(express.static("public"))
app.use(cookieParser())

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Route imports
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import commentRouter from './routes/comments.routes.js'
import subscriptionRouter from './routes/subscriptions.routes.js'
import likeRouter from './routes/likes.routes.js'
import playlistRouter from './routes/playlist.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import uploadRouter from './routes/upload.routes.js'
import notificationRouter from './routes/notification.routes.js'
import searchRouter from './routes/search.routes.js'
import recommendationRouter from './routes/recommendation.routes.js'
import trendingRouter from './routes/trending.routes.js'
import analyticsRouter from './routes/analytics.routes.js'

// Route declarations
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/upload", uploadRouter)
app.use("/api/v1/notifications", notificationRouter)
app.use("/api/v1/search", searchRouter)
app.use("/api/v1", recommendationRouter)
app.use("/api/v1", trendingRouter)
app.use("/api/v1/analytics", analyticsRouter)

// Global error handler
import { ApiError } from "./utils/ApiError.js";

app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors || [],
            data: err.data || null,
        });
    }

    // Unexpected errors
    logger.error({ err }, "Unhandled Error");
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
});

export { app }