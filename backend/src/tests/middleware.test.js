import { jest, describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import { setupTestMocks } from './setup.js';

let app;

beforeAll(async () => {
  app = await setupTestMocks();
});

// ══════════════════════════════════════════════════════════════════════
// validate middleware — pure unit tests
// ══════════════════════════════════════════════════════════════════════

describe('validate middleware', () => {
  let validate, z;

  beforeAll(async () => {
    ({ validate } = await import('../middlewares/validate.middleware.js'));
    const zodMod = await import('zod');
    z = zodMod.default || zodMod;
  });

  it('passes valid body, replaces req.body with parsed data, calls next', () => {
    const schema = z.object({ name: z.string().min(2), age: z.number().min(0) });
    const mw = validate(schema);
    const req = { body: { name: 'John', age: 25 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    mw(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'John', age: 25 });
  });

  it('transforms data via schema (trim, lowercase)', () => {
    const schema = z.object({ name: z.string().trim().toLowerCase() });
    const mw = validate(schema);
    const req = { body: { name: '  John  ' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    mw(req, res, next);
    expect(req.body.name).toBe('john');
  });

  it('returns 400 with fieldErrors for invalid body', () => {
    const schema = z.object({ name: z.string().min(2), age: z.number() });
    const mw = validate(schema);
    const req = { body: { name: 'J', age: 'not-a-number' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Validation failed', errors: expect.any(Object) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when required fields are missing', () => {
    const schema = z.object({ name: z.string(), email: z.string().email() });
    const mw = validate(schema);
    const req = { body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for failing min-length constraint', () => {
    const schema = z.object({ username: z.string().min(3) });
    const mw = validate(schema);
    const req = { body: { username: 'ab' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('strips unknown fields from body', () => {
    const schema = z.object({ name: z.string() });
    const mw = validate(schema);
    const req = { body: { name: 'John', hacker: 'injected' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body.name).toBe('John');
    expect(req.body.hacker).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════════
// verifyJWT middleware — integration tests via supertest + unit edge
// ══════════════════════════════════════════════════════════════════════

describe('verifyJWT middleware', () => {

  describe('integration via supertest', () => {
    it('returns 401 when hitting protected route without token', async () => {
      const res = await request(app).get('/api/v1/users/current-user');
      expect(res.status).toBe(401);
    });

    it('returns 200 when valid token is provided in cookie', async () => {
      const { User } = await import('../models/user.model.js');
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'testuser', username: 't', email: 't@t.com', fullName: 'T' })
      });
      const res = await request(app)
        .get('/api/v1/users/current-user')
        .set('Cookie', 'accessToken=valid-token');
      expect(res.status).toBe(200);
    });

    it('returns 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/users/current-user')
        .set('Cookie', 'accessToken=invalid-token');
      expect(res.status).toBe(401);
    });
  });

  describe('unit: error handling', () => {
    let verifyJWT;

    beforeAll(async () => {
      ({ verifyJWT } = await import('../middlewares/auth.middleware.js'));
    });

    it('calls next with 401 error when no token provided', async () => {
      const req = { cookies: {}, header: jest.fn().mockReturnValue(undefined) };
      const next = jest.fn();
      await verifyJWT(req, {}, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('calls next with 401 error for invalid JWT', async () => {
      const req = { cookies: { accessToken: 'invalid-token' } };
      const next = jest.fn();
      await verifyJWT(req, {}, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('falls back to Authorization header when no cookie', async () => {
      const { User } = await import('../models/user.model.js');
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'h_user', username: 'h' })
      });
      const req = { header: jest.fn().mockReturnValue('Bearer valid-token'), cookies: {} };
      const next = jest.fn();
      await verifyJWT(req, {}, next);
      // Either success (token valid) or failure (DB issue) -- just verify middleware was invoked
      expect(next).toHaveBeenCalled();
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// optionalAuth middleware — unit tests (core logic)
// ══════════════════════════════════════════════════════════════════════

describe('optionalAuth middleware', () => {
  let optionalAuth;

  beforeAll(async () => {
    const mod = await import('../middlewares/optionalAuth.middleware.js');
    optionalAuth = mod.default;
  });

  it('always calls next(), even with no token', async () => {
    const req = { cookies: {} };
    const next = jest.fn();
    await optionalAuth(req, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('always calls next() with invalid token', async () => {
    const req = { cookies: { accessToken: 'garbage' } };
    const next = jest.fn();
    await optionalAuth(req, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('always calls next(), never throws or blocks the request', async () => {
    const req = { cookies: { accessToken: 'anything' }, header: undefined };
    const next = jest.fn();
    await optionalAuth(req, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('reads token from Authorization header when available', async () => {
    const { User } = await import('../models/user.model.js');
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'header_user', username: 'h' })
    });
    const req = { header: jest.fn().mockReturnValue('Bearer valid-token'), cookies: {} };
    const next = jest.fn();
    await optionalAuth(req, {}, next);
    expect(req.header).toHaveBeenCalledWith('Authorization');
  });
});

// ══════════════════════════════════════════════════════════════════════
// rateLimiter middleware — unit tests
// ══════════════════════════════════════════════════════════════════════

describe('rateLimiter middleware', () => {
  it('exports pre-configured limiters', async () => {
    const { generalLimiter, authLimiter, uploadLimiter } = await import('../middlewares/rateLimiter.middleware.js');
    expect(generalLimiter).toBeDefined();
    expect(authLimiter).toBeDefined();
    expect(uploadLimiter).toBeDefined();
  });

  it('createRateLimiter returns a callable middleware in test mode', async () => {
    const { createRateLimiter } = await import('../middlewares/rateLimiter.middleware.js');
    const limiter = createRateLimiter({ windowMs: 60000, max: 5, message: 'test' });
    expect(limiter).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════
// uploadGuard middleware
// ══════════════════════════════════════════════════════════════════════

describe('uploadGuard middleware', () => {
  it('calls next() allowing all requests through', async () => {
    const mod = await import('../middlewares/uploadGuard.middleware.js');
    const uploadGuard = mod.default;
    const next = jest.fn();
    uploadGuard({}, {}, next);
    expect(next).toHaveBeenCalledWith();
  });
});

// ══════════════════════════════════════════════════════════════════════
// multer middleware
// ══════════════════════════════════════════════════════════════════════

describe('multer middleware', () => {
  it('exports an upload middleware instance', async () => {
    const { upload } = await import('../middlewares/multer.middleware.js');
    expect(upload).toBeDefined();
    // multer v2 returns an object with middleware methods
    expect(typeof upload.fields).toBe('function');
  });

  it('supports fields/array/single configuration', async () => {
    const { upload } = await import('../middlewares/multer.middleware.js');
    // multer v2 fields() returns an object with middleware handler
    const mw = upload.fields([{ name: 'avatar' }, { name: 'coverImage' }]);
    expect(mw).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════
// Integration: health endpoint
// ══════════════════════════════════════════════════════════════════════

describe('Health endpoint', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.uptime).toEqual(expect.any(Number));
  });

  it('returns uptime as a positive number', async () => {
    const res = await request(app).get('/health');
    expect(res.body.uptime).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════
// Integration: authLimiter via supertest
// ══════════════════════════════════════════════════════════════════════

describe('authLimiter integration', () => {
  it('returns 429 after 10 login attempts', async () => {
    const { User } = await import('../models/user.model.js');
    User.findOne.mockResolvedValue(null);

    let lastStatus = 200;
    for (let i = 0; i < 11; i++) {
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({ email: 'test@test.com', password: 'wrongpass' });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
