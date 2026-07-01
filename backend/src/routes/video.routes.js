import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
    getInfiniteHomeFeed
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
import {validate} from "../middlewares/validate.middleware.js"
import {publishVideoSchema, updateVideoSchema} from "../validators/video.validators.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

/**
 * @openapi
 * /videos/feed:
 *   get:
 *     summary: Get infinite scroll home feed
 *     description: Retrieves a randomized feed of published videos for home page infinite scroll.
 *     tags:
 *       - Videos
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Feed retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.route("/feed").get(getInfiniteHomeFeed);

/**
 * @openapi
 * /videos:
 *   get:
 *     summary: Get all videos with pagination
 *     description: Retrieves videos using pagination, sorting, search query, and user filtering.
 *     tags:
 *       - Videos
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: query
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: sortBy
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           default: createdAt
 *       - name: sortType
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           default: desc
 *       - name: userId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Videos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *   post:
 *     summary: Publish a video
 *     description: DEPRECATED. Use /api/v1/upload/request-url instead.
 *     deprecated: true
 *     tags:
 *       - Videos
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - videoFile
 *               - thumbnail
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               videoFile:
 *                 type: string
 *                 format: binary
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Video published successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Video file and thumbnail are required or validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router
    .route("/")
    .get(getAllVideos)
    // Video upload is handled via S3 presigned URLs:
    // Step 1: POST /api/v1/upload/request-url
    // Step 2: PUT directly to S3 (browser → S3, not through this server)
    // Step 3: POST /api/v1/upload/confirm/:videoId
    .post(publishAVideo);

/**
 * @openapi
 * /videos/{videoId}:
 *   get:
 *     summary: Get video by ID
 *     description: Retrieves the detailed metadata of a video by its unique videoId.
 *     tags:
 *       - Videos
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: videoId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   delete:
 *     summary: Delete a video
 *     description: Deletes a video file and thumbnail from database and storage.
 *     tags:
 *       - Videos
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: videoId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   patch:
 *     summary: Update video details
 *     description: Updates the title, description, and optional thumbnail image of a video.
 *     tags:
 *       - Videos
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: videoId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Video updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), validate(updateVideoSchema), updateVideo);

/**
 * @openapi
 * /videos/toggle/publish/{videoId}:
 *   patch:
 *     summary: Toggle video publish status
 *     description: Switches the publish status of a video between public and private.
 *     tags:
 *       - Videos
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: videoId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video publish status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;