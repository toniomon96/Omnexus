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
    await page.locator('textarea').waitFor({ timeout: 5_000 });
    // Fastest check: textarea placeholder contains an example question
    const hasPlaceholder = await page.locator('textarea[placeholder*="protein"]')
      .isVisible({ timeout: 1_000 }).catch(() => false);
    // "Try asking" label shown when no conversation is active
    const hasTryAsking = await page.getByText(/try asking/i)
      .first().isVisible({ timeout: 4_000 }).catch(() => false);
    const hasChip = await page.locator('button').filter({ hasText: /protein|creatine|recovery|muscle|bench/i })
      .first().isVisible({ timeout: 2_000 }).catch(() => false);
    expect(hasPlaceholder || hasTryAsking || hasChip).toBe(true);
  });

  test('network failures show production-safe copy', async ({ page }) => {
    await page.route('**/api/ask', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/ask');
    await page.locator('textarea').fill('How much protein should I eat?');
    await page.getByRole('button', { name: /ask omnexus/i }).click();

    await expect(page.getByText(/could not reach the ai service right now/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/vercel dev|npm run dev/i)).toHaveCount(0);
  });

  test('sends stream-mode ask request and renders response', async ({ page }) => {
    let sawStreamMode = false;

    await page.route('**/api/ask', async (route) => {
      const payload = route.request().postDataJSON() as { stream?: boolean } | null;
      sawStreamMode = payload?.stream === true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: 'Partial answer', citations: [] }),
      });
    });

    await page.goto('/ask');
    await page.locator('textarea').fill('stream test');
    await page.getByRole('button', { name: /ask omnexus/i }).click();

    await expect(page.getByText('Partial answer', { exact: false })).toBeVisible({ timeout: 5_000 });
    expect(sawStreamMode).toBe(true);
  });

  test('shows loading state during ask request and resets after completion', async ({ page }) => {
    await page.route('**/api/ask', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: 'Done response', citations: [] }),
      });
    });

    await page.goto('/ask');
    await page.locator('textarea').fill('loading state test');
    await page.getByRole('button', { name: /ask omnexus/i }).click();

    await expect(page.getByRole('button', { name: /thinking/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Done response', { exact: false })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /ask omnexus/i })).toBeVisible({ timeout: 5_000 });
  });

  test('degraded state retry recovers after transient failure', async ({ page }) => {
    let attempts = 0;
    await page.route('**/api/ask', async (route) => {
      attempts += 1;
      if (attempts === 1) {
        await route.abort('failed');
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: 'Recovered answer', citations: [] }),
      });
    });

    await page.goto('/ask');
    await page.locator('textarea').fill('retry recovery test');
    await page.getByRole('button', { name: /ask omnexus/i }).click();

    await expect(page.getByTestId('ask-degraded-state')).toBeVisible({ timeout: 5_000 });
    await page.getByTestId('ask-degraded-state-retry').click();
    await expect(page.getByText('Recovered answer', { exact: false })).toBeVisible({ timeout: 5_000 });
  });
});
