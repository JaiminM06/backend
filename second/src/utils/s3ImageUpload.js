import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, getPresignedUploadUrl, deleteS3Object, getCloudFrontUrl } from "./s3.js";
import { logger } from "./logger.js";

export const getImageUploadUrl = async (key, contentType, expiresInSeconds = 300) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
        throw new Error('Invalid content type');
    }

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_PROCESSED_BUCKET,
        Key: key,
        ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: expiresInSeconds,
    });

    const publicUrl = getCloudFrontUrl(key);

    return { uploadUrl, key, publicUrl };
};

export const deleteImage = async (key) => {
    try {
        await deleteS3Object(process.env.AWS_S3_PROCESSED_BUCKET, key);
    } catch (error) {
        logger.error({ err: error, key }, "Failed to delete image from S3");
    }
};
