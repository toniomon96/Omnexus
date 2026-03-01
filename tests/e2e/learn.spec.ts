import { test, expect } from '@playwright/test';
import { enterAsGuest } from './helpers/auth';

test.describe('Learn', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('shows learn page with courses', async ({ page }) => {
    await page.goto('/learn');
    await expect(page.getByRole('heading', { name: /learn/i })).toBeVisible();
    // Should show at least one course card
    await expect(page.getByRole('link', { name: /.+/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('can open a course', async ({ page }) => {
    await page.goto('/learn');
    await page.getByRole('link', { name: /.+/ }).first().click();
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
});
