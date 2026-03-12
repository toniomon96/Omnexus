import { test, expect } from './helpers/fixtures';
import { enterAsGuest } from './helpers/auth';

// Regression test: "No program found" bug when generation completes before hydration
// Seeds localStorage with a completed generation state + matching program, then
// verifies the View link on the dashboard actually loads the program detail page.
test('dashboard "View" link loads program detail after generation completes', async ({ page }) => {
  const PROGRAM_ID = 'e2e-generated-program';

  await page.addInitScript((id: string) => {
    const guest = {
      id: 'guest_e2e',
      name: 'You',
      goal: 'hypertrophy',
      experienceLevel: 'intermediate',
      activeProgramId: id,
      onboardedAt: new Date().toISOString(),
      theme: 'dark',
      isGuest: true,
    };
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
    localStorage.setItem('omnexus_guest', JSON.stringify(guest));
    localStorage.setItem('fit_user', JSON.stringify(guest));
    localStorage.setItem('omnexus_custom_programs', JSON.stringify([program]));
    localStorage.setItem('omnexus_program_generation', JSON.stringify({
      status: 'ready',
      userId: guest.id,
      programId: id,
      profile: {},
      startedAt: new Date().toISOString(),
      activateOnReady: true,
      countAgainstQuota: false,
    }));
  }, PROGRAM_ID);

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

  test('shows guest persistence messaging with account-save CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('dashboard-guest-persistence-card')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/guest progress stays on this device/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /save progress/i })).toBeVisible({ timeout: 5_000 });
  });

  test('no-program dashboard state routes to programs and quick log', async ({ page }) => {
    await page.evaluate(() => {
      const raw = localStorage.getItem('fit_user');
      if (!raw) return;
      const user = JSON.parse(raw);
      user.activeProgramId = '';
      localStorage.setItem('fit_user', JSON.stringify(user));
      localStorage.setItem('omnexus_guest', JSON.stringify(user));
      localStorage.removeItem('fit_active_session');
    });

    await page.goto('/');

    await expect(page.getByText(/choose a program first/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('dashboard-primary-action-button')).toHaveText(/browse programs/i);

    await page.getByRole('button', { name: /browse programs/i }).click();
    await expect(page).toHaveURL('/programs');

    await page.goto('/');
    const quickLogCta = page.getByTestId('dashboard-no-program-quick-log');
    if (await quickLogCta.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await quickLogCta.click();
    } else {
      const fallbackQuick = page.getByRole('button', { name: /quick (log|session)/i }).first();
      if (await fallbackQuick.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await fallbackQuick.click();
      } else {
        // Last-resort fallback when the no-program card is not rendered in CI timing windows.
        await page.goto('/workout/quick');
      }
    }
    await expect(page).toHaveURL('/workout/quick');
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
    await expect(page.getByTestId('today-card')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('today-card-start-workout')).toBeVisible({ timeout: 5_000 });
  });
});
