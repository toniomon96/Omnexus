import { test, expect } from './helpers/fixtures';
import { enterAsGuest } from './helpers/auth';

test.describe('Route coverage', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('help page renders FAQ and support sections', async ({ page }) => {
    await page.goto('/help');
    await expect(page.getByRole('heading', { name: /help & support/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /frequently asked questions/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /report a bug/i })).toBeVisible();
  });

  test('subscription page renders plan and features', async ({ page }) => {
    await page.goto('/subscription');
    await expect(page.getByRole('heading', { name: /subscription/i })).toBeVisible();
    await expect(page.getByText(/current plan/i)).toBeVisible();
    await expect(page.getByText(/workout tracking/i)).toBeVisible();
  });

  test('plate calculator route renders controls and diagram', async ({ page }) => {
    await page.goto('/tools/plate-calculator');
    await expect(page.getByRole('heading', { name: /plate calculator/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /target weight/i })).toBeVisible();
    await expect(page.getByLabel(/barbell plate diagram/i)).toBeVisible();
  });

  test('pre-workout briefing page renders and allows start action', async ({ page }) => {
    await page.goto('/briefing');
    await expect(page.getByRole('heading', { name: /pre-workout briefing/i })).toBeVisible();
    await expect(page.getByText(/ai coach briefing/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /start workout/i })).toBeVisible();
  });
});

test.describe('Reset password route', () => {
  test('reset-password page renders form fields', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByRole('heading', { name: /set new password/i })).toBeVisible();
    await expect(page.getByLabel(/new password/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /update password/i })).toBeVisible();
  });
});
