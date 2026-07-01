import { jest } from '@jest/globals';

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  setex: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  duplicate: jest.fn().mockReturnThis(),
  on: jest.fn(),
  connect: jest.fn(),
  subscribe: jest.fn(),
  publish: jest.fn(),
  once: jest.fn(),
};

/**
 * Creates a mock Mongoose query chain that supports .sort().skip().limit().populate() etc.
 * The returned object is both chainable and then-able (for await).
 */
export function createMockQueryChain(resolvedValue = []) {
  const chain = {
    sort:     jest.fn().mockReturnThis(),
    skip:     jest.fn().mockReturnThis(),
    limit:    jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    select:   jest.fn().mockReturnThis(),
    lean:     jest.fn().mockReturnThis(),
    exec:     jest.fn().mockResolvedValue(resolvedValue),
    distinct: jest.fn().mockResolvedValue(resolvedValue),
    then(resolve) {
      return Promise.resolve(resolvedValue).then(resolve);
    }
  };
  return chain;
}

/**
 * Creates a reusable mock Express res + next with a completion promise.
 * The done promise resolves when either res.json() or next() is called,
 * allowing tests to await controller completion.
 */
export function createMockRes() {
  const res = {};
  res.status  = jest.fn().mockReturnValue(res);
  res.json    = jest.fn().mockReturnValue(res);
  res.cookie  = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return { res, next: jest.fn() };
}

export async function setupTestMocks(options = {}) {
  jest.unstable_mockModule('ioredis', () => ({
    __esModule: true,
    default: function MockRedis() { return mockRedis; }
  }));

  jest.unstable_mockModule('jsonwebtoken', () => ({
    __esModule: true,
    default: {
      verify: jest.fn().mockImplementation((token) => {
        if (token === 'invalid-token') throw new Error('invalid signature');
        return { _id: '507f1f77bcf86cd799439011' };
      }),
      sign: jest.fn().mockReturnValue('mocked-token'),
    }
  }));

  jest.unstable_mockModule('typesense', () => ({
    __esModule: true,
    default: {
      Client: jest.fn().mockImplementation(() => ({
        collections: jest.fn().mockReturnValue({
          documents: jest.fn().mockReturnValue({
            search: jest.fn().mockResolvedValue({ hits: [], found: 0 }),
            upsert: jest.fn().mockResolvedValue({}),
            delete: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
            import: jest.fn().mockResolvedValue([])
          }),
          retrieve: jest.fn().mockResolvedValue({}),
          create: jest.fn().mockResolvedValue({})
        })
      }))
    }
  }));

  jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn().mockResolvedValue({}) })),
    PutObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn()
  }));

  jest.unstable_mockModule('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: jest.fn().mockResolvedValue('https://mock-s3-url.com/upload')
  }));

  jest.unstable_mockModule('../utils/cloudinary.js', () => ({
    uploadOnCloudinary: jest.fn().mockResolvedValue({
      url: 'https://cloudinary.com/mock-video.mp4',
      duration: 120,
    })
  }));

  jest.unstable_mockModule('bullmq', () => ({
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn().mockResolvedValue({ id: 'mock-job-id' })
    }))
  }));

  const mockUserInstance = {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    email: 'test@test.com',
    fullName: 'Test User',
    password: '$2b$10$hash',
    avatar: 'http://example.com/avatar.jpg',
    coverImage: '',
    refreshToken: 'mock-refresh-token',
    isPasswordCorrect: jest.fn().mockResolvedValue(true),
    generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
    generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
    save: jest.fn().mockResolvedValue(true),
  };

  const userQueryMock = {
    select: jest.fn().mockResolvedValue(mockUserInstance),
    then: (resolve) => resolve(mockUserInstance),
  };

  jest.unstable_mockModule('../models/user.model.js', () => ({
    User: {
      findOne: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockReturnValue(userQueryMock),
      findByIdAndUpdate: jest.fn().mockReturnValue(userQueryMock),
      create: jest.fn().mockResolvedValue(mockUserInstance),
      aggregate: jest.fn().mockResolvedValue([]),
      countDocuments: jest.fn().mockResolvedValue(0),
    }
  }));

  jest.unstable_mockModule('../models/video.model.js', () => ({
    Video: {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
        then: (resolve) => resolve([]),
      }),
      findById: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
        then: (resolve) => resolve(null),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
        then: (resolve) => resolve(null),
      }),
      findByIdAndDelete: jest.fn().mockResolvedValue(null),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ _id: 'mock-video-id' }),
      countDocuments: jest.fn().mockResolvedValue(0),
      exists: jest.fn().mockResolvedValue(false),
      aggregate: jest.fn().mockResolvedValue([]),
    }
  }));

  jest.unstable_mockModule('../models/watchHistory.model.js', () => ({
    __esModule: true,
    default: {
      find: jest.fn().mockReturnValue(createMockQueryChain([])),
      findOneAndUpdate: jest.fn().mockReturnValue(createMockQueryChain(null)),
      deleteMany: jest.fn().mockResolvedValue({}),
      aggregate: jest.fn().mockResolvedValue([]),
    }
  }));

  jest.unstable_mockModule('../models/like.model.js', () => ({
    Like: {
      find: jest.fn().mockReturnValue(createMockQueryChain([])),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      findByIdAndDelete: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({}),
      countDocuments: jest.fn().mockResolvedValue(0),
      exists: jest.fn().mockResolvedValue(false),
      aggregate: jest.fn().mockResolvedValue([]),
    }
  }));

  jest.unstable_mockModule('../models/comment.model.js', () => ({
    Comment: {
      find: jest.fn().mockReturnValue(createMockQueryChain([])),
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      findByIdAndDelete: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({}),
      countDocuments: jest.fn().mockResolvedValue(0),
    }
  }));

  jest.unstable_mockModule('../models/notification.model.js', () => ({
    __esModule: true,
    default: {
      find: jest.fn().mockReturnValue(createMockQueryChain([])),
      findById: jest.fn().mockReturnValue(createMockQueryChain(null)),
      create: jest.fn().mockResolvedValue({}),
      findByIdAndUpdate: jest.fn().mockReturnValue(createMockQueryChain(null)),
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      countDocuments: jest.fn().mockResolvedValue(0),
    }
  }));

  jest.unstable_mockModule('../models/subscription.model.js', () => ({
    Subscription: {
      find: jest.fn().mockReturnValue(createMockQueryChain([])),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      deleteOne: jest.fn().mockResolvedValue({}),
      findByIdAndDelete: jest.fn().mockResolvedValue(null),
      aggregate: jest.fn().mockResolvedValue([]),
      countDocuments: jest.fn().mockResolvedValue(0),
    }
  }));

  jest.unstable_mockModule('../models/playlist.model.js', () => ({
    Playlist: {
      find: jest.fn().mockReturnValue(createMockQueryChain([])),
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      findByIdAndUpdate: jest.fn().mockResolvedValue(null),
      findByIdAndDelete: jest.fn().mockResolvedValue(null),
    }
  }));

  jest.unstable_mockModule('../models/tweet.model.js', () => ({
    Tweet: {
      find: jest.fn().mockReturnValue(createMockQueryChain([])),
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      aggregate: jest.fn().mockResolvedValue([]),
      findByIdAndDelete: jest.fn().mockResolvedValue(null),
      findByIdAndUpdate: jest.fn().mockResolvedValue(null),
      findOne: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      countDocuments: jest.fn().mockResolvedValue(0),
    }
  }));

  jest.unstable_mockModule('../models/videoAnalytics.model.js', () => ({
    __esModule: true,
    default: {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
      aggregate: jest.fn().mockResolvedValue([]),
      countDocuments: jest.fn().mockResolvedValue(0),
    }
  }));

  if (!options.skipServiceMocks) {
    jest.unstable_mockModule('../services/searchHistory.service.js', () => ({
      saveSearchQuery: jest.fn().mockResolvedValue(),
      getSearchHistory: jest.fn().mockResolvedValue([]),
    }));

    jest.unstable_mockModule('../services/analytics.service.js', () => ({
      getViewsOverTime: jest.fn().mockResolvedValue([]),
      getSubscriberGrowth: jest.fn().mockResolvedValue([]),
      getTopVideos: jest.fn().mockResolvedValue([]),
      getTrafficSources: jest.fn().mockResolvedValue([]),
      getAudienceRetention: jest.fn().mockResolvedValue([]),
      getSummaryStats: jest.fn().mockResolvedValue({}),
    }));

    jest.unstable_mockModule('../services/notification.service.js', () => ({
      sendNotification: jest.fn().mockResolvedValue(),
    }));

    jest.unstable_mockModule('../services/room.service.js', () => ({
      roomViewers: new Map(),
      registerRoomHandlers: jest.fn(),
    }));

    jest.unstable_mockModule('../services/typesenseSync.service.js', () => ({
      indexVideo: jest.fn().mockResolvedValue(),
      indexTweet: jest.fn().mockResolvedValue(),
      deleteVideo: jest.fn().mockResolvedValue(),
      deleteTweet: jest.fn().mockResolvedValue(),
      updateVideoViews: jest.fn().mockResolvedValue(),
    }));

    jest.unstable_mockModule('../services/recommendation.service.js', () => ({
      getContentBasedRecommendations: jest.fn().mockResolvedValue([]),
      getCollaborativeRecommendations: jest.fn().mockResolvedValue([]),
      getRecommendations: jest.fn().mockResolvedValue([]),
    }));
  }

  const appModule = await import('../app.js');

  const { Video: v } = await import('../models/video.model.js');
  const { User: u } = await import('../models/user.model.js');
  sharedVideoModel = v;
  sharedUserModel = u;

  return appModule.app;
}

export let sharedVideoModel = null;
export let sharedUserModel = null;

/**
 * Resets a mock model's find method to return a fresh chainable query.
 */
export function resetMockFind(mockModel, resolvedValue = []) {
  mockModel.find.mockReturnValue(createMockQueryChain(resolvedValue));
}

/**
 * Resets all Video model mock methods back to default chainable values.
 */
export async function resetVideoMocks() {
  const { Video } = await import('../models/video.model.js');
  Video.find.mockReturnValue(createMockQueryChain([]));
  Video.findById.mockReturnValue(createMockQueryChain(null));
  Video.findByIdAndUpdate.mockReturnValue(createMockQueryChain(null));
  Video.findByIdAndDelete.mockResolvedValue(null);
  Video.findOne.mockResolvedValue(null);
  Video.create.mockResolvedValue({ _id: 'mock-video-id' });
  Video.countDocuments.mockResolvedValue(0);
  Video.exists.mockResolvedValue(false);
  Video.aggregate.mockResolvedValue([]);
}

/**
 * Resets all User model mock methods back to default values.
 */
export async function resetUserMocks() {
  const { User } = await import('../models/user.model.js');
  User.findOne.mockResolvedValue(null);
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue(null),
    then: (cb) => Promise.resolve(null).then(cb),
  });
  User.findByIdAndUpdate.mockReturnValue({
    select: jest.fn().mockResolvedValue(null),
    then: (cb) => Promise.resolve(null).then(cb),
  });
  User.create.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
  User.aggregate.mockResolvedValue([]);
  User.countDocuments.mockResolvedValue(0);
}

/**
 * Resets all Tweet model mock methods.
 */
export async function resetTweetMocks() {
  const { Tweet } = await import('../models/tweet.model.js');
  Tweet.find.mockReturnValue(createMockQueryChain([]));
  Tweet.findById.mockResolvedValue(null);
  Tweet.create.mockResolvedValue({});
  Tweet.aggregate.mockResolvedValue([]);
  Tweet.findByIdAndDelete.mockResolvedValue(null);
  Tweet.findByIdAndUpdate.mockResolvedValue(null);
  Tweet.findOne.mockResolvedValue(null);
  Tweet.deleteMany.mockResolvedValue({ deletedCount: 0 });
  Tweet.countDocuments.mockResolvedValue(0);
}

/**
 * Resets all Comment model mock methods.
 */
export async function resetCommentMocks() {
  const { Comment } = await import('../models/comment.model.js');
  Comment.find.mockReturnValue(createMockQueryChain([]));
  Comment.findById.mockResolvedValue(null);
  Comment.create.mockResolvedValue({});
  Comment.findByIdAndDelete.mockResolvedValue(null);
  Comment.deleteMany.mockResolvedValue({});
  Comment.countDocuments.mockResolvedValue(0);
}

/**
 * Resets all Like model mock methods.
 */
export async function resetLikeMocks() {
  const { Like } = await import('../models/like.model.js');
  Like.find.mockReturnValue(createMockQueryChain([]));
  Like.findOne.mockResolvedValue(null);
  Like.create.mockResolvedValue({});
  Like.findByIdAndDelete.mockResolvedValue(null);
  Like.deleteMany.mockResolvedValue({});
  Like.countDocuments.mockResolvedValue(0);
  Like.exists.mockResolvedValue(false);
  Like.aggregate.mockResolvedValue([]);
}

/**
 * Resets all Playlist model mock methods.
 */
export async function resetPlaylistMocks() {
  const { Playlist } = await import('../models/playlist.model.js');
  Playlist.find.mockReturnValue(createMockQueryChain([]));
  Playlist.findById.mockResolvedValue(null);
  Playlist.create.mockResolvedValue({});
  Playlist.findByIdAndUpdate.mockResolvedValue(null);
  Playlist.findByIdAndDelete.mockResolvedValue(null);
}

/**
 * Resets all Subscription model mock methods.
 */
export async function resetSubscriptionMocks() {
  const { Subscription } = await import('../models/subscription.model.js');
  Subscription.find.mockReturnValue(createMockQueryChain([]));
  Subscription.findOne.mockResolvedValue(null);
  Subscription.create.mockResolvedValue({});
  Subscription.deleteOne.mockResolvedValue({});
  Subscription.findByIdAndDelete.mockResolvedValue(null);
  Subscription.aggregate.mockResolvedValue([]);
  Subscription.countDocuments.mockResolvedValue(0);
}

/**
 * Resets all Notification model mock methods.
 */
export async function resetNotificationMocks() {
  const { default: Notification } = await import('../models/notification.model.js');
  Notification.find.mockReturnValue(createMockQueryChain([]));
  Notification.findById.mockReturnValue(createMockQueryChain(null));
  Notification.create.mockResolvedValue({});
  Notification.findByIdAndUpdate.mockReturnValue(createMockQueryChain(null));
  Notification.updateMany.mockResolvedValue({ modifiedCount: 0 });
  Notification.countDocuments.mockResolvedValue(0);
}
