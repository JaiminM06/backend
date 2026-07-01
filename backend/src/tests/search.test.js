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

describe('Search API', () => {

  describe('GET /api/v1/search', () => {
    it('returns 400 when q param is missing', async () => {
      const res = await request(app)
        .get('/api/v1/search');
      expect(res.status).toBe(400);
    });

    it('returns 200 with empty results for non-matching query', async () => {
      const res = await request(app)
        .get('/api/v1/search?q=zzzzzzz_noresults_xyz');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('accepts type=video filter', async () => {
      const res = await request(app)
        .get('/api/v1/search?q=test&type=video');
      expect(res.status).toBe(200);
    });

    it('accepts type=tweet filter', async () => {
      const res = await request(app)
        .get('/api/v1/search?q=test&type=tweet');
      expect(res.status).toBe(200);
    });

    it('accepts type=all filter', async () => {
      const res = await request(app)
        .get('/api/v1/search?q=test&type=all');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/search/autocomplete', () => {
    it('returns 400 when q is less than 2 characters', async () => {
      const res = await request(app)
        .get('/api/v1/search/autocomplete?q=a');
      expect(res.status).toBe(400);
    });

    it('returns 200 with suggestions for valid query', async () => {
      const res = await request(app)
        .get('/api/v1/search/autocomplete?q=te');
      expect(res.status).toBe(200);
      expect(res.body.data.suggestions).toBeDefined();
      expect(Array.isArray(res.body.data.suggestions)).toBe(true);
    });
  });

  describe('GET /api/v1/search/history', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/search/history');
      expect(res.status).toBe(401);
    });

    it('returns 200 with search history when authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/search/history')
        .set('Cookie', 'accessToken=valid-token');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.history).toBeDefined();
      expect(Array.isArray(res.body.data.history)).toBe(true);
    });
  });

  describe('DELETE /api/v1/search/history', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .delete('/api/v1/search/history');
      expect(res.status).toBe(401);
    });

    it('returns 200 and clears history when authenticated', async () => {
      const { User } = await import('../models/user.model.js');
      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          searchHistory: []
        }),
        then: (resolve) => resolve({
          _id: '507f1f77bcf86cd799439011',
          searchHistory: []
        }),
      });

      const res = await request(app)
        .delete('/api/v1/search/history')
        .set('Cookie', 'accessToken=valid-token');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('cleared');
    });
  });

  describe('DELETE /api/v1/search/history/entry', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .delete('/api/v1/search/history/entry')
        .send({ query: 'test' });
      expect(res.status).toBe(401);
    });

    it('returns 400 when query is missing', async () => {
      const res = await request(app)
        .delete('/api/v1/search/history/entry')
        .set('Cookie', 'accessToken=valid-token')
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 200 when entry is deleted', async () => {
      const { User } = await import('../models/user.model.js');
      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          searchHistory: []
        }),
        then: (resolve) => resolve({
          _id: '507f1f77bcf86cd799439011',
          searchHistory: []
        }),
      });

      const res = await request(app)
        .delete('/api/v1/search/history/entry')
        .set('Cookie', 'accessToken=valid-token')
        .send({ query: 'test query' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('removed');
    });
  });
});
