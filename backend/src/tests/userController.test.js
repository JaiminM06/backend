import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { setupTestMocks, createMockRes } from './setup.js';

let userController;
const TEST_USER_ID = '507f1f77bcf86cd799439011';

beforeAll(async () => {
  await setupTestMocks();
  userController = await import('../controllers/user.controller.js');
});

function makeReq(overrides = {}) {
  return { params: {}, query: {}, body: {}, files: {}, ...overrides };
}

function sel(val) {
  return { select: jest.fn().mockResolvedValue(val), then: (cb) => Promise.resolve(val).then(cb) };
}

const FILES = { avatar: [{ path: '/tmp/a.png' }], coverImage: [{ path: '/tmp/c.png' }] };

describe('User Controller — registerUser', () => {
  let User;
  beforeEach(async () => {
    ({ User } = await import('../models/user.model.js'));
  });

  it('returns 200 on success', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ _id: TEST_USER_ID });
    User.findById.mockReturnValue(sel({ _id: TEST_USER_ID, username: 'test', email: 'test@test.com', fullName: 'Test' }));
    const { res, next } = createMockRes();
    userController.registerUser(makeReq({ body: { fullName: 'Test', email: 'test@test.com', username: 'test', password: 'pass123456' }, files: FILES }), res, next);
    await new Promise(r => setImmediate(r));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 400 when fields are empty', async () => {
    const { res, next } = createMockRes();
    userController.registerUser(makeReq({ body: { fullName: '', email: '', username: '', password: '' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('returns 409 when duplicate', async () => {
    User.findOne.mockResolvedValue({ _id: 'existing' });
    const { res, next } = createMockRes();
    userController.registerUser(makeReq({ body: { fullName: 'Test', email: 'test@test.com', username: 'test', password: 'pass123456' }, files: FILES }), res, next);
    await new Promise(r => setImmediate(r));
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('returns 400 when avatar missing', async () => {
    User.findOne.mockResolvedValue(null);
    const { res, next } = createMockRes();
    userController.registerUser(makeReq({ body: { fullName: 'Test', email: 'test@test.com', username: 'test', password: 'pass123456' }, files: {} }), res, next);
    await new Promise(r => setImmediate(r));
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('User Controller — loginUser', () => {
  let User;
  beforeEach(async () => {
    ({ User } = await import('../models/user.model.js'));
  });

  it('returns 200 with tokens and cookies', async () => {
    const mockUser = { _id: TEST_USER_ID, username: 'test', email: 'test@test.com', isPasswordCorrect: jest.fn().mockResolvedValue(true), generateAccessToken: jest.fn().mockReturnValue('at'), generateRefreshToken: jest.fn().mockReturnValue('rt'), save: jest.fn().mockResolvedValue(true) };
    User.findOne.mockResolvedValue(mockUser);
    User.findById.mockReturnValue(sel({ _id: TEST_USER_ID, username: 'test', email: 'test@test.com', refreshToken: 'rt', generateAccessToken: jest.fn().mockReturnValue('at'), generateRefreshToken: jest.fn().mockReturnValue('rt'), save: jest.fn().mockResolvedValue(true) }));
    const { res, next } = createMockRes();
    userController.loginUser(makeReq({ body: { email: 'test@test.com', password: 'pass123456' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.cookie).toHaveBeenCalledWith('accessToken', 'at', expect.any(Object));
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'rt', expect.any(Object));
  });

  it('returns 400 when not found', async () => {
    User.findOne.mockResolvedValue(null);
    const { res, next } = createMockRes();
    userController.loginUser(makeReq({ body: { email: 'bad@test.com', password: 'pass' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('returns 401 when wrong password', async () => {
    User.findOne.mockResolvedValue({ _id: TEST_USER_ID, username: 'test', email: 'test@test.com', isPasswordCorrect: jest.fn().mockResolvedValue(false) });
    const { res, next } = createMockRes();
    userController.loginUser(makeReq({ body: { email: 'test@test.com', password: 'wrong' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('User Controller — logoutUser', () => {
  let User;
  beforeEach(async () => {
    ({ User } = await import('../models/user.model.js'));
  });

  it('returns 200 and clears cookies', async () => {
    User.findByIdAndUpdate.mockResolvedValue({ _id: TEST_USER_ID });
    const { res, next } = createMockRes();
    userController.logoutUser(makeReq({ user: { _id: TEST_USER_ID } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.clearCookie).toHaveBeenCalledWith('accessToken', expect.any(Object));
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
  });
});

describe('User Controller — refreshAccessToken', () => {
  let User;
  beforeEach(async () => {
    ({ User } = await import('../models/user.model.js'));
  });

  it('returns 200 with new tokens', async () => {
    User.findById.mockResolvedValue({ _id: TEST_USER_ID, refreshToken: 'token', generateAccessToken: jest.fn().mockReturnValue('new-at'), generateRefreshToken: jest.fn().mockReturnValue('new-rt'), save: jest.fn().mockResolvedValue(true) });
    const { res, next } = createMockRes();
    userController.refreshAccessToken(makeReq({ cookies: { refreshToken: 'token' }, body: {} }), res, next);
    await new Promise(r => setImmediate(r));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 401 when no token', async () => {
    const { res, next } = createMockRes();
    userController.refreshAccessToken(makeReq({ cookies: {}, body: {} }), res, next);
    await new Promise(r => setImmediate(r));
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('User Controller — changeCurrentPassword', () => {
  let User;
  beforeEach(async () => {
    ({ User } = await import('../models/user.model.js'));
  });

  it('returns 200 on success', async () => {
    User.findById.mockResolvedValue({ _id: TEST_USER_ID, isPasswordCorrect: jest.fn().mockResolvedValue(true), save: jest.fn().mockResolvedValue(true) });
    const { res, next } = createMockRes();
    userController.changeCurrentPassword(makeReq({ user: { _id: TEST_USER_ID }, body: { oldPassword: 'old', newPassword: 'new123456' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 400 when old password wrong', async () => {
    User.findById.mockResolvedValue({ _id: TEST_USER_ID, isPasswordCorrect: jest.fn().mockResolvedValue(false) });
    const { res, next } = createMockRes();
    userController.changeCurrentPassword(makeReq({ user: { _id: TEST_USER_ID }, body: { oldPassword: 'wrong', newPassword: 'new' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('User Controller — getCurrentUser', () => {
  let User;
  beforeEach(async () => {
    ({ User } = await import('../models/user.model.js'));
  });

  it('returns 200 with user', async () => {
    User.findById.mockReturnValue(sel({ _id: TEST_USER_ID, username: 'test' }));
    const { res, next } = createMockRes();
    userController.getCurrentUser(makeReq({ user: { _id: TEST_USER_ID } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('User Controller — updateAccountDetails', () => {
  let User;
  beforeEach(async () => {
    ({ User } = await import('../models/user.model.js'));
  });

  it('returns 200 on success', async () => {
    User.findByIdAndUpdate.mockReturnValue(sel({ _id: TEST_USER_ID, fullName: 'New', email: 'new@test.com' }));
    const { res, next } = createMockRes();
    userController.updateAccountDetails(makeReq({ user: { _id: TEST_USER_ID }, body: { fullName: 'New', email: 'new@test.com' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 400 when no fields', async () => {
    const { res, next } = createMockRes();
    userController.updateAccountDetails(makeReq({ user: { _id: TEST_USER_ID }, body: {} }), res, next);
    await new Promise(r => setImmediate(r));
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('User Controller — updateUserAvatar', () => {
  let User;
  beforeEach(async () => {
    ({ User } = await import('../models/user.model.js'));
  });

  it('returns 200 on success', async () => {
    User.findByIdAndUpdate.mockReturnValue(sel({ _id: TEST_USER_ID, avatar: 'url' }));
    const { res, next } = createMockRes();
    userController.updateUserAvatar(makeReq({ user: { _id: TEST_USER_ID }, file: { path: '/tmp/a.png' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 400 when no file', async () => {
    const { res, next } = createMockRes();
    userController.updateUserAvatar(makeReq({ user: { _id: TEST_USER_ID }, file: null }), res, next);
    await new Promise(r => setImmediate(r));
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('User Controller — updateUserCoverImage', () => {
  let User;
  beforeEach(async () => {
    ({ User } = await import('../models/user.model.js'));
  });

  it('returns 200 on success', async () => {
    User.findByIdAndUpdate.mockReturnValue(sel({ _id: TEST_USER_ID, coverImage: 'url' }));
    const { res, next } = createMockRes();
    userController.updateUserCoverImage(makeReq({ user: { _id: TEST_USER_ID }, file: { path: '/tmp/c.png' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('User Controller — getUserChannelProfile', () => {
  let User;
  beforeEach(async () => {
    ({ User } = await import('../models/user.model.js'));
  });

  it('returns 200 with profile', async () => {
    User.aggregate.mockResolvedValue([{ _id: TEST_USER_ID, username: 'test', fullName: 'Test', subscribersCount: 5, isSubscribed: false }]);
    const { res, next } = createMockRes();
    userController.getUserChannelProfile(makeReq({ params: { username: 'test' }, user: { _id: TEST_USER_ID } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when not found', async () => {
    User.aggregate.mockResolvedValue([]);
    const { res, next } = createMockRes();
    userController.getUserChannelProfile(makeReq({ params: { username: 'nobody' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('User Controller — getWatchHistory', () => {
  let WatchHistory;
  beforeEach(async () => {
    ({ default: WatchHistory } = await import('../models/watchHistory.model.js'));
  });

  it('returns 200', async () => {
    WatchHistory.find.mockReturnValue({ sort: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), populate: jest.fn().mockReturnThis(), then: (cb) => Promise.resolve([]).then(cb) });
    const { res, next } = createMockRes();
    userController.getWatchHistory(makeReq({ user: { _id: TEST_USER_ID } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('User Controller — getUserById', () => {
  let User;
  beforeEach(async () => {
    ({ User } = await import('../models/user.model.js'));
  });

  it('returns 200 with user', async () => {
    User.findById.mockReturnValue(sel({ _id: TEST_USER_ID, username: 'test', email: 'test@test.com' }));
    const { res, next } = createMockRes();
    userController.getUserById(makeReq({ params: { userid: TEST_USER_ID } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 400 when invalid id', async () => {
    const { res, next } = createMockRes();
    userController.getUserById(makeReq({ params: { userid: 'invalid' } }), res, next);
    await new Promise(r => setImmediate(r));
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
