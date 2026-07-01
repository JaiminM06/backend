import { jest, describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import { setupTestMocks } from './setup.js';

let app;
const VID = '507f1f77bcf86cd799439011';
const VID2 = '507f1f77bcf86cd799439012';

beforeAll(async () => {
  app = await setupTestMocks();
});

describe('User Auth API', () => {

  describe('POST /api/v1/users/register', () => {
    it('returns 400 when body is empty', async () => {
      const res = await request(app).post('/api/v1/users/register').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when email is invalid format', async () => {
      const res = await request(app).post('/api/v1/users/register')
        .send({ fullName: 'Test', email: 'not-email', username: 'test', password: 'pass123' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when username contains special characters', async () => {
      const res = await request(app).post('/api/v1/users/register')
        .send({ fullName: 'Test', email: 't@t.com', username: 'test user!', password: 'pass123' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when password is too short (< 6 chars)', async () => {
      const res = await request(app).post('/api/v1/users/register')
        .send({ fullName: 'Test', email: 't@t.com', username: 'testuser', password: '123' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when fullName is missing', async () => {
      const res = await request(app).post('/api/v1/users/register')
        .send({ email: 't@t.com', username: 'testuser', password: 'pass123' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when avatar file is missing (controller check)', async () => {
      const { User } = await import('../models/user.model.js');
      User.findOne.mockResolvedValue(null);
      const res = await request(app).post('/api/v1/users/register')
        .send({ fullName: 'Test', email: 'fresh@test.com', username: 'newuser', password: 'pass123456' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/users/login', () => {
    it('returns 400 when neither email nor username is provided', async () => {
      const res = await request(app).post('/api/v1/users/login').send({ password: 'somepass' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for non-existent user credentials', async () => {
      const { User } = await import('../models/user.model.js');
      User.findOne.mockResolvedValue(null);
      const res = await request(app).post('/api/v1/users/login')
        .send({ email: 'ghost@ghost.com', password: 'wrongpass' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when password is missing', async () => {
      const res = await request(app).post('/api/v1/users/login').send({ email: 'test@test.com' });
      expect(res.status).toBe(400);
    });

    it.todo('returns 200 with cookies on valid credentials (requires mock propagation fix)');
  });

  describe('GET /api/v1/users/current-user', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/v1/users/current-user');
      expect(res.status).toBe(401);
    });

    it('returns 200 with user data when authenticated', async () => {
      const { User } = await import('../models/user.model.js');
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: VID, username: 'testuser', email: 'test@test.com', fullName: 'Test User' })
      });
      const res = await request(app).get('/api/v1/users/current-user')
        .set('Cookie', 'accessToken=valid-token');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(VID);
    });
  });

  describe('POST /api/v1/users/change-password', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).post('/api/v1/users/change-password')
        .send({ oldPassword: 'a', newPassword: 'b' });
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const { User } = await import('../models/user.model.js');
      User.findById.mockResolvedValue({
        _id: VID, isPasswordCorrect: jest.fn().mockResolvedValue(true), save: jest.fn().mockResolvedValue(true)
      });
      const res = await request(app).post('/api/v1/users/change-password')
        .set('Cookie', 'accessToken=valid-token')
        .send({ oldPassword: 'oldpass123', newPassword: 'newpass456' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/users/history', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/v1/users/history');
      expect(res.status).toBe(401);
    });

    it('returns 200 with watch history when authenticated', async () => {
      const { User } = await import('../models/user.model.js');
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: VID, username: 'testuser' })
      });
      const { default: WatchHistory } = await import('../models/watchHistory.model.js');
      WatchHistory.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), populate: jest.fn().mockReturnThis(),
        then: (cb) => Promise.resolve([]).then(cb)
      });
      const res = await request(app).get('/api/v1/users/history')
        .set('Cookie', 'accessToken=valid-token');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/users/c/:username (channel profile)', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/v1/users/c/definitly_not_a_real_user_xyz');
      expect(res.status).toBe(401);
    });

    it.todo('returns 200 with channel data authenticated (requires mock propagation fix)');
  });

  describe('GET /api/v1/users/:userid', () => {
    it('returns 200 with user data for valid ObjectId', async () => {
      const { User } = await import('../models/user.model.js');
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: VID2, username: 'otheruser', email: 'other@test.com', fullName: 'Other User' })
      });
      const res = await request(app).get(`/api/v1/users/${VID2}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
