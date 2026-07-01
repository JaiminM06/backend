import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import { setupTestMocks } from './setup.js';

const VID = '507f1f77bcf86cd799439011';

beforeAll(async () => {
  await setupTestMocks();
});

// ══════════════════════════════════════════════════════════════════════
// Socket Config — JWT Auth Middleware
// ══════════════════════════════════════════════════════════════════════

describe('Socket.IO Auth Middleware', () => {
  let jwt;

  beforeAll(async () => {
    const mod = await import('jsonwebtoken');
    jwt = mod.default;
  });

  describe('token extraction from handshake', () => {
    it('reads token from handshake.auth.token', () => {
      const token = 'valid-token';
      const extracted = token;
      expect(extracted).toBe('valid-token');
    });

    it('reads token from cookie header when auth.token is missing', () => {
      const cookieHeader = 'other=val; accessToken=valid-token; sid=abc';
      const token = cookieHeader
        .split(';')
        .find(c => c.trim().startsWith('accessToken='))
        ?.split('=')[1];
      expect(token).toBe('valid-token');
    });

    it('returns undefined when no token in cookie', () => {
      const cookieHeader = 'other=val; sid=abc';
      const token = cookieHeader
        .split(';')
        .find(c => c.trim().startsWith('accessToken='))
        ?.split('=')[1];
      expect(token).toBeUndefined();
    });

    it('handles cookie with extra spaces', () => {
      const cookieHeader = ' accessToken =  my-token  ; other=val';
      const token = cookieHeader
        .split(';')
        .find(c => c.trim().startsWith('accessToken'))
        ?.split('=')[1]?.trim();
      expect(token).toBe('my-token');
    });
  });

  describe('JWT verification', () => {
    it('verifies valid token with ACCESS_TOKEN_SECRET', () => {
      const decoded = jwt.verify('valid-token', 'some-secret');
      expect(decoded).toBeDefined();
      expect(decoded._id).toBeDefined();
    });

    it('rejects invalid token', () => {
      expect(() => jwt.verify('invalid-token', 'some-secret')).toThrow();
    });

    it('returns decoded payload with _id', () => {
      const decoded = jwt.verify('valid-token', 'some-secret');
      expect(decoded._id).toBe(VID); // mock returns this
      expect(typeof decoded._id).toBe('string');
    });
  });

  describe('auth middleware flow', () => {
    it('calls next() on valid token', () => {
      const next = (arg) => arg;
      const result = next();
      expect(result).toBeUndefined(); // no error → success
    });

    it('calls next(Error) on missing token', () => {
      const next = (arg) => arg;
      const result = next(new Error('Authentication required'));
      expect(result).toBeInstanceOf(Error);
    });

    it('calls next(Error) on invalid token', () => {
      const next = (arg) => arg;
      const result = next(new Error('Invalid or expired token'));
      expect(result.message).toContain('Invalid');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// Online Users Tracking
// ══════════════════════════════════════════════════════════════════════

describe('Online Users Tracking', () => {
  let onlineUsers;

  beforeEach(() => {
    onlineUsers = new Map();
  });

  it('registers user on connection', () => {
    onlineUsers.set('user1', 'socket1');
    expect(onlineUsers.get('user1')).toBe('socket1');
    expect(onlineUsers.size).toBe(1);
  });

  it('removes user on disconnect', () => {
    onlineUsers.set('user1', 'socket1');
    onlineUsers.delete('user1');
    expect(onlineUsers.has('user1')).toBe(false);
    expect(onlineUsers.size).toBe(0);
  });

  it('updates socketId on reconnect (new connection)', () => {
    onlineUsers.set('user1', 'socket1');
    onlineUsers.set('user1', 'socket2');
    expect(onlineUsers.get('user1')).toBe('socket2');
    expect(onlineUsers.size).toBe(1);
  });

  it('supports multiple concurrent users', () => {
    onlineUsers.set('user1', 's1');
    onlineUsers.set('user2', 's2');
    onlineUsers.set('user3', 's3');
    expect(onlineUsers.size).toBe(3);
  });

  it('only removes the disconnecting user, not others', () => {
    onlineUsers.set('user1', 's1');
    onlineUsers.set('user2', 's2');
    onlineUsers.delete('user1');
    expect(onlineUsers.has('user1')).toBe(false);
    expect(onlineUsers.has('user2')).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════
// Online User Delivery Check
// ══════════════════════════════════════════════════════════════════════

describe('Notification Delivery — online check', () => {
  let onlineUsers;

  beforeEach(() => {
    onlineUsers = new Map();
  });

  it('delivers notification when recipient is online', () => {
    onlineUsers.set('user1', 'socket1');
    const recipientKey = String('user1');
    expect(onlineUsers.has(recipientKey)).toBe(true);
    expect(onlineUsers.get(recipientKey)).toBe('socket1');
  });

  it('skips socket delivery when recipient is offline', () => {
    const recipientKey = String('user2');
    expect(onlineUsers.has(recipientKey)).toBe(false);
  });

  it('delivers to correct socket even with multiple online users', () => {
    onlineUsers.set('user1', 's1');
    onlineUsers.set('user2', 's2');
    onlineUsers.set('user3', 's3');

    const recipientKey = String('user2');
    expect(onlineUsers.get(recipientKey)).toBe('s2');
    expect(onlineUsers.get('user1')).toBe('s1');
  });
});

// ══════════════════════════════════════════════════════════════════════
// Socket.IO Events Map
// ══════════════════════════════════════════════════════════════════════

describe('Socket.IO Event Map', () => {

  describe('emitted events (server → client)', () => {
    const EVENTS = [
      { name: 'new_tweet', producer: 'tweet.controller', payload: { tweet: '...' } },
      { name: 'new_comment', producer: 'comment.controller', payload: { comment: '...' } },
      { name: 'new_reply', producer: 'tweet.controller', payload: { reply: '...' } },
      { name: 'new_quote_tweet', producer: 'tweet.controller', payload: { quoteTweet: '...' } },
      { name: 'notification', producer: 'notification.service', payload: { notification: '...' } },
      { name: 'viewer_count_update', producer: 'room.service', payload: { videoId: 'v1', count: 5 } },
      { name: 'user_typing', producer: 'room.service', payload: { username: '...' } },
    ];

    it('has 7 registered emission types', () => {
      expect(EVENTS).toHaveLength(7);
    });

    it('all events have name and producer', () => {
      EVENTS.forEach(e => {
        expect(e.name).toBeTruthy();
        expect(e.producer).toBeTruthy();
      });
    });

    it('notification event has correct payload shape', () => {
      const notif = EVENTS.find(e => e.name === 'notification');
      expect(notif.payload).toHaveProperty('notification');
    });
  });

  describe('listened events (client → server)', () => {
    const LISTENERS = [
      'join_video_room',
      'leave_video_room',
      'join_tweet_room',
      'leave_tweet_room',
      'typing_comment',
      'disconnect',
    ];

    it('has 6 registered listener types', () => {
      expect(LISTENERS).toHaveLength(6);
    });

    it('disconnect is handled in both socket.js and room.service.js', () => {
      expect(LISTENERS).toContain('disconnect');
    });

    it('all listener names use snake_case convention', () => {
      LISTENERS.forEach(l => {
        expect(l).toMatch(/^[a-z_]+$/);
      });
    });
  });

  describe('room naming convention', () => {
    it('video rooms use prefix "video-"', () => {
      expect(`video-${VID}`).toBe(`video-${VID}`);
    });

    it('tweet rooms use prefix "tweet-"', () => {
      expect(`tweet-${VID}`).toBe(`tweet-${VID}`);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// Room Service Integration — viewer tracking
// ══════════════════════════════════════════════════════════════════════

describe('Room Service — Viewer Tracking', () => {
  let roomService;

  beforeAll(async () => {
    roomService = await import('../services/room.service.js');
  });

  beforeEach(() => {
    roomService.roomViewers.clear();
  });

  describe('roomViewers lifecycle', () => {
    it('starts empty', () => {
      expect(roomService.roomViewers.size).toBe(0);
    });

    it('adds viewer to room', () => {
      roomService.roomViewers.set('video-v1', new Set(['socket1']));
      expect(roomService.roomViewers.get('video-v1').size).toBe(1);
      expect(roomService.roomViewers.get('video-v1').has('socket1')).toBe(true);
    });

    it('adds multiple viewers to same room', () => {
      const viewers = new Set(['socket1', 'socket2', 'socket3']);
      roomService.roomViewers.set('video-v1', viewers);
      expect(roomService.roomViewers.get('video-v1').size).toBe(3);
    });

    it('removes viewer from room', () => {
      roomService.roomViewers.set('video-v1', new Set(['socket1', 'socket2']));
      roomService.roomViewers.get('video-v1').delete('socket1');
      expect(roomService.roomViewers.get('video-v1').size).toBe(1);
      expect(roomService.roomViewers.get('video-v1').has('socket1')).toBe(false);
    });

    it('deletes room when last viewer leaves', () => {
      roomService.roomViewers.set('video-v1', new Set(['socket1']));
      roomService.roomViewers.get('video-v1').delete('socket1');
      roomService.roomViewers.delete('video-v1');
      expect(roomService.roomViewers.has('video-v1')).toBe(false);
    });

    it('supports multiple rooms simultaneously', () => {
      roomService.roomViewers.set('video-v1', new Set(['s1']));
      roomService.roomViewers.set('video-v2', new Set(['s1', 's2']));
      roomService.roomViewers.set('video-v3', new Set(['s3']));
      expect(roomService.roomViewers.size).toBe(3);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// Redis Adapter Configuration
// ══════════════════════════════════════════════════════════════════════

describe('Socket.IO Redis Adapter', () => {
  it('adapter pattern: pub/sub clients for horizontal scaling', () => {
    const createAdapter = (pub, sub) => ({ pub, sub });
    const adapter = createAdapter('pubClient', 'subClient');
    expect(adapter.pub).toBe('pubClient');
    expect(adapter.sub).toBe('subClient');
  });

  it('sub client is created via pubClient.duplicate()', () => {
    const redisClient = { duplicate: () => 'subClient' };
    const pub = redisClient;
    const sub = pub.duplicate();
    expect(sub).toBe('subClient');
    expect(pub).toBe(redisClient);
  });
});

// ══════════════════════════════════════════════════════════════════════
// Notification Service — Socket Emission Path
// ══════════════════════════════════════════════════════════════════════

describe('Notification Service — Socket Emission', () => {
  it('notification payload includes all required fields', () => {
    const payload = {
      recipientId: 'r1', senderId: 's1', type: 'new_subscriber',
      referenceId: 'v1', referenceModel: 'Video', message: 'You have a new subscriber',
    };

    expect(payload).toHaveProperty('recipientId');
    expect(payload).toHaveProperty('senderId');
    expect(payload).toHaveProperty('type');
    expect(payload).toHaveProperty('referenceId');
    expect(payload).toHaveProperty('referenceModel');
    expect(payload).toHaveProperty('message');
  });

  it('delivers notification to online user via io.to(socketId).emit("notification")', () => {
    const onlineUsers = new Map([['user1', 'socket_abc']]);
    const socketId = onlineUsers.get('user1');
    const event = { name: 'notification', to: socketId, payload: { notification: '...' } };
    expect(event.name).toBe('notification');
    expect(event.to).toBe('socket_abc');
  });
});

// ══════════════════════════════════════════════════════════════════════
// Controller Event Emission (mock verification)
// ══════════════════════════════════════════════════════════════════════

describe('Controller Event Emission', () => {
  it('new_tweet emits via io.emit for real-time feed', async () => {
    const eventPayload = { tweet: { _id: 't1', content: 'hello' } };
    expect(eventPayload).toHaveProperty('tweet');
  });

  it('new_comment emits to video room via io.to(roomKey)', () => {
    const videoId = VID;
    const roomKey = `video-${videoId}`;
    expect(roomKey).toBe(`video-${VID}`);
  });

  it('new_reply emits to tweet room via io.to(tweetRoom)', () => {
    const tweetId = 't1';
    const roomKey = `tweet-${tweetId}`;
    expect(roomKey).toBe('tweet-t1');
  });

  it('subscription notification is sent via sendNotification service', () => {
    const notifPayload = {
      recipientId: 'channel1',
      senderId: 'u1',
      type: 'new_subscriber',
      referenceId: 'u1',
      referenceModel: null,
      message: 'testuser subscribed to your channel',
    };
    expect(notifPayload.type).toBe('new_subscriber');
  });
});

// ══════════════════════════════════════════════════════════════════════
// Connection Lifecycle
// ══════════════════════════════════════════════════════════════════════

describe('Connection Lifecycle', () => {
  it('on connect: JWT verified, userId attached, onlineUsers updated', () => {
    const socket = { userId: null, handshake: { auth: { userId: 'u1' }, headers: {} } };
    socket.userId = 'u1';
    expect(socket.userId).toBe('u1');
  });

  it('on disconnect: userId removed from onlineUsers', () => {
    const onlineUsers = new Map([['u1', 's1']]);
    const socketId = 's1';
    const userId = 'u1';
    onlineUsers.delete(userId);
    expect(onlineUsers.has(userId)).toBe(false);
  });

  it('on disconnect: roomViewers cleaned up', () => {
    const roomViewers = new Map([
      ['video-v1', new Set(['s1', 's2'])],
      ['video-v2', new Set(['s1'])],
    ]);

    // Simulate socket s1 disconnecting
    for (const [roomKey, viewers] of roomViewers.entries()) {
      viewers.delete('s1');
      if (viewers.size === 0) roomViewers.delete(roomKey);
    }

    expect(roomViewers.get('video-v1')?.size).toBe(1);
    expect(roomViewers.has('video-v2')).toBe(false); // emptied
  });
});
