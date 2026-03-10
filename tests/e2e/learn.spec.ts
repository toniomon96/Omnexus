import { test, expect } from './helpers/fixtures';
import { enterAsGuest } from './helpers/auth';

test.describe('Learn', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('shows learn page with courses', async ({ page }) => {
    await page.goto('/learn');
    await expect(page.getByPlaceholder(/search topics, exercises, lessons/i)).toBeVisible({ timeout: 10_000 });
    // Should show at least one course card
    await expect(page.locator('[data-testid="course-card"]').first()).toBeVisible({ timeout: 5_000 });
  });

  test('can open a course', async ({ page }) => {
    await page.goto('/learn');
    await page.locator('[data-testid="course-card"]').first().click();
    await page.waitForURL(/\/learn\/.+/);
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('semantic search returns results', async ({ page }) => {
    await page.goto('/learn');
    const searchInput = page.getByPlaceholder(/search|ask/i);
    if (await searchInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await searchInput.fill('how to increase bench press');
      // Results or AI micro-lesson CTA should appear
      await expect(
        page.getByText(/bench|strength|progressive overload/i).first()
      ).toBeVisible({ timeout: 8_000 });
    }
  });

  test('search no-results state shows clear recovery action', async ({ page }) => {
    await page.route('**/api/recommend-content', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ recommendations: [], hasContentGap: false }),
      });
    });

    await page.goto('/learn');
    const searchInput = page.getByPlaceholder(/search topics, exercises, lessons/i);
    await searchInput.fill('zzzz impossible query');

    await expect(page.getByText(/no matching lessons yet/i)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('button', { name: /clear search/i })).toBeVisible({ timeout: 5_000 });
  });
});
