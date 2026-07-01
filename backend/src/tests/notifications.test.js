import { jest, describe, it, expect, afterEach, beforeAll } from '@jest/globals';
import request from 'supertest';
import { setupTestMocks } from './setup.js';

let app;

beforeAll(async () => {
  app = await setupTestMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

const AUTH_COOKIE = 'accessToken=valid-token';

describe('Notification API', () => {

  describe('GET /api/v1/notifications', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/notifications');
      expect(res.status).toBe(401);
    });

    it('returns 200 with notifications when authenticated', async () => {
      const { default: Notification } = await import('../models/notification.model.js');
      Notification.countDocuments.mockResolvedValue(5);
      Notification.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
        then: (resolve) => resolve([]),
      });

      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toBeDefined();
      expect(res.body.data.totalCount).toBeDefined();
      expect(res.body.data.unreadCount).toBeDefined();
    });

    it('accepts unreadOnly=true query param', async () => {
      const { default: Notification } = await import('../models/notification.model.js');
      Notification.countDocuments.mockResolvedValue(2);
      Notification.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
        then: (resolve) => resolve([]),
      });

      const res = await request(app)
        .get('/api/v1/notifications?unreadOnly=true')
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /api/v1/notifications/read', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/read')
        .send({ notificationIds: ['000000000000000000000001'] });
      expect(res.status).toBe(401);
    });

    it('returns 400 when notificationIds is empty', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/read')
        .set('Cookie', AUTH_COOKIE)
        .send({ notificationIds: [] });
      expect(res.status).toBe(400);
    });

    it('returns 400 when notificationIds is missing', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/read')
        .set('Cookie', AUTH_COOKIE)
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 when notificationIds is not an array', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/read')
        .set('Cookie', AUTH_COOKIE)
        .send({ notificationIds: 'not-an-array' });
      expect(res.status).toBe(400);
    });

    it('returns 200 when notifications are marked as read', async () => {
      const { default: Notification } = await import('../models/notification.model.js');
      Notification.updateMany.mockResolvedValue({ modifiedCount: 3 });

      const res = await request(app)
        .patch('/api/v1/notifications/read')
        .set('Cookie', AUTH_COOKIE)
        .send({ notificationIds: ['000000000000000000000001', '000000000000000000000002'] });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.updatedCount).toBe(3);
      expect(res.body.message).toContain('read');
    });
  });

  describe('PATCH /api/v1/notifications/read-all', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/read-all');
      expect(res.status).toBe(401);
    });

    it('returns 200 when all notifications are marked as read', async () => {
      const { default: Notification } = await import('../models/notification.model.js');
      Notification.updateMany.mockResolvedValue({ modifiedCount: 5 });

      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('read');
    });
  });
});
