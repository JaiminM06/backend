// @ts-check
import { test, expect } from '@playwright/test';
import {  } from './helpers.js';

// ─── Landing Page ──────────────────────────────────────────

test.describe('Landing Page', () => {
  test('landing page loads at /', async ({ page }) => {
    await goTo(page, '/');
    await expect(page).toHaveTitle(/MediaVerse/);
    await expect(page.locator('text=Your Universe of').first()).toBeVisible();
  });

  test('landing page shows "Enter YouTube" and "Enter Twitter" buttons', async ({ page }) => {
    await goTo(page, '/');
    const enterYoutube = page.getByRole('button', { name: /Enter YouTube/i });
    const enterTwitter = page.getByRole('button', { name: /Enter Twitter/i });
    await expect(enterYoutube).toBeVisible();
    await expect(enterTwitter).toBeVisible();
  });

  test('landing page "Sign In" nav link navigates to /login', async ({ page }) => {
    await goTo(page, '/');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expectUrl(page, '/login');
  });
});

// ─── Login Page ────────────────────────────────────────────

test.describe('Login Page', () => {
  test('login page loads at /login with form visible', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/MediaVerse/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    const passwordField = page.locator('input[placeholder="Enter your password"]');
    await expect(passwordField).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('login with invalid credentials shows error message', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('invalid@nonexistent.com');
    await page.locator('input[placeholder="Enter your password"]').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.locator('.text-red-400').first()).toBeVisible({ timeout: 10000 });
  });

  test('login with valid credentials redirects to /youtube/feed', async ({ page, request }) => {
    const { user } = await registerUser(request);
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(user.email);
    await page.locator('input[placeholder="Enter your password"]').fill(user.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expectUrl(page, '/youtube/feed');
  });

  test('login page has link to register page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /Create Account/i }).click();
    await expectUrl(page, '/register');
  });
});

// ─── Register Page ─────────────────────────────────────────

test.describe('Register Page', () => {
  test('register page loads at /register with form inputs', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveTitle(/MediaVerse/);
    await expect(page.locator('input[placeholder="John Doe"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[placeholder="johndoe"]')).toBeVisible();
    const passwordField = page.locator('input[placeholder="Create a strong password"]');
    await expect(passwordField).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Account/i })).toBeVisible();
  });

  test('register returns to login on success', async ({ page }) => {
    const timestamp = Date.now();
    await page.goto('/register');
    await page.locator('input[placeholder="John Doe"]').fill('E2E Register Test');
    await page.locator('input[type="email"]').fill(`e2e_reg_${timestamp}@test.com`);
    await page.locator('input[placeholder="johndoe"]').fill(`e2euser_${timestamp}`);
    await page.locator('input[placeholder="Create a strong password"]').fill('E2EPass123!');
    await page.getByRole('button', { name: /Create Account/i }).click();
    await expect(page.locator('text=Redirecting to login').first()).toBeVisible({ timeout: 10000 });
    await expectUrl(page, '/login');
  });

  test('register page has link to login page', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('link', { name: /Sign In/i }).click();
    await expectUrl(page, '/login');
  });
});

// ─── Protected Routes ──────────────────────────────────────

test.describe('Protected Routes', () => {
  test('/youtube/upload redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/youtube/upload');
    await expectUrl(page, '/login');
  });

  test('/youtube/dashboard redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/youtube/dashboard');
    await expectUrl(page, '/login');
  });

  test('/youtube/settings redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/youtube/settings');
    await expectUrl(page, '/login');
  });
});

// ─── Logout ────────────────────────────────────────────────

test.describe('Logout', () => {
  test('logout via channel page clears session and redirects to /login', async ({ page, request }) => {
    const { user } = await registerUser(request);
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(user.email);
    await page.locator('input[placeholder="Enter your password"]').fill(user.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expectUrl(page, '/youtube/feed');

    await page.goto(`/youtube/channel/${user.username}`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Logout/i }).click();
    await expectUrl(page, '/login');
  });
});

// ─── Navbar Links ──────────────────────────────────────────

test.describe('Navbar Links', () => {
  test('header Sign In navigates to /login', async ({ page }) => {
    await goTo(page, '/');
    const signInBtn = page.locator('.landing-nav__cta');
    await signInBtn.click();
    await expectUrl(page, '/login');
  });
});
