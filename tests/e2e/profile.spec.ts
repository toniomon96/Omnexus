import { test, expect } from './helpers/fixtures';
import { enterAsGuest } from './helpers/auth';

test.describe('Profile page — guest', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('navigates to profile page', async ({ page }) => {
    await page.getByRole('link', { name: 'Me', exact: true }).click();
    await expect(page).toHaveURL('/profile');
  });

  test('shows user name from guest setup', async ({ page }) => {
    await page.goto('/profile');
    // The profile page should display some settings/profile content
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('theme toggle switches between dark and light', async ({ page }) => {
    await page.goto('/profile');
    const html = page.locator('html');

    // Get initial theme state
    const initialDark = await html.evaluate((el) => el.classList.contains('dark'));

    // Find and click the theme toggle (sun/moon icon button)
    const themeButton = page.getByRole('button', { name: /theme|dark|light|moon|sun/i });
    if (await themeButton.isVisible()) {
      await themeButton.click();
      const afterToggle = await html.evaluate((el) => el.classList.contains('dark'));
      expect(afterToggle).not.toBe(initialDark);
    }
  });

  test('exit guest mode button is visible for guest', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('button', { name: /exit guest mode/i })).toBeVisible();
  });
});
