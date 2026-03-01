import { test, expect } from '@playwright/test';
import { enterAsGuest } from './helpers/auth';

test.describe('Workout flow', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
    // Clear any active session from previous test
    await page.evaluate(() => localStorage.removeItem('fit_active_session'));
  });

  test('start workout from dashboard', async ({ page }) => {
    await page.goto('/');
    // Dashboard shows "Start Workout" or a next workout card
    const startBtn = page.getByRole('button', { name: /start workout|begin/i })
      .or(page.getByRole('link', { name: /start workout|begin/i }));
    await expect(startBtn.first()).toBeVisible({ timeout: 5_000 });
    await startBtn.first().click();
    // Should land on pre-workout briefing or active workout
    await page.waitForURL(/\/(workout\/active|briefing)/);
  });

  test('active workout shows exercises', async ({ page }) => {
    await page.goto('/');
    const startBtn = page.getByRole('button', { name: /start workout|begin/i })
      .or(page.getByRole('link', { name: /start workout|begin/i }));
    await startBtn.first().click();
    await page.waitForURL(/\/workout\/active/);
    // At least one exercise should be visible
    await expect(page.locator('[data-testid="exercise-row"], .exercise-card, [class*="exercise"]').first()).toBeVisible({ timeout: 5_000 });
  });

  test('can discard workout with confirmation', async ({ page }) => {
    await page.goto('/');
    const startBtn = page.getByRole('button', { name: /start workout|begin/i })
      .or(page.getByRole('link', { name: /start workout|begin/i }));
    await startBtn.first().click();
    await page.waitForURL(/\/workout\/active/);

    // Discard button
    const discardBtn = page.getByRole('button', { name: /discard|cancel|quit/i });
    await discardBtn.click();

    // Confirm dialog should appear
    await expect(page.getByRole('dialog').or(page.getByText(/are you sure|discard/i))).toBeVisible({ timeout: 3_000 });

    // Confirm discard
    await page.getByRole('button', { name: /discard|confirm|yes/i }).last().click();

    // Should leave active workout
    await page.waitForURL(/^(?!.*workout\/active).*/);
  });

  test('active session persists on page refresh', async ({ page }) => {
    await page.goto('/');
    const startBtn = page.getByRole('button', { name: /start workout|begin/i })
      .or(page.getByRole('link', { name: /start workout|begin/i }));
    await startBtn.first().click();
    await page.waitForURL(/\/workout\/active/);

    // Reload the page
    await page.reload();

    // Should be redirected back to active workout (session restored from localStorage)
    await page.waitForURL(/\/workout\/active/, { timeout: 5_000 });
  });
});

test.describe('Workout history', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('history page shows empty state for new users', async ({ page }) => {
    await page.goto('/history');
    // Either shows sessions or an empty state message
    const content = page.getByText(/no workouts|start your first|workout history/i)
      .or(page.locator('[data-testid="session-card"]').first());
    await expect(content).toBeVisible({ timeout: 5_000 });
  });
});
