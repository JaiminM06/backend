import rateLimit from 'express-rate-limit';

// General API limiter — all routes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 10000,   // 100 requests per 15 min per IP in prod, 10000 in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' }
});


// Strict limiter — auth routes (login, register, refresh)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10 : 2000,                    // only 200 login attempts per 15 min per IP (10 for tests)
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
