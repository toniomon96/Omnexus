import { test, expect } from './helpers/fixtures';
import { enterAsGuest } from './helpers/auth';

test.describe('Bottom navigation', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('Home tab navigates to /', async ({ page }) => {
    await page.goto('/learn');
    await page.getByRole('link', { name: /home/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('Train tab navigates to /train', async ({ page }) => {
    await page.getByRole('link', { name: /train/i }).click();
    await expect(page).toHaveURL('/train');
  });

  test('Community tab navigates to /community', async ({ page }) => {
    await page.getByRole('link', { name: /community/i }).click();
    await expect(page).toHaveURL('/community');
  });

  test('Learn tab navigates to /learn', async ({ page }) => {
    await page.getByRole('link', { name: /^learn$/i }).click();
    await expect(page).toHaveURL('/learn');
    await expect(page.getByRole('heading', { name: /^learn$/i })).toBeVisible();
  });

  test('Me tab navigates to /profile', async ({ page }) => {
    await page.getByRole('link', { name: 'Me', exact: true }).click();
    await expect(page).toHaveURL('/profile');
  });
});

test.describe('TopBar back button', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('back button on program detail returns to /programs', async ({ page }) => {
    await page.goto('/programs');
    await page.locator('[data-testid="program-card"]').first().click();
    await page.waitForURL(/\/programs\/.+/);
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page).toHaveURL('/programs');
  });

  test('back button on exercise detail returns to /library', async ({ page }) => {
    await page.goto('/library');
    await page.locator('[data-testid="exercise-card"]').first().click();
    await page.waitForURL(/\/library\/.+/);
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page).toHaveURL('/library');
  });
});
