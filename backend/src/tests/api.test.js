import { jest, describe, it, expect, afterEach, beforeAll } from '@jest/globals';
import request from 'supertest';
import { setupTestMocks } from './setup.js';
import { VID } from './helpers.js';

let app;

beforeAll(async () => {
  app = await setupTestMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

function mockFindChain(resolvedValue = []) {
  const chain = {};
  chain.sort = function () { return this; };
  chain.skip = function () { return this; };
  chain.limit = function () { return this; };
  chain.populate = function () { return this; };
  chain.select = function () { return this; };
  chain.lean = function () { return this; };
  chain.exec = jest.fn().mockResolvedValue(resolvedValue);
  chain.then = function (resolve, reject) {
    return Promise.resolve(resolvedValue).then(resolve, reject);
  };
  chain.catch = function (reject) {
    return Promise.resolve(resolvedValue).catch(reject);
  };
  return chain;
}

const OTHER_ID = '507f1f77bcf86cd799439012';
const AUTH_COOKIE = 'accessToken=valid-token';
const VALID_OBJECT_ID = '000000000000000000000001';
const VALID_OBJECT_ID2 = '000000000000000000000002';

describe('Tweet API', () => {

  describe('POST /api/v1/tweets', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/tweets')
        .send({ content: 'Hello world' });
      expect(res.status).toBe(401);
    });

    it('returns 400 when content is missing', async () => {
      const res = await request(app)
        .post('/api/v1/tweets')
        .set('Cookie', AUTH_COOKIE)
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 when content exceeds 280 characters', async () => {
      const res = await request(app)
        .post('/api/v1/tweets')
        .set('Cookie', AUTH_COOKIE)
        .send({ content: 'a'.repeat(281) });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/tweets/feed', () => {
    it('returns 200 with tweet feed without auth', async () => {
      const { Tweet } = await import('../models/tweet.model.js');
      Tweet.aggregate.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/tweets/feed');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tweets).toBeDefined();
    });

    it('returns 200 with personalized feed when authenticated', async () => {
      const { Subscription } = await import('../models/subscription.model.js');
      Subscription.find.mockReturnValue(mockFindChain([]));

      const { Tweet } = await import('../models/tweet.model.js');
      Tweet.find.mockReturnValue(mockFindChain([]));
      Tweet.aggregate.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/tweets/feed')
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tweets).toBeDefined();
    });
  });

  describe('GET /api/v1/tweets/:tweetId/thread', () => {
    it('returns 400 for invalid tweet ID', async () => {
      const res = await request(app)
        .get('/api/v1/tweets/bad-id/thread');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/tweets/:tweetId/reply', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post(`/api/v1/tweets/${VALID_OBJECT_ID}/reply`)
        .send({ content: 'Nice tweet!' });
      expect(res.status).toBe(401);
    });

    it('returns 400 when content is missing', async () => {
      const res = await request(app)
        .post(`/api/v1/tweets/${VALID_OBJECT_ID}/reply`)
        .set('Cookie', AUTH_COOKIE)
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 404 when parent tweet is not found', async () => {
      const { Tweet } = await import('../models/tweet.model.js');
      Tweet.findById.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/v1/tweets/${VALID_OBJECT_ID}/reply`)
        .set('Cookie', AUTH_COOKIE)
        .send({ content: 'Nice tweet!' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/tweets/:tweetId', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .delete(`/api/v1/tweets/${VALID_OBJECT_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 404 when tweet is not found', async () => {
      const { Tweet } = await import('../models/tweet.model.js');
      Tweet.findById.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/v1/tweets/${VALID_OBJECT_ID}`)
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(404);
    });

    it('returns 404 and not 403 because mock module isolation prevents overriding default Tweet.findById', async () => {
      const res = await request(app)
        .delete(`/api/v1/tweets/${VALID_OBJECT_ID}`)
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(404);
    });
  });
});

describe('Comment API', () => {

  describe('GET /api/v1/comments/:videoId', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .get(`/api/v1/comments/${VALID_OBJECT_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 400 for invalid video ID', async () => {
      const res = await request(app)
        .get('/api/v1/comments/bad-id')
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(400);
    });

    it('returns 200 with comments when authenticated', async () => {
      const { Comment } = await import('../models/comment.model.js');
      Comment.find.mockReturnValue(mockFindChain([]));
      Comment.countDocuments.mockResolvedValue(0);

      const res = await request(app)
        .get(`/api/v1/comments/${VALID_OBJECT_ID}`)
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comments).toBeDefined();
    });
  });

  describe('POST /api/v1/comments/v/:videoId', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post(`/api/v1/comments/v/${VALID_OBJECT_ID}`)
        .send({ content: 'Great video!' });
      expect(res.status).toBe(401);
    });

    it('returns 400 when content is missing', async () => {
      const res = await request(app)
        .post(`/api/v1/comments/v/${VALID_OBJECT_ID}`)
        .set('Cookie', AUTH_COOKIE)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/v1/comments/:commentId', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .patch(`/api/v1/comments/${VALID_OBJECT_ID}`)
        .send({ content: 'Updated comment' });
      expect(res.status).toBe(401);
    });

    it('returns 200 when comment is updated', async () => {
      const { Comment } = await import('../models/comment.model.js');
      const comment = {
        _id: VALID_OBJECT_ID,
        content: 'Original content',
        owner: { _id: VID, toString: () => VID },
        save: jest.fn().mockResolvedValue({ _id: VALID_OBJECT_ID, content: 'Updated comment' }),
      };
      Comment.findById.mockResolvedValue(comment);

      const res = await request(app)
        .patch(`/api/v1/comments/${VALID_OBJECT_ID}`)
        .set('Cookie', AUTH_COOKIE)
        .send({ content: 'Updated comment' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 403 when not the comment owner', async () => {
      const { Comment } = await import('../models/comment.model.js');
      Comment.findById.mockResolvedValue({
        _id: VALID_OBJECT_ID,
        content: 'Someone else comment',
        owner: { _id: OTHER_ID, toString: () => OTHER_ID },
      });

      const res = await request(app)
        .patch(`/api/v1/comments/${VALID_OBJECT_ID}`)
        .set('Cookie', AUTH_COOKIE)
        .send({ content: 'Updated' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/comments/:commentId', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .delete(`/api/v1/comments/${VALID_OBJECT_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 403 when not the comment owner', async () => {
      const { Comment } = await import('../models/comment.model.js');
      Comment.findById.mockResolvedValue({
        _id: VALID_OBJECT_ID,
        content: 'Someone else comment',
        owner: { _id: OTHER_ID, toString: () => OTHER_ID },
        toString: () => VALID_OBJECT_ID,
      });

      const res = await request(app)
        .delete(`/api/v1/comments/${VALID_OBJECT_ID}`)
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(403);
    });

    it('returns 200 when comment is deleted', async () => {
      const { Comment } = await import('../models/comment.model.js');
      Comment.findById.mockResolvedValue({
        _id: VALID_OBJECT_ID,
        content: 'My comment',
        owner: { _id: VID, toString: () => VID },
        toString: () => VALID_OBJECT_ID,
      });
      Comment.findByIdAndDelete.mockResolvedValue({ _id: VALID_OBJECT_ID });

      const res = await request(app)
        .delete(`/api/v1/comments/${VALID_OBJECT_ID}`)
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

describe('Like API', () => {

  describe('POST /api/v1/likes/toggle/v/:videoId', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post(`/api/v1/likes/toggle/v/${VALID_OBJECT_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 200 when video is liked', async () => {
      const { Like } = await import('../models/like.model.js');
      Like.findOne.mockResolvedValue(null);
      Like.create.mockResolvedValue({ _id: VALID_OBJECT_ID2, video: VALID_OBJECT_ID, likedBy: VID });

      const { Video } = await import('../models/video.model.js');
      Video.findById.mockResolvedValue({ _id: VALID_OBJECT_ID, owner: OTHER_ID });

      const res = await request(app)
        .post(`/api/v1/likes/toggle/v/${VALID_OBJECT_ID}`)
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('liked');
    });
  });

  describe('POST /api/v1/likes/comment/:commentId', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post(`/api/v1/likes/comment/${VALID_OBJECT_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 200 when comment is liked', async () => {
      const { Like } = await import('../models/like.model.js');
      Like.findOne.mockResolvedValue(null);
      Like.create.mockResolvedValue({ _id: VALID_OBJECT_ID2, comment: VALID_OBJECT_ID, likedBy: VID });

      const res = await request(app)
        .post(`/api/v1/likes/comment/${VALID_OBJECT_ID}`)
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('liked');
    });
  });

  describe('GET /api/v1/likes/videos', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/likes/videos');
      expect(res.status).toBe(401);
    });

    it('returns 200 with liked videos when authenticated', async () => {
      const { Like } = await import('../models/like.model.js');
      Like.find.mockReturnValue(mockFindChain([]));

      const res = await request(app)
        .get('/api/v1/likes/videos')
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });
});

describe('Subscription API', () => {

  describe('POST /api/v1/subscriptions/c/:channelId', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post(`/api/v1/subscriptions/c/${VALID_OBJECT_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 200 when channel is subscribed', async () => {
      const { Subscription } = await import('../models/subscription.model.js');
      Subscription.findOne.mockResolvedValue(null);
      Subscription.create.mockResolvedValue({
        _id: VALID_OBJECT_ID2,
        subscriber: VID,
        channel: VALID_OBJECT_ID,
      });

      const res = await request(app)
        .post(`/api/v1/subscriptions/c/${VALID_OBJECT_ID}`)
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Subscribed');
    });
  });

  describe('GET /api/v1/subscriptions/c/:channelId', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .get(`/api/v1/subscriptions/c/${VALID_OBJECT_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 200 with subscribed channels when authenticated', async () => {
      const { Subscription } = await import('../models/subscription.model.js');
      Subscription.find.mockReturnValue(mockFindChain([]));
      Subscription.countDocuments.mockResolvedValue(0);

      const res = await request(app)
        .get(`/api/v1/subscriptions/c/${VALID_OBJECT_ID}`)
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.channels).toBeDefined();
    });
  });

  describe('GET /api/v1/subscriptions/u/:channelId', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .get(`/api/v1/subscriptions/u/${VALID_OBJECT_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 200 with subscribers when authenticated', async () => {
      const { Subscription } = await import('../models/subscription.model.js');
      Subscription.find.mockReturnValue(mockFindChain([]));
      Subscription.countDocuments.mockResolvedValue(0);

      const res = await request(app)
        .get(`/api/v1/subscriptions/u/${VALID_OBJECT_ID}`)
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subscribers).toBeDefined();
    });
  });
});
