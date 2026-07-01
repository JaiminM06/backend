// @ts-check
import { test, expect } from '@playwright/test';
import {  } from './helpers.js';

// ─── Helpers ───────────────────────────────────────────────

/**
 * Parse set-cookie header value into Playwright cookie objects.
 */
function parseCookies(cookieHeader) {
  if (!cookieHeader) return [];
  return cookieHeader
    .split(/,(?=\s*\w+=)/)
    .map((c) => {
      const semicolonIdx = c.indexOf(';');
      const pair = (semicolonIdx > 0 ? c.substring(0, semicolonIdx) : c).trim();
      const eqIdx = pair.indexOf('=');
      if (eqIdx <= 0) return null;
      return {
        name: pair.substring(0, eqIdx).trim(),
        value: pair.substring(eqIdx + 1).trim(),
        domain: 'localhost',
        path: '/',
      };
    })
    .filter(Boolean);
}

/**
 * Register a user via API, set cookies on the page context, and return user data.
 * The caller should then call goTo() with the desired path.
 */
async function setupAuth(page, request) {
  const { user, cookies } = await registerUser(request);
  const parsed = parseCookies(cookies);
  if (parsed.length > 0) {
    await page.context().addCookies(parsed);
  }
  return user;
}

// ─── Channel Page ──────────────────────────────────────────

test.describe('Channel Page', () => {
  test('navigate to /youtube/channel/:username shows channel page', async ({ page, request }) => {
    const user = await setupAuth(page, request);
    await goTo(page, `/youtube/channel/${user.username}`);
    await expect(page.locator(`text=@${user.username}`)).toBeVisible();
    await expect(page.locator('text=Videos').first()).toBeVisible();
  });

  test('own channel shows Dashboard, Videos, and Settings buttons', async ({ page, request }) => {
    const user = await setupAuth(page, request);
    await goTo(page, `/youtube/channel/${user.username}`);
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Videos$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  });

  test('channel page displays video grid area', async ({ page, request }) => {
    const user = await setupAuth(page, request);
    await goTo(page, `/youtube/channel/${user.username}`);
    const videosTab = page.locator('text=Videos').first();
    await videosTab.click();
    const noVideosMsg = page.getByText('No videos uploaded yet.');
    const videoGrid = page.locator('.grid > article').first();
    await expect(noVideosMsg.or(videoGrid).first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Library Page ──────────────────────────────────────────

test.describe('Library Page', () => {
  test('library page at /youtube/library loads with Watch History and Liked Videos tabs', async ({ page, request }) => {
    await setupAuth(page, request);
    await goTo(page, '/youtube/library');
    await expect(page.locator('h1')).toContainText('Library');
    await expect(page.getByRole('button', { name: 'Watch History' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Liked Videos' })).toBeVisible();
  });

  test('library page requires authentication', async ({ page }) => {
    await page.goto('/youtube/library');
    await expectUrl(page, '/login');
  });
});

// ─── Settings Page ─────────────────────────────────────────

test.describe('Settings Page', () => {
  test('settings page at /youtube/settings has tabs: Profile Details, Change Password, Avatar & Cover', async ({ page, request }) => {
    await setupAuth(page, request);
    await goTo(page, '/youtube/settings');
    await expect(page.locator('h1')).toContainText('Account Settings');
    await expect(page.getByRole('button', { name: 'Profile Details' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Change Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Avatar & Cover' })).toBeVisible();
  });

  test('settings: Profile Details tab shows fullName and email fields', async ({ page, request }) => {
    await setupAuth(page, request);
    await goTo(page, '/youtube/settings');
    await page.getByRole('button', { name: 'Profile Details' }).click();
    await expect(page.locator('input[placeholder="John Doe"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();
  });

  test('settings: Change Password tab has old and new password fields', async ({ page, request }) => {
    await setupAuth(page, request);
    await goTo(page, '/youtube/settings');
    await page.getByRole('button', { name: 'Change Password' }).click();
    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs.nth(0)).toBeVisible();
    await expect(passwordInputs.nth(1)).toBeVisible();
    await expect(passwordInputs.nth(2)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update Password' })).toBeVisible();
  });

  test('settings: Avatar & Cover tab has file upload controls', async ({ page, request }) => {
    await setupAuth(page, request);
    await goTo(page, '/youtube/settings');
    await page.getByRole('button', { name: 'Avatar & Cover' }).click();
    await expect(page.locator('text=Profile Picture').first()).toBeVisible();
    await expect(page.locator('text=Banner Image').first()).toBeVisible();
    await expect(page.locator('#avatar-input')).toBeAttached();
    await expect(page.locator('#cover-input')).toBeAttached();
  });

  test('settings tabs are clickable and switch content', async ({ page, request }) => {
    await setupAuth(page, request);
    await goTo(page, '/youtube/settings');
    await page.getByRole('button', { name: 'Profile Details' }).click();
    await expect(page.locator('input[placeholder="John Doe"]')).toBeVisible();

    await page.getByRole('button', { name: 'Change Password' }).click();
    await expect(page.getByRole('button', { name: 'Update Password' })).toBeVisible();

    await page.getByRole('button', { name: 'Avatar & Cover' }).click();
    await expect(page.locator('text=Profile Picture').first()).toBeVisible();
  });
});

// ─── Sidebar User Display ──────────────────────────────────

test.describe('Sidebar User Display', () => {
  test('sidebar shows logged-in username after authentication', async ({ page, request }) => {
    const user = await setupAuth(page, request);
    await goTo(page, '/youtube/feed');
    await page.waitForSelector(`text=@${user.username}`, { timeout: 10000 });
    await expect(page.locator(`text=@${user.username}`)).toBeVisible();
  });
});
