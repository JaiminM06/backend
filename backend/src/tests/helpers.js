import { jest } from '@jest/globals';
import request from 'supertest';

/**
 * Test helpers for integration tests.
 * Use these with supertest to simplify auth and assertions.
 */

// The mocked JWT verifier accepts any token with this prefix
const VALID_TOKEN = 'valid-token';
const VID = '507f1f77bcf86cd799439011';
const VID2 = '507f1f77bcf86cd799439012';

/**
 * Returns supertest request with auth cookie set
 */
export function authReq(app) {
  return {
    get:    (url) => request(app).get(url).set('Cookie', `accessToken=${VALID_TOKEN}`),
    post:   (url) => request(app).post(url).set('Cookie', `accessToken=${VALID_TOKEN}`),
    put:    (url) => request(app).put(url).set('Cookie', `accessToken=${VALID_TOKEN}`),
    patch:  (url) => request(app).patch(url).set('Cookie', `accessToken=${VALID_TOKEN}`),
    delete: (url) => request(app).delete(url).set('Cookie', `accessToken=${VALID_TOKEN}`),
  };
}

/**
 * Standard assertions for ApiResponse success
 */
export function expectSuccess(res, status = 200) {
  expect(res.status).toBe(status);
  expect(res.body.success).toBe(true);
  expect(res.body.message).toBeDefined();
}

/**
 * Standard assertions for ApiResponse error
 */
export function expectError(res, status, messageContain) {
  expect(res.status).toBe(status);
  expect(res.body.success).toBe(false);
  if (messageContain) {
    expect(res.body.message).toContain(messageContain);
  }
}

/**
 * Sets up model mocks for a valid authenticated user lookup
 */
export async function mockAuthUser(overrides = {}) {
  const { User } = await import('../models/user.model.js');
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({
      _id: VID, username: 'testuser', email: 'test@test.com', fullName: 'Test User',
      ...overrides
    })
  });
}

/**
 * Sets up User.findOne to return a mock user
 */
export async function mockUserFound(overrides = {}) {
  const { User } = await import('../models/user.model.js');
  User.findOne.mockResolvedValue({
    _id: VID, username: 'testuser', email: 'test@test.com', fullName: 'Test User',
    isPasswordCorrect: jest.fn().mockResolvedValue(true),
    generateAccessToken: jest.fn().mockReturnValue('at'),
    generateRefreshToken: jest.fn().mockReturnValue('rt'),
    save: jest.fn().mockResolvedValue(true),
    ...overrides
  });
}

export { VALID_TOKEN, VID, VID2 };
