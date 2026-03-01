import { test, expect } from '@playwright/test';
import { signIn, enterAsGuest } from './helpers/auth';

test.describe('Bottom navigation', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('Home tab navigates to /', async ({ page }) => {
    await page.goto('/library');
    await page.getByRole('link', { name: /home/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('Learn tab navigates to /learn', async ({ page }) => {
    await page.getByRole('link', { name: /learn/i }).click();
    await expect(page).toHaveURL('/learn');
    await expect(page.getByRole('heading', { name: /learn/i })).toBeVisible();
  });

  test('Insights tab navigates to /insights', async ({ page }) => {
    await page.getByRole('link', { name: /insights/i }).click();
    await expect(page).toHaveURL('/insights');
  });

  test('Library tab navigates to /library', async ({ page }) => {
    await page.getByRole('link', { name: /library/i }).click();
    await expect(page).toHaveURL('/library');
  });

  test('History tab navigates to /history', async ({ page }) => {
    await page.getByRole('link', { name: /history/i }).click();
    await expect(page).toHaveURL('/history');
  });
});

test.describe('TopBar back button', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('back button on program detail returns to /programs', async ({ page }) => {
    await page.goto('/programs');
    // Click the first program
    await page.getByRole('link', { name: /.+/ }).first().click();
    await page.waitForURL(/\/programs\/.+/);
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page).toHaveURL('/programs');
  });

  test('back button on exercise detail returns to /library', async ({ page }) => {
    await page.goto('/library');
    await page.getByRole('link', { name: /.+/ }).first().click();
    await page.waitForURL(/\/library\/.+/);
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page).toHaveURL('/library');
  });
});
