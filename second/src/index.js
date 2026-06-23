import "dotenv/config";
import http from "http";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { initSocket } from "./config/socket.js";

const server = http.createServer(app);
initSocket(server);

connectDB()
    .then(() => {
        server.listen(process.env.PORT || 8000, () => {
            console.log("Server is running on port:", process.env.PORT || 8000);
        });
    })
    .catch((err) => {
        console.log("MongoDB connection failed:", err);
    });