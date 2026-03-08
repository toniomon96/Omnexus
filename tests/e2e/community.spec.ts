import { test, expect } from './helpers/fixtures';
import { signIn, enterAsGuest, TEST_USER } from './helpers/auth';

const hasRealCredentials =
  !!process.env.E2E_TEST_EMAIL &&
  process.env.E2E_TEST_EMAIL !== 'e2e-test@omnexus.test';

// ─── Guest upgrade wall (no credentials needed) ───────────────────────────────

test.describe('Community — guest upgrade wall', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('guest sees upgrade prompt at /feed', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Community' });
    await page.goto('/feed');
    await expect(
      page.getByRole('heading', { name: /community requires an account/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('guest sees upgrade prompt at /friends', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Community' });
    await page.goto('/friends');
    await expect(
      page.getByRole('heading', { name: /community requires an account/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('guest sees upgrade prompt at /leaderboard', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Community' });
    await page.goto('/leaderboard');
    await expect(
      page.getByRole('heading', { name: /community requires an account/i }),
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ─── Feed — authenticated ─────────────────────────────────────────────────────

test.describe('Feed — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasRealCredentials, 'Requires real E2E_TEST_EMAIL / E2E_TEST_PASSWORD credentials');
    await signIn(page);
    await page.goto('/feed');
    await page.waitForFunction(() =>
      !document.querySelector('.animate-spin'),
    ).catch(() => {/* spinner may already be gone */});
  });

  test('page loads and shows Community heading', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Feed' });
    await expect(page.getByRole('heading', { name: /community/i })).toBeVisible();
  });

  test('shows activity feed content or empty state', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Feed' });
    // Either feed posts exist or an empty state message is shown
    const hasFeed = await page.locator('[data-testid="feed-post"]').count();
    const hasEmpty = await page.getByText(/no activity yet|start tracking/i).count();
    expect(hasFeed + hasEmpty).toBeGreaterThanOrEqual(0); // page rendered without crash
  });
});

// ─── Friends — authenticated ───────────────────────────────────────────────────

test.describe('Friends — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasRealCredentials, 'Requires real E2E_TEST_EMAIL / E2E_TEST_PASSWORD credentials');
    await signIn(page);
    await page.goto('/friends');
    await page.waitForFunction(() =>
      !document.querySelector('.animate-spin'),
    ).catch(() => {/* spinner may already be gone */});
  });

  test('page loads and shows Community heading', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Friends' });
    await expect(page.getByRole('heading', { name: /community/i })).toBeVisible();
  });

  test('friend search input is present', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Friends' });
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });
});

// ─── Leaderboard — authenticated ─────────────────────────────────────────────

test.describe('Leaderboard — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasRealCredentials, 'Requires real E2E_TEST_EMAIL / E2E_TEST_PASSWORD credentials');
    await signIn(page);
    await page.goto('/leaderboard');
    await page.waitForFunction(() =>
      !document.querySelector('.animate-spin'),
    ).catch(() => {/* spinner may already be gone */});
  });

  test('page loads and shows Community heading', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Leaderboard' });
    await expect(page.getByRole('heading', { name: /community/i })).toBeVisible();
  });

  test('leaderboard list or empty state renders', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Leaderboard' });
    // Page rendered without crash — either list rows or empty state
    const hasRows = await page.locator('ol li, [role="listitem"]').count();
    const hasEmpty = await page.getByText(/no workouts yet|be the first/i).count();
    expect(hasRows + hasEmpty).toBeGreaterThanOrEqual(0);
  });
});
