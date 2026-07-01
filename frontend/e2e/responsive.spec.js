import { test, expect } from '@playwright/test';

// ── Viewport definitions ──────────────────────────────────────────────────
const MOBILE  = { width: 375, height: 812 };
const TABLET  = { width: 768, height: 1024 };
const DESKTOP = { width: 1280, height: 720 };

// ── Shared helpers ───────────────────────────────────────────────────────
const feedTitle = (page) =>
  page.locator('text=MediaVerse').first();

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                        MOBILE   (375 × 812)                              ║
// ╚══════════════════════════════════════════════════════════════════════════╝
test.describe('Mobile — 375 × 812', () => {

  test('YouTube sidebar is off-screen (collapsed / hamburger-driven)', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/youtube/feed');

    // The sidebar is fixed and translated off-screen on mobile
    const sidebar = page.locator('aside').first();
    await expect(sidebar).not.toBeVisible();

    // header hamburger button opens it
    const hamburger = page.locator('header button:has(svg)').first();
    await expect(hamburger).toBeVisible();
  });

  test('YouTube sidebar toggle button visible in mobile header', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/youtube/feed');

    // Mobile header has a <button> containing a Menu (hamburger) SVG
    const headerMenu = page.locator('header').locator('svg.lucide-menu').first();
    await expect(headerMenu).toBeVisible();
  });

  test('Twitter bottom navigation bar visible', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/twitter/home');

    // The bottom nav is hidden on md+ using "md:hidden" – on mobile it is visible
    const bottomNav = page.locator('nav.md\\:hidden').first();
    await expect(bottomNav).toBeVisible();

    // Specific icons: Home, Search, User, Feather (post)
    await expect(bottomNav.locator('a, button').first()).toBeVisible();
    await expect(bottomNav.locator('svg.lucide-home').first()).toBeVisible();
    await expect(bottomNav.locator('svg.lucide-search').first()).toBeVisible();
    await expect(bottomNav.locator('svg.lucide-feather').first()).toBeVisible();
    await expect(bottomNav.locator('svg.lucide-user').first()).toBeVisible();
  });

  test('Twitter floating post FAB button visible on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/twitter/home');

    // The bottom nav contains a circular button with Feather icon (post)
    const fab = page.locator('nav.md\\:hidden button svg.lucide-feather').first();
    await expect(fab).toBeVisible();
  });

  test('YouTube search is visible in mobile header', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/youtube/feed');

    const searchInput = page.locator('header input[type="search"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('navigation between platforms works on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);

    // YouTube → Twitter via header toggle button
    await page.goto('/youtube/feed');
    const ytSwitch = page.locator('button:has-text("Twitter")').first();
    await expect(ytSwitch).toBeVisible();
    await ytSwitch.click();
    await expect(page).toHaveURL(/\/twitter/);

    // Twitter → YouTube via header toggle button
    const twSwitch = page.locator('button:has-text("YouTube")').first();
    await expect(twSwitch).toBeVisible();
    await twSwitch.click();
    await expect(page).toHaveURL(/\/youtube/);
  });
});

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                        TABLET  (768 × 1024)                              ║
// ╚══════════════════════════════════════════════════════════════════════════╝
test.describe('Tablet — 768 × 1024', () => {

  test('YouTube sidebar is visible in collapsed (icon-only) state', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await page.goto('/youtube/feed');

    // On tablet the sidebar should be visible (md:static and not translate-off-screen)
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();

    // Collapsed sidebar has w-[72px] (compact) – labels are hidden
    // The toggle button with Menu icon should be visible
    const toggle = sidebar.locator('button svg.lucide-menu').first();
    await expect(toggle).toBeVisible();
  });

  test('Twitter shows 2-column layout (left rail + center content)', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await page.goto('/twitter/home');

    // Left rail visible (hidden only below md)
    const leftRail = page.locator('aside.hidden.md\\:flex').first();
    await expect(leftRail).toBeVisible();

    // Center content is the main column
    const main = page.locator('main').first();
    await expect(main).toBeVisible();

    // Right sidebar should NOT be visible (only on lg)
    const rightSidebar = page.locator('aside.lg\\:flex').first();
    await expect(rightSidebar).not.toBeVisible();
  });

  test('YouTube search bar visible in top navbar', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await page.goto('/youtube/feed');

    const searchInput = page.locator('header input[type="search"]').first();
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', 'Search videos...');
  });

  test('navigation between platforms works on tablet', async ({ page }) => {
    await page.setViewportSize(TABLET);

    await page.goto('/youtube/feed');
    const ytSwitch = page.locator('button:has-text("Twitter")').first();
    await expect(ytSwitch).toBeVisible();
    await ytSwitch.click();
    await expect(page).toHaveURL(/\/twitter/);

    const twSwitchLeft = page.locator('aside.hidden.md\\:flex button:has-text("YouTube")').first();
    await expect(twSwitchLeft).toBeVisible();
    await twSwitchLeft.click();
    await expect(page).toHaveURL(/\/youtube/);
  });
});

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                       DESKTOP (1280 × 720)                               ║
// ╚══════════════════════════════════════════════════════════════════════════╝
test.describe('Desktop — 1280 × 720', () => {

  test('YouTube sidebar fully expanded with navigation labels', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/youtube/feed');

    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();

    // Expanded sidebar contains text labels for each nav item
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Trending' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Library' })).toBeVisible();
  });

  test('YouTube search bar visible in top navbar', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/youtube/trending');

    const searchInput = page.locator('header input[type="search"]').first();
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', 'Search videos...');
  });

  test('Twitter shows 3-column layout with right sidebar', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/twitter/home');

    // Left rail
    const leftRail = page.locator('aside.hidden.md\\:flex').first();
    await expect(leftRail).toBeVisible();

    // Center main content
    const main = page.locator('main').first();
    await expect(main).toBeVisible();

    // Right sidebar (only visible on lg+ — hidden below)
    const rightSidebar = page.locator('aside.hidden.lg\\:flex').first();
    await expect(rightSidebar).toBeVisible();
  });

  test('Twitter right sidebar has search input', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/twitter/home');

    const rightSidebar = page.locator('aside.hidden.lg\\:flex').first();
    const searchInput = rightSidebar.locator('input[name="q"]').first();
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', 'Search posts');
  });

  test('Twitter right sidebar has Sign in prompt when logged out', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/twitter/home');

    const rightSidebar = page.locator('aside.hidden.lg\\:flex').first();
    // The right sidebar shows "Sign in to post and follow." text when logged out
    await expect(rightSidebar.getByText(/Sign in/).first()).toBeVisible();
  });

  test('Twitter right sidebar has Sign in button when logged out', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/twitter/home');

    const signInBtn = page.locator('aside.hidden.lg\\:flex button:has-text("Sign in")').first();
    await expect(signInBtn).toBeVisible();
  });

  test('navigation between platforms works on desktop', async ({ page }) => {
    await page.setViewportSize(DESKTOP);

    await page.goto('/youtube/feed');
    const ytSwitch = page.locator('header button:has-text("Twitter")').first();
    await expect(ytSwitch).toBeVisible();
    await ytSwitch.click();
    await expect(page).toHaveURL(/\/twitter/);

    const twSwitch = page.locator('aside.hidden.md\\:flex button:has-text("YouTube")').first();
    await expect(twSwitch).toBeVisible();
    await twSwitch.click();
    await expect(page).toHaveURL(/\/youtube/);
  });
});

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║               NAVIGATION ACROSS ALL BREAKPOINTS                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝
test.describe('Navigation across all breakpoints', () => {

  test('mobile: navigate Twitter → YouTube → feed', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/twitter/home');

    const ytBtn = page.locator('header button:has-text("YouTube")').first();
    await ytBtn.click();
    await expect(page).toHaveURL(/\/youtube/);
  });

  test('tablet: navigate YouTube → Twitter via sidebar switch', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await page.goto('/youtube/feed');

    const twBtn = page.locator('button:has-text("Twitter")').first();
    await twBtn.click();
    await expect(page).toHaveURL(/\/twitter/);
  });

  test('desktop: sidebar nav links work (YouTube)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/youtube/feed');

    await page.getByRole('link', { name: 'Trending' }).click();
    await expect(page).toHaveURL(/\/youtube\/trending/);

    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page).toHaveURL(/\/youtube\/feed/);
  });

  test('desktop: sidebar nav links work (Twitter)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/twitter/home');

    await page.getByRole('link', { name: 'Explore' }).click();
    await expect(page).toHaveURL(/\/twitter\/search/);

    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page).toHaveURL(/\/twitter\/home/);
  });
});
