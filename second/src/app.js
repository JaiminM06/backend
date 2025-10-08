import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

app.use(express.static("public"))
app.use(cookieParser())

//routes

import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import tweetRouter from './routes/tweet.routes.js'
// import subscriptionRouter from './routes/subscriptions.routes.js'

//routes
// app.use("/api/v1/users",userRouter)   
// app.use("/api/v1/videos", videoRouter)
// app.use("/api/v1/tweets", tweetRouter)
// app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
// app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
// app.use("/api/v1/comments", commentRouter)
// app.use("/api/v1/likes", likeRouter)
// app.use("/api/v1/playlist", playlistRouter)
// app.use("/api/v1/dashboard", dashboardRouter)

//http://localhost:8000/api/users/register     

import { ApiError } from "./utils/ApiError.js";

app.use((err, req, res, next) => {
    console.error("Error Handler:", err);

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors || [],
            data: err.data || null,
        });
    }

    // If it's some other unexpected error
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
});

export { app }