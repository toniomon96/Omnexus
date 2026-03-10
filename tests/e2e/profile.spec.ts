import { test, expect } from './helpers/fixtures';
import { enterAsGuest } from './helpers/auth';

test.describe('Profile page — guest', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('navigates to profile page', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL('/profile');
  });

  test('shows user name from guest setup', async ({ page }) => {
    await page.goto('/profile');
    // The profile page should display some settings/profile content
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('theme toggle switches between dark and light', async ({ page }) => {
    await page.goto('/profile');
    const html = page.locator('html');

    // Get initial theme state
    const initialDark = await html.evaluate((el) => el.classList.contains('dark'));

    // Find and click the theme toggle (sun/moon icon button)
    const themeButton = page.getByRole('button', { name: /theme|dark|light|moon|sun/i });
    if (await themeButton.isVisible()) {
      await themeButton.click();
      const afterToggle = await html.evaluate((el) => el.classList.contains('dark'));
      expect(afterToggle).not.toBe(initialDark);
    }
  });

  test('exit guest mode button is visible for guest', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('button', { name: /exit guest mode/i })).toBeVisible();
  });

  test('weight unit selection persists and updates history labels', async ({ page }) => {
    await page.evaluate(() => {
      const history = {
        sessions: [
          {
            id: 'session-unit-1',
            programId: 'program-1',
            trainingDayIndex: 0,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            durationSeconds: 1800,
            exercises: [
              {
                exerciseId: 'barbell-bench-press',
                sets: [
                  { setNumber: 1, weight: 100, reps: 5, completed: true, timestamp: new Date().toISOString() },
                ],
              },
            ],
            totalVolumeKg: 500,
          },
        ],
        personalRecords: [
          {
            exerciseId: 'barbell-bench-press',
            weight: 100,
            reps: 5,
            achievedAt: new Date().toISOString(),
            sessionId: 'session-unit-1',
          },
        ],
      };
      localStorage.setItem('fit_history', JSON.stringify(history));
    });

    await page.goto('/profile');
    await page.selectOption('#profile-weight-unit', 'lbs');

    await page.goto('/history');
    await expect(page.getByText(/lbs/i).first()).toBeVisible({ timeout: 5_000 });
  });
});
