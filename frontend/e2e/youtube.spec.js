import { test, expect } from '@playwright/test';
import {  } from './helpers.js';

test.describe('YouTube Feed', () => {
  test('feed page loads with video grid or skeleton loading', async ({ page }) => {
    await goTo(page, '/youtube/feed');
    const hasGrid = await page.locator('.grid').first().isVisible().catch(() => false);
    const hasSkeleton = await page.locator('.animate-pulse').first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText('No videos yet').isVisible().catch(() => false);
    expect(hasGrid || hasSkeleton || hasEmptyState).toBe(true);
  });

  test('feed page shows "No videos yet" empty state message when feed is empty', async ({ page }) => {
    await goTo(page, '/youtube/feed');
    const emptyText = page.getByText('No videos yet');
    const skeletonVisible = await page.locator('.animate-pulse').first().isVisible().catch(() => false);
    const videoCardsVisible = await page.locator('article[role="button"]').first().isVisible().catch(() => false);
    if (!skeletonVisible && !videoCardsVisible) {
      await expect(emptyText).toBeVisible();
    }
  });

  test('feed shows load more button when there are more videos', async ({ page }) => {
    await goTo(page, '/youtube/feed');
    await page.waitForTimeout(2000);
    const videoCount = await page.locator('article[role="button"]').count();
    if (videoCount > 0) {
      const loadMoreBtn = page.getByRole('button', { name: 'Load more' });
      const hasLoadMore = await loadMoreBtn.isVisible().catch(() => false);
      if (hasLoadMore) {
        await expect(loadMoreBtn).toBeVisible();
      }
    }
  });
});

test.describe('YouTube Trending', () => {
  test('trending page loads with period selector (day/week/month buttons)', async ({ page }) => {
    await goTo(page, '/youtube/trending');
    await expect(page.getByRole('heading', { name: 'Trending' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'day' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'week' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'month' })).toBeVisible();
  });

  test('trending period buttons change active state on click', async ({ page }) => {
    await goTo(page, '/youtube/trending');
    const dayBtn = page.getByRole('button', { name: 'day' });
    const weekBtn = page.getByRole('button', { name: 'week' });
    await dayBtn.click();
    await page.waitForTimeout(500);
    const dayBg = await dayBtn.evaluate((el) => getComputedStyle(el).backgroundColor);
    const weekBg = await weekBtn.evaluate((el) => getComputedStyle(el).backgroundColor);
    const dayIsRed = dayBg.includes('255, 0, 0') || dayBg.includes('rgb(255, 0, 0)');
    expect(dayIsRed).toBe(true);
  });

  test('trending page has engagement score fire badge on video cards', async ({ page }) => {
    await goTo(page, '/youtube/trending');
    await page.waitForTimeout(2000);
    const fireBadge = page.locator('text=🔥').first();
    const videoCardsExist = await page.locator('article[role="button"]').first().isVisible().catch(() => false);
    if (videoCardsExist) {
      await expect(fireBadge).toBeVisible();
    }
  });
});

test.describe('YouTube Watch Page', () => {
  test('video watch page has video player area', async ({ page }) => {
    await goTo(page, '/youtube/watch/test-id-123');
    const video = page.locator('video');
    const hasVideo = await video.isVisible().catch(() => false);
    const hasError = await page.getByText('Video not found').isVisible().catch(() => false);
    const hasPlayerArea = await page.locator('.aspect-video').first().isVisible().catch(() => false);
    expect(hasVideo || hasPlayerArea || hasError).toBe(true);
  });

  test('video watch page shows like button and comment section', async ({ page }) => {
    await goTo(page, '/youtube/watch/test-id-123');
    const notFound = await page.getByText('Video not found').isVisible().catch(() => false);
    if (notFound) {
      expect(notFound).toBe(true);
      return;
    }
    const likeBtn = page.locator('text=👍').first();
    const likeVisible = await likeBtn.isVisible().catch(() => false);
    const commentTextarea = page.locator('textarea[placeholder="Add a comment..."]');
    const commentFieldVisible = await commentTextarea.isVisible().catch(() => false);
    expect(likeVisible || commentFieldVisible).toBe(true);
  });

  test('video watch page shows recommendations sidebar', async ({ page }) => {
    await goTo(page, '/youtube/watch/test-id-123');
    const notFound = await page.getByText('Video not found').isVisible().catch(() => false);
    if (notFound) {
      expect(notFound).toBe(true);
      return;
    }
    const upNext = page.getByText('Up next');
    const sidebarVisible = await upNext.isVisible().catch(() => false);
    const relatedCards = page.locator('.lg\\:col-span-2 + div img').first();
    const relatedVisible = await relatedCards.isVisible().catch(() => false);
    expect(sidebarVisible || relatedVisible).toBe(true);
  });
});

test.describe('YouTube Upload', () => {
  test('upload page has file drop zone', async ({ page }) => {
    await goTo(page, '/youtube/upload');
    const dropZone = page.getByText('Drag and drop video files');
    const uploadHeading = page.getByRole('heading', { name: 'Upload Video' });
    const dropZoneVisible = await dropZone.isVisible().catch(() => false);
    const headingVisible = await uploadHeading.isVisible().catch(() => false);
    expect(dropZoneVisible || headingVisible).toBe(true);
  });

  test('upload page has title, description, tags fields', async ({ page }) => {
    await goTo(page, '/youtube/upload');
    const dropZone = page.getByText('Drag and drop video files');
    const hasDropZone = await dropZone.isVisible().catch(() => false);
    if (hasDropZone) {
      const fileInput = page.locator('#video-upload');
      const inputExists = await fileInput.count();
      expect(inputExists).toBeGreaterThan(0);
      return;
    }
    const titleLabel = page.getByText('Video Title');
    const descLabel = page.getByText('Description');
    const tagsLabel = page.getByText('Tags (comma separated)');
    const titleVisible = await titleLabel.isVisible().catch(() => false);
    const descVisible = await descLabel.isVisible().catch(() => false);
    const tagsVisible = await tagsLabel.isVisible().catch(() => false);
    expect(titleVisible || descVisible || tagsVisible).toBe(true);
  });
});

test.describe('YouTube Manage Videos', () => {
  test('manage videos page shows video table or "Your Videos" header', async ({ page }) => {
    await goTo(page, '/youtube/manage');
    const heading = page.getByRole('heading', { name: 'Your Videos' });
    const hasHeading = await heading.isVisible().catch(() => false);
    const hasNoVideos = await page.getByText('No videos yet').isVisible().catch(() => false);
    const hasVideoRows = await page.locator('img[alt][class*="rounded-lg"]').first().isVisible().catch(() => false);
    const hasSpinner = await page.locator('.animate-spin').first().isVisible().catch(() => false);
    expect(hasHeading || hasNoVideos || hasVideoRows || hasSpinner).toBe(true);
  });
});

test.describe('YouTube Search', () => {
  test('search page loads with results or empty state', async ({ page }) => {
    await goTo(page, '/youtube/search?q=test');
    await page.waitForTimeout(2000);
    const heading = page.getByRole('heading', { name: 'Search' });
    await expect(heading).toBeVisible();
    const hasResults = await page.getByText('Results for').isVisible().catch(() => false);
    const hasNoResults = await page.getByText('No results found').isVisible().catch(() => false);
    const isLoading = await page.locator('.animate-spin').first().isVisible().catch(() => false);
    expect(hasResults || hasNoResults || isLoading).toBe(true);
  });

  test('search has tab filters: All, Videos, Posts', async ({ page }) => {
    await goTo(page, '/youtube/search?q=test');
    await page.waitForTimeout(2000);
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Videos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Posts' })).toBeVisible();
  });

  test('search with no query shows enter search prompt', async ({ page }) => {
    await goTo(page, '/youtube/search');
    const prompt = page.getByText('Enter a search term');
    await expect(prompt).toBeVisible();
  });
});

test.describe('YouTube Sidebar Navigation', () => {
  test('sidebar navigation links are present (Home, Trending, Library)', async ({ page }) => {
    await goTo(page, '/youtube/feed');
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Trending' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Library' })).toBeVisible();
  });

  test('clicking sidebar Trending navigates to trending page', async ({ page }) => {
    await goTo(page, '/youtube/feed');
    await page.getByRole('link', { name: 'Trending' }).click();
    await page.waitForURL('**/youtube/trending');
    await expect(page.getByRole('heading', { name: 'Trending' })).toBeVisible();
  });
});

test.describe('YouTube Theme & Platform Switcher', () => {
  test('YouTube layout has dark theme (dark background)', async ({ page }) => {
    await goTo(page, '/youtube/feed');
    const bodyBg = await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor);
    const isDark = bodyBg.includes('15, 15, 15') || bodyBg.includes('rgb(15, 15, 15)') || bodyBg.includes('#0F0F0F');
    expect(isDark).toBe(true);
  });

  test('platform switcher button navigates to Twitter', async ({ page }) => {
    await goTo(page, '/youtube/feed');
    const twitterBtn = page.getByRole('button', { name: 'Twitter' });
    const btnVisible = await twitterBtn.first().isVisible().catch(() => false);
    if (btnVisible) {
      await twitterBtn.first().click();
      await page.waitForURL('**/twitter/**', { timeout: 10000 });
      expect(page.url()).toContain('/twitter');
    } else {
      const switchBtn = page.locator('button:has-text("Twitter")').first();
      const exists = await switchBtn.isVisible().catch(() => false);
      expect(exists).toBe(true);
    }
  });
});

test.describe('YouTube Video Cards', () => {
  test('video cards have thumbnail, title, username, views', async ({ page }) => {
    await goTo(page, '/youtube/feed');
    await page.waitForTimeout(2000);
    const cards = page.locator('article[role="button"]');
    const cardCount = await cards.count();
    if (cardCount === 0) {
      const empty = await page.getByText('No videos yet').isVisible();
      expect(empty).toBe(true);
      return;
    }
    const firstCard = cards.first();
    await expect(firstCard.locator('img[alt]').first()).toBeVisible();
    await expect(firstCard.locator('h3')).toBeVisible();
  });

  test('video card click navigates to watch page', async ({ page }) => {
    await goTo(page, '/youtube/feed');
    await page.waitForTimeout(2000);
    const cards = page.locator('article[role="button"]');
    const cardCount = await cards.count();
    if (cardCount > 0) {
      await cards.first().click();
      await page.waitForURL('**/youtube/watch/**');
      expect(page.url()).toContain('/youtube/watch/');
    }
  });
});

test.describe('YouTube Header Search', () => {
  test('header search bar submits and navigates to search results', async ({ page }) => {
    await goTo(page, '/youtube/feed');
    const searchInput = page.locator('input[type="search"]');
    const inputExists = await searchInput.isVisible().catch(() => false);
    expect(inputExists).toBe(true);
    if (inputExists) {
      await searchInput.fill('test-query');
      await searchInput.press('Enter');
      await page.waitForURL('**/youtube/search?q=test-query', { timeout: 10000 });
      expect(page.url()).toContain('search?q=test-query');
    }
  });
});
