import { test, expect } from './helpers/fixtures';
import { enterAsGuest } from './helpers/auth';

async function clickTopBarBackAndWait(page: Parameters<typeof test>[0]['page'], destination: string) {
  await Promise.all([
    page.waitForURL(destination),
    page.locator('[data-testid="topbar-back"]').click(),
  ]);
}

test.describe('Bottom navigation', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('Home tab navigates to /', async ({ page }) => {
    await page.goto('/learn');
    await page.getByRole('button', { name: /^home$/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('Train tab navigates to /train', async ({ page }) => {
    await page.getByRole('button', { name: /^train$/i }).click();
    await expect(page).toHaveURL('/train');
  });

  test('Community tab navigates to /community', async ({ page }) => {
    await page.getByRole('button', { name: /^community$/i }).click();
    await expect(page).toHaveURL('/community');
  });

  test('Learn tab navigates to /learn', async ({ page }) => {
    await page.getByRole('button', { name: /^learn$/i }).click();
    await expect(page).toHaveURL('/learn');
    await expect(page.getByPlaceholder(/search topics, exercises, lessons/i)).toBeVisible({ timeout: 10_000 });
  });

  test('Insights tab navigates to /insights', async ({ page }) => {
    await page.getByRole('button', { name: /^insights$/i }).click();
    await expect(page).toHaveURL('/insights');
  });

  test('profile icon in TopBar navigates to /profile', async ({ page }) => {
    await page.getByRole('link', { name: /profile/i }).click();
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
    await clickTopBarBackAndWait(page, '/programs');
    await expect(page).toHaveURL('/programs');
  });

  test('back button on exercise detail returns to /library', async ({ page }) => {
    await page.goto('/library');
    await page.locator('[data-testid="exercise-card"]').first().click();
    await page.waitForURL(/\/library\/.+/);
    await clickTopBarBackAndWait(page, '/library');
    await expect(page).toHaveURL('/library');
  });
});
