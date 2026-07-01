import { expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:8000';

/**
 * Registers a new user via API and retrieves auth cookies.
 */
async function registerUser(request, userData = {}) {
  const defaults = {
    fullName: 'E2E Test User',
    email: `e2e_${Date.now()}@test.com`,
    username: `e2euser_${Date.now()}`,
    password: 'E2EPass123!',
  };
  const data = { ...defaults, ...userData };
  const res = await request.post(`${API_URL}/api/v1/users/register`, { data });
  return { user: data, status: res.status(), cookies: res.headers()['set-cookie'] };
}

/**
 * Logs in via API and returns auth cookies.
 */
async function loginUser(request, email, password) {
  const res = await request.post(`${API_URL}/api/v1/users/login`, {
    data: { email, password },
  });
  const cookies = res.headers()['set-cookie'] || '';
  return { status: res.status(), cookies };
}

/**
 * Navigates to a page and waits for it to be ready.
 */
async function goTo(page, path) {
  await page.goto(`${BASE_URL}${path}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Asserts that the current page URL contains the given path.
 */
async function expectUrl(page, path) {
  await expect(page).toHaveURL(new RegExp(path));
}

/**
 * Fills a form field by label text.
 */
async function fillByLabel(page, label, value) {
  const field = page.getByLabel(label, { exact: false });
  await field.fill(value);
}

/**
 * Clicks a button by its accessible name.
 */
async function clickButton(page, name) {
  await page.getByRole('button', { name }).click();
}

/**
 * Clicks a link by its accessible name.
 */
async function clickLink(page, name) {
  await page.getByRole('link', { name }).click();
}

/**
 * Waits for a toast/notification message and returns its text.
 */
async function waitForToast(page) {
  const toast = page.locator('[role="status"], .toast, .flash-message').first();
  await toast.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  return toast;
}

/**
 * Takes a named screenshot for debugging.
 */
async function screenshot(page, name) {
  await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true });
}

export {
  BASE_URL,
  API_URL,
  registerUser,
  loginUser,
  goTo,
  expectUrl,
  fillByLabel,
  clickButton,
  clickLink,
  waitForToast,
  screenshot,
};
