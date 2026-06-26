import { Router } from "express";
import { 
    requestUploadUrl, 
    confirmUploadAndProcess, 
    getVideoStatus, 
    getVideoStream 
} from "../controllers/upload.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import uploadGuard from "../middlewares/uploadGuard.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { requestUploadUrlSchema } from "../validators/video.validators.js";
import { uploadLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

// Secured routes
router.route("/request-url").post(
    uploadLimiter,
    verifyJWT,
    validate(requestUploadUrlSchema),
    uploadGuard,
    requestUploadUrl
);
router.route("/confirm/:videoId").post(verifyJWT, confirmUploadAndProcess);
router.route("/status/:videoId").get(verifyJWT, getVideoStatus);

// Public stream route
router.route("/stream/:videoId").get(getVideoStream);

export default router;
