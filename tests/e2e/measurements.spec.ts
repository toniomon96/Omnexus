import { test, expect } from './helpers/fixtures';
import { enterAsGuest } from './helpers/auth';

test.describe('Measurements', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('guest users can add and delete local measurements', async ({ page }) => {
    await page.goto('/measurements');

    await expect(page.getByText(/guest entries stay on this device/i)).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /^weight$/i }).click();
    await expect(page.getByRole('heading', { name: /add entry/i })).toBeVisible({ timeout: 5_000 });

    await page.locator('input[type="number"]').first().fill('80.5');
    await page.locator('input[type="date"]').fill('2025-03-15');
    await page.getByRole('button', { name: /add entry/i }).click();

    await expect(page.getByText(/80\.5\s+(kg|lbs)/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('2025-03-15')).toBeVisible({ timeout: 5_000 });

    await page.getByRole('button', { name: /delete entry/i }).click();
    await expect(page.getByText(/no entries yet/i)).toBeVisible({ timeout: 5_000 });
  });
});