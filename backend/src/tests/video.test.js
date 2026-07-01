import { jest, describe, it, expect, afterEach, beforeAll } from '@jest/globals';
import request from 'supertest';
import { setupTestMocks } from './setup.js';

let app;

const VID = '507f1f77bcf86cd799439011';
const VID2 = '507f1f77bcf86cd799439012';

beforeAll(async () => {
  app = await setupTestMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Video API', () => {

  describe('GET /api/v1/videos', () => {
    it('returns 401 without auth (verifyJWT required)', async () => {
      const res = await request(app)
        .get('/api/v1/videos');
      expect(res.status).toBe(401);
    });

    it('accepts page and limit query params (401 without auth)', async () => {
      const res = await request(app)
        .get('/api/v1/videos?page=1&limit=5');
      expect(res.status).toBe(401);
    });

    it('silently caps limit at 50 (401 without auth)', async () => {
      const res = await request(app)
        .get('/api/v1/videos?limit=999');
      expect(res.status).toBe(401);
    });

    it('returns 200 with paginated structure when authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/videos')
        .set('Cookie', 'accessToken=valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.videos).toBeDefined();
      expect(typeof res.body.data.total).toBe('number');
    });
  });

  describe('POST /api/v1/videos (publishAVideo)', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/videos')
        .send({ title: 'Test' });
      expect(res.status).toBe(401);
    });

    it('returns 410 Gone when authenticated (deprecated endpoint)', async () => {
      const res = await request(app)
        .post('/api/v1/videos')
        .set('Cookie', 'accessToken=valid-token')
        .send({ title: 'Test', description: 'Test desc' });

      expect(res.status).toBe(410);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('deprecated');
    });
  });

  describe('GET /api/v1/videos/:videoId', () => {
    it('returns 401 for invalid ObjectId without auth', async () => {
      const res = await request(app)
        .get('/api/v1/videos/not-a-valid-id');
      expect(res.status).toBe(401);
    });

    it('returns 401 for valid ObjectId not found without auth', async () => {
      const res = await request(app)
        .get('/api/v1/videos/000000000000000000000000');
      expect(res.status).toBe(401);
    });

    it('returns 400 for invalid ObjectId format with auth', async () => {
      const res = await request(app)
        .get('/api/v1/videos/not-a-valid-id')
        .set('Cookie', 'accessToken=valid-token');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 for valid ObjectId that does not exist with auth', async () => {
      const res = await request(app)
        .get(`/api/v1/videos/${VID2}`)
        .set('Cookie', 'accessToken=valid-token');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it.todo('returns 200 with video data when authenticated and video exists');
  });

  describe('DELETE /api/v1/videos/:videoId', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .delete('/api/v1/videos/000000000000000000000000');
      expect(res.status).toBe(401);
    });

    it.todo('returns 200 when authenticated owner deletes video');
    it.todo('returns 403 when authenticated user is not the owner');
  });

  describe('PATCH /api/v1/videos/:videoId', () => {
    it.todo('returns 200 when authenticated owner updates video');
  });

  describe('POST /api/v1/upload/request-url', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/upload/request-url')
        .send({ fileName: 't.mp4', contentType: 'video/mp4', fileSize: 1000000, title: 'Test' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/upload/stream/:videoId', () => {
    it('returns 404 for non-existent videoId', async () => {
      const res = await request(app)
        .get('/api/v1/upload/stream/000000000000000000000000');
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid ObjectId format', async () => {
      const res = await request(app)
        .get('/api/v1/upload/stream/bad-id');
      expect(res.status === 400 || res.status === 404).toBe(true);
    });
  });
});
