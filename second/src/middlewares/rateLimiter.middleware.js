import rateLimit from 'express-rate-limit';

// General API limiter — all routes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 100,                    // 100 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' }
});

// Strict limiter — auth routes (login, register, refresh)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,                     // only 10 login attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later' }
});

// Upload limiter — presigned URL requests
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: 20,                     // max 20 upload initiations per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Upload limit reached, please try again later' }
});
