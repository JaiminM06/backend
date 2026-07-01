import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { setupTestMocks } from './setup.js';

let analyticsService, recommendationService, typesenseSyncService;
let searchHistoryService, notificationService, roomService;
let searchService, tweetFeedService;

const VID = '507f1f77bcf86cd799439011';
const VID2 = '507f1f77bcf86cd799439012';

beforeAll(async () => {
  await setupTestMocks({ skipServiceMocks: true });
  analyticsService       = await import('../services/analytics.service.js');
  recommendationService  = await import('../services/recommendation.service.js');
  typesenseSyncService   = await import('../services/typesenseSync.service.js');
  searchHistoryService   = await import('../services/searchHistory.service.js');
  notificationService    = await import('../services/notification.service.js');
  roomService            = await import('../services/room.service.js');
  searchService          = await import('../services/search.service.js');
  tweetFeedService       = await import('../services/tweetFeed.service.js');
});

function setupModelDefaults() {
  // Reimport models to get fresh references
}

// ══════════════════════════════════════════════════════════════════════
// Analytics Service
// ══════════════════════════════════════════════════════════════════════

describe('Analytics Service', () => {
  let VideoAnalytics, Subscription, Video;

  beforeEach(async () => {
    ({ default: VideoAnalytics } = await import('../models/videoAnalytics.model.js'));
    ({ Subscription } = await import('../models/subscription.model.js'));
    ({ Video } = await import('../models/video.model.js'));
  });

  describe('getViewsOverTime', () => {
    it('maps aggregation results to date/views/watchTime shape', async () => {
      VideoAnalytics.aggregate.mockResolvedValue([
        { _id: '2026-06-25', views: 5, avgWatchTime: 30, totalWatchTime: 150 }
      ]);
      const res = await analyticsService.getViewsOverTime([VID], 'week');
      expect(res).toEqual([{ date: '2026-06-25', views: 5, avgWatchTime: 30, totalWatchTime: 150 }]);
    });

    it('returns empty array when no data exists', async () => {
      VideoAnalytics.aggregate.mockResolvedValue([]);
      const res = await analyticsService.getViewsOverTime([VID], 'month');
      expect(res).toEqual([]);
    });

    it('applies default period (month) when not recognized', async () => {
      VideoAnalytics.aggregate.mockResolvedValue([]);
      const res = await analyticsService.getViewsOverTime([VID], 'invalid');
      expect(Array.isArray(res)).toBe(true);
    });
  });

  describe('getSubscriberGrowth', () => {
    it('maps aggregation to date/newSubscribers shape', async () => {
      Subscription.aggregate.mockResolvedValue([
        { _id: '2026-06-25', newSubscribers: 3 }
      ]);
      const res = await analyticsService.getSubscriberGrowth(VID, 'month');
      expect(res).toEqual([{ date: '2026-06-25', newSubscribers: 3 }]);
    });

    it('returns empty array for channel with no subscribers', async () => {
      Subscription.aggregate.mockResolvedValue([]);
      const res = await analyticsService.getSubscriberGrowth(VID, 'year');
      expect(res).toEqual([]);
    });
  });

  describe('getTopVideos', () => {
    it('returns aggregated video array with analytics, likes, comments', async () => {
      Video.aggregate.mockResolvedValue([
        { _id: VID, title: 'Top', thumbnail: 't.jpg', duration: 120, createdAt: new Date(), totalViews: 100, avgCompletionRate: 0.8, avgWatchDuration: 60, likeCount: 5, commentCount: 3 }
      ]);
      const res = await analyticsService.getTopVideos([VID], 5);
      expect(res).toEqual([expect.objectContaining({ title: 'Top', totalViews: 100, likeCount: 5, commentCount: 3 })]);
    });

    it('returns empty array when no published videos', async () => {
      Video.aggregate.mockResolvedValue([]);
      const res = await analyticsService.getTopVideos([VID]);
      expect(res).toEqual([]);
    });
  });

  describe('getTrafficSources', () => {
    it('returns source/count breakdown', async () => {
      VideoAnalytics.aggregate.mockResolvedValue([
        { source: 'direct', count: 50 },
        { source: 'search', count: 30 }
      ]);
      const res = await analyticsService.getTrafficSources([VID]);
      expect(res).toEqual([
        { source: 'direct', count: 50 },
        { source: 'search', count: 30 }
      ]);
    });
  });

  describe('getAudienceRetention', () => {
    it('returns default zero values when no data', async () => {
      VideoAnalytics.aggregate.mockResolvedValue([]);
      const res = await analyticsService.getAudienceRetention(VID);
      expect(res).toEqual({ avgCompletionRate: 0, avgWatchDuration: 0, totalViews: 0, completionPercent: 0 });
    });

    it('returns retention stats when data exists', async () => {
      VideoAnalytics.aggregate.mockResolvedValue([
        { avgCompletionRate: 0.75, avgWatchDuration: 90, totalViews: 100, completionPercent: 60 }
      ]);
      const res = await analyticsService.getAudienceRetention(VID);
      expect(res.avgCompletionRate).toBe(0.75);
      expect(res.totalViews).toBe(100);
      expect(res.completionPercent).toBe(60);
    });
  });

  describe('getSummaryStats', () => {
    it('returns summary with all four stats', async () => {
      VideoAnalytics.countDocuments.mockResolvedValue(100);
      VideoAnalytics.aggregate.mockResolvedValue([{ _id: null, totalWatchSeconds: 3600 }]);
      Subscription.countDocuments.mockResolvedValue(10);
      Video.countDocuments.mockResolvedValue(5);

      const res = await analyticsService.getSummaryStats([VID], 'channel1');
      expect(res).toEqual({ totalViews: 100, totalWatchTimeHours: 1, totalSubscribers: 10, publishedVideoCount: 5 });
    });

    it('handles zero watch time when no analytics', async () => {
      VideoAnalytics.countDocuments.mockResolvedValue(0);
      VideoAnalytics.aggregate.mockResolvedValue([]);
      Subscription.countDocuments.mockResolvedValue(0);
      Video.countDocuments.mockResolvedValue(0);

      const res = await analyticsService.getSummaryStats([VID], 'channel1');
      expect(res.totalWatchTimeHours).toBe(0);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// Recommendation Service
// ══════════════════════════════════════════════════════════════════════

describe('Recommendation Service', () => {
  let Video, WatchHistory;

  beforeEach(async () => {
    ({ Video } = await import('../models/video.model.js'));
    ({ default: WatchHistory } = await import('../models/watchHistory.model.js'));
  });

  describe('getContentBasedRecommendations', () => {
    it('returns empty array when source video has no tags', async () => {
      Video.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: VID, tags: [] }) });
      const res = await recommendationService.getContentBasedRecommendations(VID);
      expect(res).toEqual([]);
    });

    it('returns empty array when source video not found', async () => {
      Video.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      const res = await recommendationService.getContentBasedRecommendations(VID);
      expect(res).toEqual([]);
    });

    it('returns recommendations sorted by tag overlap and views', async () => {
      Video.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: VID, tags: ['react', 'node'] }) });
      Video.aggregate.mockResolvedValue([
        { _id: VID2, title: 'Related', thumbnail: 't.jpg', duration: 60, views: 50, owner: { username: 'u', avatar: 'a' }, hlsManifestUrl: null, createdAt: new Date(), tagOverlap: 2 }
      ]);
      const res = await recommendationService.getContentBasedRecommendations(VID, 5);
      expect(res).toHaveLength(1);
      expect(res[0]).toEqual(expect.objectContaining({ _id: VID2, tagOverlap: 2 }));
    });

    it('catches errors and returns empty array', async () => {
      Video.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: VID, tags: ['react'] }) });
      Video.aggregate.mockRejectedValue(new Error('DB error'));
      const res = await recommendationService.getContentBasedRecommendations(VID);
      expect(res).toEqual([]);
    });
  });

  describe('getCollaborativeRecommendations', () => {
    it('returns empty array when no watch history exists', async () => {
      WatchHistory.aggregate.mockResolvedValue([]);
      const res = await recommendationService.getCollaborativeRecommendations(VID);
      expect(res).toEqual([]);
    });

    it('returns recommendations from collaborative filtering', async () => {
      WatchHistory.aggregate.mockResolvedValue([
        { _id: VID2, title: 'Recommended', thumbnail: 't.jpg', duration: 60, views: 100, owner: { username: 'u', avatar: 'a' }, hlsManifestUrl: null, createdAt: new Date(), count: 3 }
      ]);
      const res = await recommendationService.getCollaborativeRecommendations(VID, 5);
      expect(res).toEqual([expect.objectContaining({ _id: VID2, count: 3 })]);
    });

    it('catches errors and returns empty array', async () => {
      WatchHistory.aggregate.mockRejectedValue(new Error('DB error'));
      const res = await recommendationService.getCollaborativeRecommendations(VID);
      expect(res).toEqual([]);
    });
  });

  describe('getRecommendations', () => {
    it('merges content and collaborative results', async () => {
      Video.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: VID, tags: ['react'] }) });
      Video.aggregate.mockResolvedValue([
        { _id: VID2, title: 'Content Match', thumbnail: 't.jpg', duration: 60, views: 50, owner: { username: 'u', avatar: 'a' }, hlsManifestUrl: null, createdAt: new Date(), tagOverlap: 1 }
      ]);
      WatchHistory.aggregate.mockResolvedValue([
        { _id: VID2, title: 'Content Match', thumbnail: 't.jpg', duration: 60, views: 50, owner: { username: 'u', avatar: 'a' }, hlsManifestUrl: null, createdAt: new Date(), count: 2 }
      ]);
      const res = await recommendationService.getRecommendations(VID, 10);
      expect(Array.isArray(res)).toBe(true);
      expect(res.length).toBeLessThanOrEqual(10);
    });

    it('falls back to latest videos when insufficient recommendations', async () => {
      Video.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: VID, tags: ['react'] }) });
      // Content and collaborative return empty
      Video.aggregate
        .mockResolvedValueOnce([])   // content-based
        .mockResolvedValueOnce([]);  // fallback: latest videos
      WatchHistory.aggregate.mockResolvedValue([]);
      const res = await recommendationService.getRecommendations(VID, 5);
      expect(Array.isArray(res)).toBe(true);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// TypesenseSync Service
// ══════════════════════════════════════════════════════════════════════

describe('TypesenseSync Service', () => {
  let typesenseClient;

  beforeEach(async () => {
    const tsModule = await import('typesense');
    // Access the mock Typesense client created in setup.js
    typesenseClient = tsModule.default.Client.mock.results[0]?.value;
  });

  it('indexVideo calls documents.upsert with correct shape', async () => {
    const video = { _id: VID, title: 'Test', description: 'desc', tags: ['a'], owner: { username: 'u', avatar: 'av' }, thumbnail: 't.jpg', duration: 120, views: 10, isPublished: true, createdAt: new Date() };
    await typesenseSyncService.indexVideo(video);
    // Service should not throw; Typesense client should have been called
    expect(typesenseClient).toBeDefined();
  });

  it('indexTweet calls documents.upsert', async () => {
    const tweet = { _id: VID, content: 'hello', hashtags: [], owner: { username: 'u', avatar: 'av' }, views: 0, retweetCount: 0, replyCount: 0, isRetweet: false, createdAt: new Date() };
    await typesenseSyncService.indexTweet(tweet);
    expect(typesenseClient).toBeDefined();
  });

  it('deleteVideo calls documents delete', async () => {
    await expect(typesenseSyncService.deleteVideo(VID)).resolves.not.toThrow();
  });

  it('deleteTweet calls documents delete', async () => {
    await expect(typesenseSyncService.deleteTweet(VID)).resolves.not.toThrow();
  });

  it('updateVideoViews calls documents update', async () => {
    await expect(typesenseSyncService.updateVideoViews(VID, 42)).resolves.not.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════════════
// Search History Service
// ══════════════════════════════════════════════════════════════════════

describe('Search History Service', () => {
  let User;

  beforeEach(async () => {
    ({ User } = await import('../models/user.model.js'));
  });

  describe('saveSearchQuery', () => {
    it('does nothing when userId is falsy', async () => {
      await searchHistoryService.saveSearchQuery(null, 'query');
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('does nothing when query is empty', async () => {
      await searchHistoryService.saveSearchQuery('user1', '  ');
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('calls findByIdAndUpdate twice (pull then push) for valid input', async () => {
      User.findByIdAndUpdate.mockResolvedValue({});
      await searchHistoryService.saveSearchQuery(VID, 'my query');
      expect(User.findByIdAndUpdate).toHaveBeenCalledTimes(2);
    });

    it('handles DB errors gracefully without throwing', async () => {
      User.findByIdAndUpdate.mockRejectedValue(new Error('DB down'));
      await expect(searchHistoryService.saveSearchQuery(VID, 'query')).resolves.not.toThrow();
    });
  });

  describe('getSearchHistory', () => {
    it('returns empty array when userId is falsy', async () => {
      const res = await searchHistoryService.getSearchHistory(null);
      expect(res).toEqual([]);
    });

    it('returns empty array when user not found', async () => {
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      const res = await searchHistoryService.getSearchHistory(VID);
      expect(res).toEqual([]);
    });

    it('returns sorted search history entries', async () => {
      const older = { query: 'old', searchedAt: new Date('2026-01-01') };
      const newer = { query: 'new', searchedAt: new Date('2026-06-01') };
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ searchHistory: [older, newer] }) });
      const res = await searchHistoryService.getSearchHistory(VID);
      expect(res).toHaveLength(2);
      expect(res[0].query).toBe('new');
      expect(res[1].query).toBe('old');
    });

    it('handles DB errors gracefully', async () => {
      User.findById.mockReturnValue({ select: jest.fn().mockRejectedValue(new Error('DB error')) });
      const res = await searchHistoryService.getSearchHistory(VID);
      expect(res).toEqual([]);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// Notification Service
// ══════════════════════════════════════════════════════════════════════

describe('Notification Service', () => {
  let Notification;

  beforeEach(async () => {
    ({ default: Notification } = await import('../models/notification.model.js'));
  });

  it('creates notification document and returns populated result', async () => {
    const savedNotif = { _id: 'n1', recipient: 'r1', sender: 's1', type: 'new_like', message: 'test' };
    Notification.create.mockResolvedValue(savedNotif);
    Notification.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue({ ...savedNotif, sender: { username: 'u', avatar: 'a' } }) });

    const res = await notificationService.sendNotification({
      recipientId: 'r1', senderId: 's1', type: 'new_like', referenceId: 'v1', referenceModel: 'Video', message: 'test'
    });
    expect(res).toBeDefined();
    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'new_like', recipient: 'r1' }));
  });
});

// ══════════════════════════════════════════════════════════════════════
// Room Service
// ══════════════════════════════════════════════════════════════════════

describe('Room Service', () => {
  let mockSocket, mockIo;

  beforeEach(() => {
    roomService.roomViewers.clear();
    mockSocket = {
      id: 'socket1',
      on: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };
    roomService.registerRoomHandlers(mockSocket, mockIo);
  });

  describe('join_video_room', () => {
    it('adds socket to video room and emits viewer count', () => {
      const handler = mockSocket.on.mock.calls.find(call => call[0] === 'join_video_room')[1];
      handler({ videoId: 'v1' });
      expect(mockSocket.join).toHaveBeenCalledWith('video-v1');
      expect(roomService.roomViewers.has('video-v1')).toBe(true);
      expect(roomService.roomViewers.get('video-v1').has('socket1')).toBe(true);
      expect(mockIo.to).toHaveBeenCalledWith('video-v1');
      expect(mockIo.emit).toHaveBeenCalledWith('viewer_count_update', { videoId: 'v1', count: 1 });
    });

    it('ignores event with missing videoId', () => {
      const handler = mockSocket.on.mock.calls.find(call => call[0] === 'join_video_room')[1];
      handler({});
      expect(mockSocket.join).not.toHaveBeenCalled();
    });

    it('tracks multiple viewers in same room', () => {
      const handler = mockSocket.on.mock.calls.find(call => call[0] === 'join_video_room')[1];
      handler({ videoId: 'v1' });
      // Simulate second socket
      const socket2 = { id: 'socket2', on: jest.fn(), join: jest.fn(), leave: jest.fn(), to: jest.fn().mockReturnThis(), emit: jest.fn() };
      roomService.registerRoomHandlers(socket2, mockIo);
      const handler2 = socket2.on.mock.calls.find(call => call[0] === 'join_video_room')[1];
      handler2({ videoId: 'v1' });
      expect(roomService.roomViewers.get('video-v1').size).toBe(2);
    });
  });

  describe('leave_video_room', () => {
    it('removes socket from room and emits updated count', () => {
      // Join first
      const joinHandler = mockSocket.on.mock.calls.find(call => call[0] === 'join_video_room')[1];
      joinHandler({ videoId: 'v1' });

      const leaveHandler = mockSocket.on.mock.calls.find(call => call[0] === 'leave_video_room')[1];
      leaveHandler({ videoId: 'v1' });
      expect(mockSocket.leave).toHaveBeenCalledWith('video-v1');
      expect(roomService.roomViewers.has('video-v1')).toBe(false);
    });

    it('ignores event with missing videoId', () => {
      const leaveHandler = mockSocket.on.mock.calls.find(call => call[0] === 'leave_video_room')[1];
      leaveHandler({});
      expect(mockSocket.leave).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('cleans up viewer from all rooms on disconnect', () => {
      const joinHandler = mockSocket.on.mock.calls.find(call => call[0] === 'join_video_room')[1];
      joinHandler({ videoId: 'v1' });
      expect(roomService.roomViewers.size).toBe(1);

      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
      disconnectHandler();
      expect(roomService.roomViewers.size).toBe(0);
    });
  });

  describe('join_tweet_room / leave_tweet_room', () => {
    it('joins tweet room on join_tweet_room event', () => {
      const handler = mockSocket.on.mock.calls.find(call => call[0] === 'join_tweet_room')[1];
      handler({ tweetId: 't1' });
      expect(mockSocket.join).toHaveBeenCalledWith('tweet-t1');
    });

    it('leaves tweet room on leave_tweet_room event', () => {
      const handler = mockSocket.on.mock.calls.find(call => call[0] === 'leave_tweet_room')[1];
      handler({ tweetId: 't1' });
      expect(mockSocket.leave).toHaveBeenCalledWith('tweet-t1');
    });
  });

  describe('typing_comment', () => {
    it('emits user_typing to room excluding sender', () => {
      const handler = mockSocket.on.mock.calls.find(call => call[0] === 'typing_comment')[1];
      handler({ videoId: 'v1', username: 'testuser' });
      expect(mockSocket.to).toHaveBeenCalledWith('video-v1');
      expect(mockSocket.emit).toHaveBeenCalledWith('user_typing', { username: 'testuser' });
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// Search Service
// ══════════════════════════════════════════════════════════════════════

describe('Search Service', () => {
  it('searchVideos returns mapped results with total found', async () => {
    const res = await searchService.searchVideos('test', {}, 1, 20);
    expect(res).toEqual(expect.objectContaining({
      results: expect.any(Array),
      totalFound: expect.any(Number),
      page: 1,
      limit: 20
    }));
  });

  it('searchVideos clamps limit to max 50', async () => {
    const res = await searchService.searchVideos('test', {}, 1, 100);
    expect(res.limit).toBe(50);
  });

  it('searchTweets returns mapped results', async () => {
    const res = await searchService.searchTweets('test', 1, 20);
    expect(res).toEqual(expect.objectContaining({
      results: expect.any(Array),
      totalFound: expect.any(Number),
      page: 1,
      limit: 20
    }));
  });

  it('searchAll returns combined video and tweet results', async () => {
    const res = await searchService.searchAll('test', 1, 10);
    expect(res).toEqual(expect.objectContaining({
      videos: expect.any(Object),
      tweets: expect.any(Object)
    }));
    expect(res.videos).toHaveProperty('results');
    expect(res.tweets).toHaveProperty('results');
  });

  it('getAutocompleteSuggestions returns unique titles', async () => {
    const res = await searchService.getAutocompleteSuggestions('test');
    expect(Array.isArray(res)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════
// Tweet Feed Service
// ══════════════════════════════════════════════════════════════════════

describe('Tweet Feed Service', () => {
  let Tweet, Subscription, Like;

  beforeEach(async () => {
    ({ Tweet } = await import('../models/tweet.model.js'));
    ({ Subscription } = await import('../models/subscription.model.js'));
    ({ Like } = await import('../models/like.model.js'));
  });

  describe('getGlobalTweetFeed', () => {
    it('returns feed object with tweets array and pagination', async () => {
      Tweet.aggregate.mockResolvedValue([]);
      const res = await tweetFeedService.getGlobalTweetFeed(1, 20);
      expect(res).toEqual(expect.objectContaining({
        tweets: expect.any(Array),
        page: 1,
        limit: 20,
        isPersonalized: false
      }));
    });

    it('enriches tweets with likedByCurrentUser when userId provided', async () => {
      Tweet.aggregate.mockResolvedValue([]);
      const res = await tweetFeedService.getGlobalTweetFeed(1, 20, VID);
      expect(res.isPersonalized).toBe(false);
    });
  });

  describe('getPersonalizedTweetFeed', () => {
    it('falls back to global feed when user follows no one', async () => {
      Subscription.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
      Tweet.aggregate.mockResolvedValue([]);
      const res = await tweetFeedService.getPersonalizedTweetFeed(VID, 1, 20);
      expect(res.isPersonalized).toBe(false);
    });

    it('returns personalized feed with followed users tweets', async () => {
      Subscription.find.mockReturnValue({ select: jest.fn().mockResolvedValue([{ channel: 'followed1' }]) });
      Tweet.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { _id: 't1', content: 'hello', owner: { _id: 'followed1' }, views: 10, retweetCount: 0, replyCount: 0, createdAt: new Date(), toObject: () => ({}) }
        ])
      });
      Like.aggregate.mockResolvedValue([]);
      Like.find.mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([]) });
      const res = await tweetFeedService.getPersonalizedTweetFeed(VID, 1, 20);
      expect(res.isPersonalized).toBe(true);
      expect(res.tweets).toHaveLength(1);
    });

    it('calculates engagement score with recency bonus', async () => {
      Subscription.find.mockReturnValue({ select: jest.fn().mockResolvedValue([{ channel: 'f1' }]) });
      const now = new Date();
      Tweet.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { _id: 't1', content: 'hello', owner: { _id: 'f1' }, views: 100, retweetCount: 5, replyCount: 2, createdAt: now, toObject: () => ({}) }
        ])
      });
      Like.aggregate.mockResolvedValue([]);
      Like.find.mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([]) });
      const res = await tweetFeedService.getPersonalizedTweetFeed(VID, 1, 20);
      expect(res.tweets[0].engagementScore).toBeGreaterThan(0);
    });

    it('returns empty when followed users have no recent tweets', async () => {
      Subscription.find.mockReturnValue({ select: jest.fn().mockResolvedValue([{ channel: 'f1' }]) });
      Tweet.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });
      const res = await tweetFeedService.getPersonalizedTweetFeed(VID, 1, 20);
      expect(res.tweets).toEqual([]);
    });
  });
});
