import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getMyNotifications,
    markAsRead,
    markAllAsRead
} from "../controllers/notification.controller.js";

const router = Router();

// Secure all notification endpoints
router.use(verifyJWT);

router.route("/").get(getMyNotifications);
router.route("/read").patch(markAsRead);
router.route("/read-all").patch(markAllAsRead);

export default router;
