import { Router } from "express";
import { 
    changeCurrentPassword, 
    getCurrentUser, 
    getUserById, 
    getUserChannelProfile, 
    getWatchHistory, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage 
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema, updateAccountSchema, changePasswordSchema } from "../validators/user.validators.js";
import { authLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.route("/register").post(
    authLimiter,
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    validate(registerSchema),
    registerUser
);

router.route("/login").post(authLimiter, validate(loginSchema), loginUser);

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(authLimiter, refreshAccessToken);
router.route("/change-password").post(verifyJWT, validate(changePasswordSchema), changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, validate(updateAccountSchema), updateAccountDetails);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/cover-Image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);
router.route("/:userid").get(getUserById);

export default router;