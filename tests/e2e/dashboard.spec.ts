import { test, expect } from './helpers/fixtures';
import { enterAsGuest } from './helpers/auth';

// Regression test: "No program found" bug when generation completes before hydration
// Seeds localStorage with a completed generation state + matching program, then
// verifies the View link on the dashboard actually loads the program detail page.
test('dashboard "View" link loads program detail after generation completes', async ({ page }) => {
  const PROGRAM_ID = 'e2e-generated-program';

  await page.addInitScript((id: string) => {
    const program = {
      id,
      name: 'AI E2E Test Program',
      goal: 'hypertrophy',
      experienceLevel: 'intermediate',
      description: 'Regression test for post-generation program visibility.',
      daysPerWeek: 4,
      estimatedDurationWeeks: 8,
      schedule: [],
      tags: [],
      isCustom: true,
      isAiGenerated: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('omnexus_custom_programs', JSON.stringify([program]));
    localStorage.setItem('omnexus_program_generation', JSON.stringify({
      status: 'ready',
      userId: 'guest',
      programId: id,
      profile: {},
      startedAt: new Date().toISOString(),
    }));
  }, PROGRAM_ID);

  await enterAsGuest(page);
  await page.goto('/');

  // The "program ready" banner should be visible
  await expect(
    page.getByText(/program is ready|personalized program/i),
  ).toBeVisible({ timeout: 5_000 });

  // Clicking "View →" must navigate to the program detail page
  await page.getByRole('link', { name: /view/i }).click();
  await page.waitForURL(/\/programs\/.+/);

  // The program detail page must render the program name — NOT "Program not found"
  await expect(page.getByText('AI E2E Test Program')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/not found/i)).not.toBeVisible();
});

test.describe('Dashboard — guest', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('shows greeting on dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByText(/good (morning|afternoon|evening)/i),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('displays streak section', async ({ page }) => {
    await page.goto('/');
    // StreakDisplay renders even at 0 — look for the streak area or day dots
    await expect(
      page.getByText(/streak|day/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('AI Insights card links to /insights', async ({ page }) => {
    await page.goto('/');
    const insightsCard = page.getByText('AI Insights');
    await expect(insightsCard).toBeVisible();
    await insightsCard.click();
    await expect(page).toHaveURL('/insights');
  });

  test('profile button navigates to /profile', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /profile/i }).click();
    await expect(page).toHaveURL('/profile');
  });

  test('today\'s workout card is visible for guest with program', async ({ page }) => {
    // Guest setup auto-assigns a program, so TodayCard should render
    await page.goto('/');
    await expect(
      page.getByText(/today|workout/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});
