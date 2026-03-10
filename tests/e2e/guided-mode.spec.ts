import { test, expect } from './helpers/fixtures';
import { enterAsGuest } from './helpers/auth';

async function forceGuidedMode(page: Parameters<typeof test>[0]['page']) {
  await page.evaluate(() => {
    const raw = localStorage.getItem('fit_user');
    if (!raw) return;
    const user = JSON.parse(raw) as { id?: string };
    if (!user.id) return;
    const rawModes = localStorage.getItem('omnexus_experience_mode');
    const modes = rawModes ? JSON.parse(rawModes) as Record<string, 'guided' | 'advanced'> : {};
    modes[user.id] = 'guided';
    localStorage.setItem('omnexus_experience_mode', JSON.stringify(modes));
  });
}

test.describe('Guided mode UX', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
    await forceGuidedMode(page);
  });

  test('shows guided glossary chips on Train and Learn pages', async ({ page }) => {
    await page.goto('/train');
    await expect(page.getByText(/train terms explained/i)).toBeVisible({ timeout: 5_000 });

    await page.goto('/learn');
    await expect(page.getByText(/learning terms explained/i)).toBeVisible({ timeout: 5_000 });
  });

  test('notification cards deep-link to destination routes', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.getByText(/welcome to omnexus/i)).toBeVisible({ timeout: 5_000 });

    await page.getByText(/welcome to omnexus/i).click();
    await expect(page).toHaveURL('/guided-pathways');
  });
});
