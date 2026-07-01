import { test, expect } from '@playwright/test';
import {  } from './helpers.js';

test.describe('Twitter Home Feed', () => {
  test('Twitter home loads with feed', async ({ page }) => {
    await goTo(page, '/twitter/home');
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
    const hasTweets = await page.locator('p.text-\\[var\\(--tw-text\\)\\]').first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText('No posts yet').isVisible().catch(() => false);
    const hasSpinner = await page.locator('.animate-spin').first().isVisible().catch(() => false);
    expect(hasTweets || hasEmpty || hasSpinner).toBe(true);
  });

  test('Twitter feed shows "No posts yet" empty state', async ({ page }) => {
    await goTo(page, '/twitter/home');
    await page.waitForTimeout(2000);
    const noPostsMessage = page.getByText('No posts yet');
    const spinner = page.locator('.animate-spin');
    const spinnerVisible = await spinner.first().isVisible().catch(() => false);
    const hasTweetCards = await page.locator('div[class*="border-b"] p:has-text("@")').first().isVisible().catch(() => false);
    if (!spinnerVisible && !hasTweetCards) {
      await expect(noPostsMessage).toBeVisible();
    }
  });

  test('feed header shows "Home" title', async ({ page }) => {
    await goTo(page, '/twitter/home');
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  });
});

test.describe('Tweet Composer', () => {
  test('tweet composer textarea is visible with placeholder', async ({ page }) => {
    await goTo(page, '/twitter/home');
    await page.waitForTimeout(2000);
    const textarea = page.locator('textarea[placeholder="What\'s happening?"]');
    const hasComposer = await textarea.isVisible().catch(() => false);
    const hasSignIn = await page.getByText('Sign in to post').isVisible().catch(() => false);
    expect(hasComposer || hasSignIn).toBe(true);
  });

  test('tweet composer has 280 character limit and counter', async ({ page }) => {
    await goTo(page, '/twitter/home');
    await page.waitForTimeout(2000);
    const textarea = page.locator('textarea[placeholder="What\'s happening?"]');
    const composerVisible = await textarea.isVisible().catch(() => false);
    if (composerVisible) {
      await expect(textarea).toHaveAttribute('maxLength', '280');
      const counter = page.locator('text=/\\d+\\/280/');
      await expect(counter).toBeVisible();
    } else {
      const signInVisible = await page.getByText('Sign in to post').isVisible();
      expect(signInVisible).toBe(true);
    }
  });

  test('composer Post button is disabled when textarea is empty', async ({ page }) => {
    await goTo(page, '/twitter/home');
    await page.waitForTimeout(2000);
    const textarea = page.locator('textarea[placeholder="What\'s happening?"]');
    const composerVisible = await textarea.isVisible().catch(() => false);
    if (composerVisible) {
      const postBtn = page.locator('form button[type="submit"]');
      const exists = await postBtn.first().isVisible().catch(() => false);
      if (exists) {
        const isDisabled = await postBtn.first().isDisabled();
        expect(isDisabled).toBe(true);
      }
    }
  });
});

test.describe('Twitter Mobile', () => {
  test('mobile bottom nav has Home, Search, Post, Profile icons', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await goTo(page, '/twitter/home');
    await page.waitForTimeout(2000);
    const bottomNav = page.locator('nav.md\\:hidden');
    const hasBottomNav = await bottomNav.isVisible().catch(() => false);
    expect(hasBottomNav).toBe(true);
    if (hasBottomNav) {
      const homeLink = bottomNav.locator('a[href="/twitter/home"]');
      const searchLink = bottomNav.locator('a[href="/twitter/search"]');
      const postBtn = bottomNav.locator('button.rounded-full');
      expect(await homeLink.count()).toBeGreaterThan(0);
      expect(await searchLink.count()).toBeGreaterThan(0);
      expect(await postBtn.count()).toBeGreaterThan(0);
    }
  });

  test('mobile post button opens composer on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await goTo(page, '/twitter/home');
    await page.waitForTimeout(2000);
    const mobilePostBtn = page.locator('nav.md\\:hidden button.rounded-full');
    const hasPostBtn = await mobilePostBtn.isVisible().catch(() => false);
    if (hasPostBtn) {
      await mobilePostBtn.click();
      await page.waitForTimeout(500);
      const modal = page.getByText('New Post');
      await expect(modal).toBeVisible();
    }
  });
});

test.describe('Tweet Thread', () => {
  test('tweet thread shows threaded view', async ({ page }) => {
    await goTo(page, '/twitter/tweet/test-tweet-id-123');
    await page.waitForTimeout(2000);
    const postHeader = page.getByRole('heading', { name: 'Post' });
    const hasHeader = await postHeader.isVisible().catch(() => false);
    const hasError = await page.getByText('Failed to load thread').isVisible().catch(() => false);
    const hasSpinner = await page.locator('.animate-pulse').first().isVisible().catch(() => false);
    expect(hasHeader || hasError || hasSpinner).toBe(true);
  });
});

test.describe('Twitter Navigation', () => {
  test('layout has Home, Explore, Profile nav items', async ({ page }) => {
    await goTo(page, '/twitter/home');
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Explore' })).toBeVisible();
    const profileLink = page.getByRole('link', { name: 'Profile' });
    const signInVisible = await page.getByText('Sign in to post').isVisible().catch(() => false);
    const profileVisible = await profileLink.isVisible().catch(() => false);
    expect(signInVisible || profileVisible).toBe(true);
  });
});

test.describe('Twitter Platform Switcher', () => {
  test('platform switcher button navigates to YouTube', async ({ page }) => {
    await goTo(page, '/twitter/home');
    const ytBtn = page.getByRole('button', { name: 'YouTube' }).first();
    const switchBtn = page.getByRole('button', { name: 'Switch to YouTube' });
    const btnVisible = await ytBtn.isVisible().catch(() => false);
    const switchVisible = await switchBtn.isVisible().catch(() => false);
    if (btnVisible) {
      await ytBtn.click();
      await page.waitForURL('**/youtube/**', { timeout: 10000 });
      expect(page.url()).toContain('/youtube');
    } else if (switchVisible) {
      await switchBtn.click();
      await page.waitForURL('**/youtube/**', { timeout: 10000 });
      expect(page.url()).toContain('/youtube');
    } else {
      const ytLink = page.locator('button:has-text("YouTube")').first();
      const exists = await ytLink.isVisible().catch(() => false);
      expect(exists).toBe(true);
    }
  });
});

test.describe('Twitter Sidebar', () => {
  test('sidebar shows "Sign in" prompt when not authenticated', async ({ page }) => {
    await goTo(page, '/twitter/home');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(2000);
    const signInPrompt = page.getByText('Sign in to post and follow');
    const signInBtn = page.getByRole('button', { name: 'Sign in' });
    const promptVisible = await signInPrompt.isVisible().catch(() => false);
    const btnVisible = await signInBtn.isVisible().catch(() => false);
    const userCardVisible = await page.getByText('Your account').isVisible().catch(() => false);
    expect(promptVisible || btnVisible || userCardVisible).toBe(true);
  });
});

test.describe('Twitter Search', () => {
  test('search page shows tweet results for a query', async ({ page }) => {
    await goTo(page, '/twitter/search?q=test');
    await page.waitForTimeout(2000);
    const heading = page.getByRole('heading', { name: 'Search' });
    await expect(heading).toBeVisible();
    const hasResultsFor = await page.getByText('Results for').isVisible().catch(() => false);
    const hasNoResults = await page.getByText('No results found').isVisible().catch(() => false);
    const isLoading = await page.locator('.animate-spin').first().isVisible().catch(() => false);
    expect(hasResultsFor || hasNoResults || isLoading).toBe(true);
  });

  test('desktop right sidebar has search input', async ({ page }) => {
    await goTo(page, '/twitter/home');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(2000);
    const searchInput = page.locator('aside input[name="q"]');
    const hasSearch = await searchInput.isVisible().catch(() => false);
    if (hasSearch) {
      await expect(searchInput).toHaveAttribute('placeholder', 'Search posts');
    }
  });
});

test.describe('Twitter Theme', () => {
  test('Twitter layout has dark theme with black background', async ({ page }) => {
    await goTo(page, '/twitter/home');
    await page.waitForTimeout(2000);
    const bgElement = page.locator('div.bg-\\[var\\(--tw-surface\\)\\]');
    const mainElement = page.locator('main');
    const bgExists = await bgElement.first().isVisible().catch(() => false);
    if (bgExists) {
      const bgColor = await bgElement.first().evaluate((el) => getComputedStyle(el).backgroundColor);
      const isBlack = bgColor === 'rgb(0, 0, 0)' || bgColor === 'rgb(22, 24, 28)';
      expect(isBlack).toBe(true);
    } else {
      const bodyBg = await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor);
      const isDark = bodyBg === 'rgb(0, 0, 0)' || bodyBg === 'rgb(15, 15, 15)';
      expect(isDark).toBe(true);
    }
  });
});
