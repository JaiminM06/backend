import { jest, describe, it, expect, afterEach, beforeAll } from '@jest/globals';
import request from 'supertest';
import { setupTestMocks, createMockQueryChain } from './setup.js';

let app;

beforeAll(async () => {
  app = await setupTestMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

function mockVideoFindWithIds() {
  return {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([{ _id: '000000000000000000000001' }]),
    then: (resolve) => resolve([{ _id: '000000000000000000000001' }]),
  };
}

describe('Analytics API', () => {

  describe('POST /api/v1/analytics/watch-event', () => {
    it('returns 400 when videoId is missing', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/watch-event')
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 when watchDuration is missing', async () => {
      const { Video } = await import('../models/video.model.js');
      Video.exists.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/analytics/watch-event')
        .send({ videoId: '000000000000000000000000', totalDuration: 120 });
      expect(res.status).toBe(400);
    });

    it('returns 400 when totalDuration is 0', async () => {
      const { Video } = await import('../models/video.model.js');
      Video.exists.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/analytics/watch-event')
        .send({ videoId: '000000000000000000000000', watchDuration: 60, totalDuration: 0 });
      expect(res.status).toBe(400);
    });

    it('returns 429 after 30 requests in 1 minute', async () => {
      const { Video } = await import('../models/video.model.js');
      Video.exists.mockResolvedValue(true);

      const payload = { videoId: '000000000000000000000000', watchDuration: 60, totalDuration: 120 };

      let lastStatus = 200;
      for (let i = 0; i < 31; i++) {
        const res = await request(app)
          .post('/api/v1/analytics/watch-event')
          .send(payload);
        lastStatus = res.status;
      }
      expect(lastStatus).toBe(429);
    });
  });

  describe('GET /api/v1/analytics/summary', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/summary');
      expect(res.status).toBe(401);
    });

    it('returns 200 with summary data when authenticated', async () => {
      const { Video } = await import('../models/video.model.js');
      Video.find.mockReturnValue(mockVideoFindWithIds());

      const { getSummaryStats } = await import('../services/analytics.service.js');
      getSummaryStats.mockResolvedValue({
        totalViews: 15000,
        totalSubscribers: 320,
        totalVideos: 12,
        totalWatchTime: 450000,
      });

      const res = await request(app)
        .get('/api/v1/analytics/summary')
        .set('Cookie', 'accessToken=valid-token');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toBeDefined();
    });
  });

  describe('GET /api/v1/analytics/views', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/views');
      expect(res.status).toBe(401);
    });

    it('returns 200 with views chart data when authenticated', async () => {
      const { Video } = await import('../models/video.model.js');
      Video.find.mockReturnValue(mockVideoFindWithIds());

      const { getViewsOverTime } = await import('../services/analytics.service.js');
      getViewsOverTime.mockResolvedValue([
        { date: '2024-01-01', views: 120 },
        { date: '2024-01-02', views: 95 },
      ]);

      const res = await request(app)
        .get('/api/v1/analytics/views?period=week')
        .set('Cookie', 'accessToken=valid-token');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toBeDefined();
    });
  });

  describe('GET /api/v1/analytics/subscribers', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/subscribers');
      expect(res.status).toBe(401);
    });

    it('returns 200 with subscriber growth data when authenticated', async () => {
      const { getSubscriberGrowth } = await import('../services/analytics.service.js');
      getSubscriberGrowth.mockResolvedValue([
        { date: '2024-01-01', count: 10 },
        { date: '2024-01-02', count: 15 },
      ]);

      const res = await request(app)
        .get('/api/v1/analytics/subscribers?period=month')
        .set('Cookie', 'accessToken=valid-token');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toBeDefined();
    });
  });

  describe('GET /api/v1/analytics/retention/:videoId', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/retention/000000000000000000000001');
      expect(res.status).toBe(401);
    });

    it('returns 404 when video is not found or not owned by user', async () => {
      const { Video } = await import('../models/video.model.js');
      Video.findOne.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/analytics/retention/000000000000000000000001')
        .set('Cookie', 'accessToken=valid-token');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/trending/videos', () => {
    it('returns 200 without auth', async () => {
      const { Video } = await import('../models/video.model.js');
      Video.aggregate.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/trending/videos');
      expect(res.status).toBe(200);
    });

    it('accepts period=day query param', async () => {
      const { Video } = await import('../models/video.model.js');
      Video.aggregate.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/trending/videos?period=day');
      expect(res.status).toBe(200);
    });

    it('accepts period=month query param', async () => {
      const { Video } = await import('../models/video.model.js');
      Video.aggregate.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/trending/videos?period=month');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/trending/hashtags', () => {
    it('returns 200 without auth', async () => {
      const { Tweet } = await import('../models/tweet.model.js');
      Tweet.aggregate.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/trending/hashtags');
      expect(res.status).toBe(200);
      expect(res.body.data.trending).toBeDefined();
      expect(Array.isArray(res.body.data.trending)).toBe(true);
    });
  });
});
