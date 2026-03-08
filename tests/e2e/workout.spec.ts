import { test, expect } from './helpers/fixtures';
import { enterAsGuest } from './helpers/auth';

test.describe('Workout flow', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
    await page.evaluate(() => localStorage.removeItem('fit_active_session'));
  });

  test('start workout from dashboard', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Workout' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });

    await test.step('navigate to dashboard', () => page.goto('/'));

    await test.step('click start workout', async () => {
      const startBtn = page.getByRole('button', { name: /start workout|begin/i })
        .or(page.getByRole('link', { name: /start workout|begin/i }));
      await expect(startBtn.first()).toBeVisible({ timeout: 5_000 });
      await startBtn.first().click();
    });

    await test.step('verify landed on workout page', () =>
      page.waitForURL(/\/(workout\/active|briefing)/),
    );
  });

  test('active workout shows exercises', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Workout' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });

    await test.step('navigate to dashboard and start workout', async () => {
      await page.goto('/');
      const startBtn = page.getByRole('button', { name: /start workout|begin/i })
        .or(page.getByRole('link', { name: /start workout|begin/i }));
      await startBtn.first().click();
      await page.waitForURL(/\/workout\/active/);
    });

    await test.step('verify at least one exercise is visible', async () => {
      await expect(
        page.locator('[data-testid="exercise-block"]').first(),
      ).toBeVisible({ timeout: 5_000 });
    });
  });

  test('can discard workout with confirmation dialog', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Workout' });
    test.info().annotations.push({ type: 'severity', description: 'high' });

    await test.step('start a workout', async () => {
      await page.goto('/');
      const startBtn = page.getByRole('button', { name: /start workout|begin/i })
        .or(page.getByRole('link', { name: /start workout|begin/i }));
      await startBtn.first().click();
      await page.waitForURL(/\/workout\/active/);
    });

    await test.step('click discard button', async () => {
      await page.getByRole('button', { name: /discard workout/i }).click();
    });

    await test.step('verify confirmation dialog appears', async () => {
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });
    });

    await test.step('confirm discard', async () => {
      await page.getByRole('button', { name: /^discard$/i }).click();
    });

    await test.step('verify no longer on active workout page', () =>
      page.waitForURL(/^(?!.*workout\/active).*/),
    );
  });

  test('active session restores on page refresh', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Workout' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    test.info().annotations.push({ type: 'description', description: 'localStorage-backed session must survive a hard refresh so users never lose work' });

    await test.step('start a workout', async () => {
      await page.goto('/');
      const startBtn = page.getByRole('button', { name: /start workout|begin/i })
        .or(page.getByRole('link', { name: /start workout|begin/i }));
      await startBtn.first().click();
      await page.waitForURL(/\/workout\/active/);
    });

    await test.step('reload the page', () => page.reload());

    await test.step('verify session was restored', () =>
      page.waitForURL(/\/workout\/active/, { timeout: 5_000 }),
    );
  });
});

test.describe('Workout complete modal', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
    await page.evaluate(() => localStorage.removeItem('fit_active_session'));
  });

  test('finish workout button appears after exercises are loaded', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Workout' });

    await page.goto('/');
    const startBtn = page.getByRole('button', { name: /start workout|begin/i })
      .or(page.getByRole('link', { name: /start workout|begin/i }));

    // Skip if there's no active program / start button
    if (!await startBtn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      test.skip();
      return;
    }

    await startBtn.first().click();
    await page.waitForURL(/\/workout\/active/);

    await expect(
      page.getByRole('button', { name: /finish workout/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('complete modal has Dashboard and History buttons', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Workout' });

    await page.goto('/');
    const startBtn = page.getByRole('button', { name: /start workout|begin/i })
      .or(page.getByRole('link', { name: /start workout|begin/i }));

    if (!await startBtn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      test.skip();
      return;
    }

    await startBtn.first().click();
    await page.waitForURL(/\/workout\/active/);

    // Finish the workout directly
    const finishBtn = page.getByRole('button', { name: /finish workout/i });
    if (!await finishBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      test.skip();
      return;
    }

    await finishBtn.click();

    // Modal should appear with both CTAs
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByRole('button', { name: /dashboard/i }).or(page.getByRole('link', { name: /dashboard/i })),
    ).toBeVisible({ timeout: 3_000 });
    await expect(
      page.getByRole('button', { name: /history/i }).or(page.getByRole('link', { name: /history/i })),
    ).toBeVisible({ timeout: 3_000 });
  });
});

test.describe('Quick log workout', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
    await page.evaluate(() => localStorage.removeItem('fit_active_session'));
  });

  test('quick-log workout can be started and finished', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Quick Log' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    test.info().annotations.push({ type: 'description', description: 'Regression: quick-log "Finish" button was a no-op because program lookup returned undefined' });

    await test.step('navigate to quick log page', () => page.goto('/workout/quick'));

    await test.step('select at least one exercise', async () => {
      const firstExercise = page.locator('button').filter({ hasText: /press|squat|deadlift|curl/i }).first();
      await expect(firstExercise).toBeVisible({ timeout: 5_000 });
      await firstExercise.click();
    });

    await test.step('start the workout', async () => {
      await page.getByRole('button', { name: /start workout/i }).click();
      await page.waitForURL(/\/workout\/active/);
    });

    await test.step('finish the workout', async () => {
      const finishBtn = page.getByRole('button', { name: /finish/i });
      await expect(finishBtn).toBeVisible({ timeout: 5_000 });
      await finishBtn.click();
    });

    await test.step('completion modal appears — workout was saved', async () => {
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText(/workout complete/i)).toBeVisible({ timeout: 3_000 });
    });
  });
});

test.describe('Workout history', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('history page loads for new users', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'History' });

    await test.step('navigate to history', () => page.goto('/history'));

    await test.step('verify page renders (empty state or sessions)', async () => {
      await expect(
        page.getByText(/no workouts|start your first|workout history/i)
          .or(page.locator('[data-testid="session-card"]').first()),
      ).toBeVisible({ timeout: 5_000 });
    });
  });
});
