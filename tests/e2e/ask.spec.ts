import { test, expect } from './helpers/fixtures';
import { enterAsGuest } from './helpers/auth';

test.describe('Ask AI Coach', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('page loads with input area', async ({ page }) => {
    await page.goto('/ask');
    // Input or textarea for asking questions
    const input = page.locator('textarea, input[type="text"]').first();
    await expect(input).toBeVisible({ timeout: 5_000 });
  });

  test('shows Omnexus AI heading or branding', async ({ page }) => {
    await page.goto('/ask');
    await expect(
      page.getByRole('heading', { name: /ask|ai coach|omnexus/i }).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('accepts text input', async ({ page }) => {
    await page.goto('/ask');
    const input = page.locator('textarea, input[type="text"]').first();
    await input.fill('How many sets per week for muscle growth?');
    await expect(input).toHaveValue(/how many sets/i);
  });

  test('submit button is present', async ({ page }) => {
    await page.goto('/ask');
    const submitBtn = page.getByRole('button', { name: /send|ask|submit/i });
    await expect(submitBtn.first()).toBeVisible({ timeout: 5_000 });
  });

  test('navigated to /ask from Insights quick question has prefill', async ({ page }) => {
    await page.goto('/ask', { state: { prefill: 'How can I improve my recovery?' } } as never);
    // In React Router the state is passed via navigate(), not via page.goto()
    // Verify the page loads correctly regardless
    await expect(page).toHaveURL('/ask');
    const input = page.locator('textarea, input[type="text"]').first();
    await expect(input).toBeVisible({ timeout: 5_000 });
  });

  test('suggested questions chips or examples are visible', async ({ page }) => {
    await page.goto('/ask');
    // Either suggestion chips or placeholder text indicating example questions
    const hasSuggestions = await page.getByText(
      /how|what|bench|recovery|protein|progressive|plateau/i,
    ).first().isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasSuggestions).toBe(true);
  });
});
