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

function mockFindByIdChain(resolvedValue) {
  return {
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(resolvedValue),
    then: (resolve) => resolve(resolvedValue),
  };
}

function mockFindChain(resolvedValue = []) {
  return {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(resolvedValue),
    then: (resolve) => resolve(resolvedValue),
  };
}

const AUTH_COOKIE = 'accessToken=valid-token';
const OTHER_ID = '507f1f77bcf86cd799439012';
const PLAYLIST_ID = '000000000000000000000001';
const VIDEO_ID = '000000000000000000000002';

const mockPlaylist = {
  _id: PLAYLIST_ID,
  name: 'Favorites',
  description: 'My favorite videos',
  owner: { _id: VID, toString: () => VID },
  videos: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Playlist API', () => {

  describe('POST /api/v1/playlists', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/playlists')
        .send({ name: 'Favorites', description: 'My favorite videos' });
      expect(res.status).toBe(401);
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/playlists')
        .set('Cookie', AUTH_COOKIE)
        .send({ description: 'My favorite videos' });
      expect(res.status).toBe(400);
    });

    it('returns 200 with created playlist when authenticated', async () => {
      const { Playlist } = await import('../models/playlist.model.js');
      Playlist.create.mockResolvedValue({
        _id: PLAYLIST_ID,
        name: 'Favorites',
        description: 'My favorite videos',
        owner: VID,
        videos: [],
      });

      const res = await request(app)
        .post('/api/v1/playlists')
        .set('Cookie', AUTH_COOKIE)
        .send({ name: 'Favorites', description: 'My favorite videos' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('created');
      expect(res.body.data.name).toBe('Favorites');
    });
  });

  describe('GET /api/v1/playlists/user/:userId', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .get(`/api/v1/playlists/user/${VID}`);
      expect(res.status).toBe(401);
    });

    it('returns 200 with user playlists when authenticated', async () => {
      const { User } = await import('../models/user.model.js');
      User.findById.mockReturnValue(mockFindByIdChain({
        _id: VID,
        username: 'testuser',
      }));

      const { Playlist } = await import('../models/playlist.model.js');
      Playlist.find.mockReturnValue(mockFindChain([mockPlaylist]));

      const res = await request(app)
        .get(`/api/v1/playlists/user/${VID}`)
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/playlists/:playlistId', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .get(`/api/v1/playlists/${PLAYLIST_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 200 with playlist when authenticated', async () => {
      const { Playlist } = await import('../models/playlist.model.js');
      Playlist.findById.mockResolvedValue(mockPlaylist);

      const res = await request(app)
        .get(`/api/v1/playlists/${PLAYLIST_ID}`)
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Favorites');
    });

    it('returns 404 when playlist does not exist', async () => {
      const { Playlist } = await import('../models/playlist.model.js');
      Playlist.findById.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/playlists/${PLAYLIST_ID}`)
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/playlists/:playlistId', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .patch(`/api/v1/playlists/${PLAYLIST_ID}`)
        .send({ name: 'Updated' });
      expect(res.status).toBe(401);
    });

    it('returns 403 when not the playlist owner', async () => {
      const { Playlist } = await import('../models/playlist.model.js');
      Playlist.findById.mockResolvedValue({
        ...mockPlaylist,
        owner: { _id: OTHER_ID, toString: () => OTHER_ID },
      });

      const res = await request(app)
        .patch(`/api/v1/playlists/${PLAYLIST_ID}`)
        .set('Cookie', AUTH_COOKIE)
        .send({ name: 'Updated', description: 'New desc' });
      expect(res.status).toBe(403);
    });

    it('returns 200 when playlist is updated', async () => {
      const { Playlist } = await import('../models/playlist.model.js');
      Playlist.findById.mockResolvedValue({
        ...mockPlaylist,
        owner: { _id: VID, toString: () => VID },
      });
      Playlist.findByIdAndUpdate.mockResolvedValue({
        ...mockPlaylist,
        name: 'Updated',
        description: 'New desc',
      });

      const res = await request(app)
        .patch(`/api/v1/playlists/${PLAYLIST_ID}`)
        .set('Cookie', AUTH_COOKIE)
        .send({ name: 'Updated', description: 'New desc' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated');
    });
  });

  describe('DELETE /api/v1/playlists/:playlistId', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .delete(`/api/v1/playlists/${PLAYLIST_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 403 when not the playlist owner', async () => {
      const { Playlist } = await import('../models/playlist.model.js');
      Playlist.findById.mockResolvedValue({
        ...mockPlaylist,
        owner: { _id: OTHER_ID, toString: () => OTHER_ID },
      });

      const res = await request(app)
        .delete(`/api/v1/playlists/${PLAYLIST_ID}`)
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(403);
    });

    it('returns 200 when playlist is deleted', async () => {
      const { Playlist } = await import('../models/playlist.model.js');
      Playlist.findById.mockResolvedValue({
        ...mockPlaylist,
        owner: { _id: VID, toString: () => VID },
      });
      Playlist.findByIdAndDelete.mockResolvedValue({
        ...mockPlaylist,
        name: 'Favorites',
      });

      const res = await request(app)
        .delete(`/api/v1/playlists/${PLAYLIST_ID}`)
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted');
    });
  });

  describe('PATCH /api/v1/playlists/add/:videoId/:playlistId', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .patch(`/api/v1/playlists/add/${VIDEO_ID}/${PLAYLIST_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 403 when not the playlist owner', async () => {
      const { Playlist } = await import('../models/playlist.model.js');
      Playlist.findById.mockResolvedValue({
        ...mockPlaylist,
        owner: { _id: OTHER_ID, toString: () => OTHER_ID },
      });

      const res = await request(app)
        .patch(`/api/v1/playlists/add/${VIDEO_ID}/${PLAYLIST_ID}`)
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(403);
    });

    it('returns 200 when video is added to playlist', async () => {
      const { Playlist } = await import('../models/playlist.model.js');
      Playlist.findById.mockResolvedValue({
        ...mockPlaylist,
        owner: { _id: VID, toString: () => VID },
      });
      Playlist.findByIdAndUpdate.mockResolvedValue({
        ...mockPlaylist,
        videos: [VIDEO_ID],
      });

      const res = await request(app)
        .patch(`/api/v1/playlists/add/${VIDEO_ID}/${PLAYLIST_ID}`)
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('add');
    });
  });

  describe('PATCH /api/v1/playlists/remove/:videoId/:playlistId', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .patch(`/api/v1/playlists/remove/${VIDEO_ID}/${PLAYLIST_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 403 when not the playlist owner', async () => {
      const { Playlist } = await import('../models/playlist.model.js');
      Playlist.findById.mockResolvedValue({
        ...mockPlaylist,
        owner: { _id: OTHER_ID, toString: () => OTHER_ID },
      });

      const res = await request(app)
        .patch(`/api/v1/playlists/remove/${VIDEO_ID}/${PLAYLIST_ID}`)
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(403);
    });

    it('returns 200 when video is removed from playlist', async () => {
      const { Playlist } = await import('../models/playlist.model.js');
      Playlist.findById.mockResolvedValue({
        ...mockPlaylist,
        owner: { _id: VID, toString: () => VID },
        videos: [VIDEO_ID],
      });
      Playlist.findByIdAndUpdate.mockResolvedValue({
        ...mockPlaylist,
        name: 'Favorites',
        videos: [],
      });

      const res = await request(app)
        .patch(`/api/v1/playlists/remove/${VIDEO_ID}/${PLAYLIST_ID}`)
        .set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('removed');
    });
  });
});
