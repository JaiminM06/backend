import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { setupTestMocks, createMockRes } from './setup.js';

let videoController;
const TEST_VIDEO_ID = '507f1f77bcf86cd799439011';

beforeAll(async () => {
  await setupTestMocks();
  videoController = await import('../controllers/video.controller.js');
});

function makeReq(overrides = {}) {
  return { params: {}, query: {}, body: {}, ip: '127.0.0.1', ...overrides };
}

function ch(value) {
  return { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), then: (cb) => Promise.resolve(value).then(cb), exec: jest.fn().mockResolvedValue(value) };
}

function reset(Video) {
  Video.find.mockReturnValue(ch([]));
  Video.findById.mockReturnValue(ch(null));
  Video.findByIdAndUpdate.mockReturnValue(ch(null));
  Video.findByIdAndDelete.mockResolvedValue(null);
  Video.findOne.mockResolvedValue(null);
  Video.create.mockResolvedValue({ _id: 'mock-video-id' });
  Video.countDocuments.mockResolvedValue(0);
  Video.exists.mockResolvedValue(false);
  Video.aggregate.mockResolvedValue([]);
}

describe('Video Controller — getInfiniteHomeFeed', () => {
  let Video;
  beforeEach(async () => {
    ({ Video } = await import('../models/video.model.js'));
    reset(Video);
  });

  it('returns 200 with paginated feed', async () => {
    Video.countDocuments.mockResolvedValue(5);
    const { res, next } = createMockRes();
    videoController.getInfiniteHomeFeed(makeReq({ query: { page: '1', limit: '10' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('Video Controller — getAllVideos', () => {
  let Video;
  beforeEach(async () => {
    ({ Video } = await import('../models/video.model.js'));
    reset(Video);
  });

  it('returns 200 with paginated user videos', async () => {
    Video.countDocuments.mockResolvedValue(3);
    const { res, next } = createMockRes();
    videoController.getAllVideos(makeReq({ user: { _id: 'u1' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('enforces max limit of 50', async () => {
    Video.countDocuments.mockResolvedValue(0);
    const { res, next } = createMockRes();
    videoController.getAllVideos(makeReq({ user: { _id: 'u1' }, query: { limit: '100' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(res.json.mock.calls[0][0].data.limit).toBe(50);
  });
});

describe('Video Controller — publishAVideo', () => {
  it('throws 410 Gone', async () => {
    const { res, next } = createMockRes();
    videoController.publishAVideo(makeReq(), res, next);
    await new Promise(r => setImmediate(r));
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('Video Controller — getVideoById', () => {
  let Video, User, Like;
  beforeEach(async () => {
    ({ Video } = await import('../models/video.model.js'));
    ({ User } = await import('../models/user.model.js'));
    ({ Like } = await import('../models/like.model.js'));
    reset(Video);
    User.findByIdAndUpdate.mockResolvedValue(null);
    Like.countDocuments.mockResolvedValue(0);
    Like.exists.mockResolvedValue(false);
  });

  it('returns 200 with video data', async () => {
    const vid = { _id: TEST_VIDEO_ID, title: 'V', description: 'D', owner: { _id: 'other', username: 'x', avatar: 'a' }, isPublished: true, processingStatus: 'ready', views: 10, toObject() { return { ...this }; } };
    Video.findById.mockReturnValue(ch(vid));
    const { res, next } = createMockRes();
    videoController.getVideoById(makeReq({ params: { videoId: TEST_VIDEO_ID }, user: { _id: 'other' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 400 for invalid videoId', async () => {
    const { res, next } = createMockRes();
    videoController.getVideoById(makeReq({ params: { videoId: 'bad' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('returns 404 when video not found', async () => {
    Video.findById.mockReturnValue(ch(null));
    const { res, next } = createMockRes();
    videoController.getVideoById(makeReq({ params: { videoId: TEST_VIDEO_ID } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('does not increment views when owner watches', async () => {
    const vid = { _id: TEST_VIDEO_ID, owner: { _id: 'u1' }, isPublished: true, processingStatus: 'ready', views: 10, toObject() { return { ...this }; } };
    Video.findById.mockReturnValue(ch(vid));
    const { res, next } = createMockRes();
    videoController.getVideoById(makeReq({ params: { videoId: TEST_VIDEO_ID }, user: { _id: 'u1' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(Video.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});

describe('Video Controller — updateVideo', () => {
  let Video;
  beforeEach(async () => {
    ({ Video } = await import('../models/video.model.js'));
    reset(Video);
  });

  it('returns 200 on successful update', async () => {
    Video.findById.mockResolvedValue({ _id: TEST_VIDEO_ID, owner: 'u1' });
    Video.findByIdAndUpdate.mockResolvedValue({ _id: TEST_VIDEO_ID, title: 'new', description: 'newd' });
    const { res, next } = createMockRes();
    videoController.updateVideo(makeReq({ user: { _id: 'u1' }, params: { videoId: TEST_VIDEO_ID }, body: { title: 'new', description: 'newd' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 400 when no fields provided', async () => {
    Video.findById.mockResolvedValue({ _id: TEST_VIDEO_ID, owner: 'u1' });
    const { res, next } = createMockRes();
    videoController.updateVideo(makeReq({ user: { _id: 'u1' }, params: { videoId: TEST_VIDEO_ID }, body: {} }), res, next);
    await new Promise(r => setImmediate(r));
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('returns 403 when not owner', async () => {
    Video.findById.mockResolvedValue({ _id: TEST_VIDEO_ID, owner: 'other' });
    const { res, next } = createMockRes();
    videoController.updateVideo(makeReq({ user: { _id: 'u1' }, params: { videoId: TEST_VIDEO_ID }, body: { title: 'new' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('returns 404 when not found', async () => {
    Video.findById.mockResolvedValue(null);
    const { res, next } = createMockRes();
    videoController.updateVideo(makeReq({ user: { _id: 'u1' }, params: { videoId: TEST_VIDEO_ID }, body: { title: 'new' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('Video Controller — deleteVideo', () => {
  let Video;
  beforeEach(async () => {
    ({ Video } = await import('../models/video.model.js'));
  });

  it('returns 200 on successful delete', async () => {
    Video.findById.mockResolvedValue({ _id: TEST_VIDEO_ID, owner: 'u1', rawFileKey: null, hlsManifestUrl: null });
    Video.findByIdAndDelete.mockResolvedValue({ _id: TEST_VIDEO_ID });
    const { res, next } = createMockRes();
    videoController.deleteVideo(makeReq({ user: { _id: 'u1' }, params: { videoId: TEST_VIDEO_ID } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 403 when not owner', async () => {
    Video.findById.mockResolvedValue({ _id: TEST_VIDEO_ID, owner: 'other' });
    const { res, next } = createMockRes();
    videoController.deleteVideo(makeReq({ user: { _id: 'u1' }, params: { videoId: TEST_VIDEO_ID } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('Video Controller — togglePublishStatus', () => {
  let Video;
  beforeEach(async () => {
    ({ Video } = await import('../models/video.model.js'));
  });

  it('returns 200 when toggling publish status', async () => {
    Video.findById.mockResolvedValue({ _id: TEST_VIDEO_ID, isPublished: true, save: jest.fn().mockResolvedValue(true) });
    const { res, next } = createMockRes();
    videoController.togglePublishStatus(makeReq({ params: { videoId: TEST_VIDEO_ID } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when not found', async () => {
    Video.findById.mockResolvedValue(null);
    const { res, next } = createMockRes();
    videoController.togglePublishStatus(makeReq({ params: { videoId: TEST_VIDEO_ID } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
