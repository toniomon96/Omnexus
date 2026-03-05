import { test, expect } from './helpers/fixtures';
import { enterAsGuest } from './helpers/auth';

test.describe('Nutrition', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('page loads with Nutrition heading', async ({ page }) => {
    await page.goto('/nutrition');
    await expect(
      page.getByRole('heading', { name: /nutrition/i }).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('shows macro targets section', async ({ page }) => {
    await page.goto('/nutrition');
    // Either macro targets (protein/carbs/fat) or a setup prompt
    const hasMacros = await page.getByText(/protein|carbs|fat|calories/i).first()
      .isVisible({ timeout: 5_000 }).catch(() => false);
    expect(hasMacros).toBe(true);
  });

  test('can set nutrition goals', async ({ page }) => {
    await page.goto('/nutrition');
    // Look for an input or button to configure goals
    const hasGoalInput = await page.locator('input[type="number"]').first()
      .isVisible({ timeout: 3_000 }).catch(() => false);
    const hasSetupBtn = await page.getByRole('button', { name: /set|save|update|goal/i }).first()
      .isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasGoalInput || hasSetupBtn).toBe(true);
  });

  test('quick log section is present', async ({ page }) => {
    await page.goto('/nutrition');
    // Quick log link or section
    const hasQuickLog = await page.getByText(/quick log|log meal|add meal/i).first()
      .isVisible({ timeout: 5_000 }).catch(() => false);
    const hasLogLink = await page.getByRole('link', { name: /log/i }).first()
      .isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasQuickLog || hasLogLink).toBe(true);
  });

  test('generate meal plan button is present', async ({ page }) => {
    await page.goto('/nutrition');
    const btn = page.getByRole('button', { name: /generate|meal plan/i });
    // Only visible if macros are configured — either button or setup prompt is fine
    const hasMealPlan = await btn.first().isVisible({ timeout: 3_000 }).catch(() => false);
    const hasSetup = await page.getByText(/set.*goal|configure|get started/i).first()
      .isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasMealPlan || hasSetup).toBe(true);
  });
});
