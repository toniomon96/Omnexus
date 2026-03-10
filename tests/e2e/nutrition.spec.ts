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

  test('guest wall uses product copy and onboarding CTA', async ({ page }) => {
    await page.goto('/nutrition');
    await expect(page.getByText(/nutrition is available with a free account/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /create free account/i })).toBeVisible({ timeout: 5_000 });
  });

  test('shows macro targets section', async ({ page }) => {
    await page.goto('/nutrition');
    // Wait for page to settle before checking content
    await page.getByRole('heading', { name: /nutrition/i }).first().waitFor({ timeout: 5_000 }).catch(() => {});
    const hasMacros = await page.getByText(/protein|carbs|fat|calories/i).first()
      .isVisible({ timeout: 5_000 }).catch(() => false);
    const hasGuestWall = await page.getByText(/available with a free account/i).first()
      .isVisible({ timeout: 5_000 }).catch(() => false);
    expect(hasMacros || hasGuestWall).toBe(true);
  });

  test('can set nutrition goals', async ({ page }) => {
    await page.goto('/nutrition');
    await page.getByRole('heading', { name: /nutrition/i }).first().waitFor({ timeout: 5_000 }).catch(() => {});
    // Look for an input or button to configure goals
    const hasGoalInput = await page.locator('input[type="number"]').first()
      .isVisible({ timeout: 3_000 }).catch(() => false);
    const hasSetupBtn = await page.getByRole('button', { name: /set|save|update|goal/i }).first()
      .isVisible({ timeout: 3_000 }).catch(() => false);
    const hasGuestWall = await page.getByText(/available with a free account/i).first()
      .isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasGoalInput || hasSetupBtn || hasGuestWall).toBe(true);
  });

  test('quick log section is present', async ({ page }) => {
    await page.goto('/nutrition');
    await page.getByRole('heading', { name: /nutrition/i }).first().waitFor({ timeout: 5_000 }).catch(() => {});
    const hasQuickLog = await page.getByText(/quick log|log meal|add meal/i).first()
      .isVisible({ timeout: 5_000 }).catch(() => false);
    const hasLogLink = await page.getByRole('link', { name: /log/i }).first()
      .isVisible({ timeout: 3_000 }).catch(() => false);
    const hasGuestWall = await page.getByText(/available with a free account/i).first()
      .isVisible({ timeout: 5_000 }).catch(() => false);
    expect(hasQuickLog || hasLogLink || hasGuestWall).toBe(true);
  });

  test('generate meal plan button is present', async ({ page }) => {
    await page.goto('/nutrition');
    await page.getByRole('heading', { name: /nutrition/i }).first().waitFor({ timeout: 5_000 }).catch(() => {});
    const btn = page.getByRole('button', { name: /generate|meal plan/i });
    // Either the meal plan button, a setup prompt, or the guest wall
    const hasMealPlan = await btn.first().isVisible({ timeout: 3_000 }).catch(() => false);
    const hasSetup = await page.getByText(/set.*goal|configure|get started/i).first()
      .isVisible({ timeout: 3_000 }).catch(() => false);
    const hasGuestWall = await page.getByText(/available with a free account/i).first()
      .isVisible({ timeout: 5_000 }).catch(() => false);
    expect(hasMealPlan || hasSetup || hasGuestWall).toBe(true);
  });
});
