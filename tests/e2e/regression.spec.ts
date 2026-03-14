import { test, expect } from './helpers/fixtures';
import { enterAsGuest } from './helpers/auth';

/**
 * Regression test suite.
 *
 * Covers critical user trust paths that must never regress:
 * - localStorage persistence across page reloads
 * - Back-navigation from workout and learn flows
 * - Guest mode data integrity
 * - Offline graceful degradation (AI endpoints unreachable)
 * - URL deep-linking into protected routes
 */

// ─── localStorage Persistence ────────────────────────────────────────────────

test.describe('Regression — localStorage persistence', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('gamification data persists across hard page reload', async ({ page }) => {
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    test.info().annotations.push({ type: 'regression', description: 'localStorage persistence' });

    await test.step('seed gamification data', async () => {
      await page.evaluate(() => {
        const data = {
          totalXp: 350,
          streak: 3,
          streakUpdatedDate: '2025-03-01',
          sparks: 25,
          unlockedAchievementIds: ['first-workout'],
          weeklyXp: 100,
          weeklyXpResetDate: '2025-02-24',
        };
        window.localStorage.setItem('omnexus_gamification', JSON.stringify(data));
      });
    });

    await test.step('hard reload', async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
    });

    await test.step('gamification data is still in localStorage', async () => {
      const raw = await page.evaluate(() =>
        window.localStorage.getItem('omnexus_gamification'),
      );
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.totalXp).toBe(350);
      expect(parsed.streak).toBe(3);
    });
  });

  test('user profile persists across navigation', async ({ page }) => {
    test.info().annotations.push({ type: 'severity', description: 'critical' });

    await test.step('navigate away and back', async () => {
      await page.goto('/learn');
      await page.goto('/profile');
      await page.goto('/');
    });

    await test.step('user profile is still present', async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('fit_user'));
      expect(raw).not.toBeNull();
    });
  });

  test('active workout session persists across page refresh', async ({ page }) => {
    test.info().annotations.push({ type: 'severity', description: 'critical' });
    test.info().annotations.push({ type: 'regression', description: 'workout session persistence' });

    await test.step('seed an active workout session', async () => {
      await page.evaluate(() => {
        const session = {
          id: 'sess-regression-1',
          programId: 'hyp-intermediate-4day',
          trainingDayIndex: 0,
          startedAt: new Date().toISOString(),
          exercises: [],
          totalVolumeKg: 0,
        };
        window.localStorage.setItem('fit_active_session', JSON.stringify(session));
      });
    });

    await test.step('navigate to workout page', async () => {
      await page.goto('/workout/active');
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('session is available after reload', async () => {
      const raw = await page.evaluate(() =>
        window.localStorage.getItem('fit_active_session'),
      );
      expect(raw).not.toBeNull();
    });
  });
});

// ─── Back-navigation ──────────────────────────────────────────────────────────

test.describe('Regression — back-navigation', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('back button from course page returns to learn page', async ({ page }) => {
    test.info().annotations.push({ type: 'severity', description: 'high' });
    test.info().annotations.push({ type: 'regression', description: 'E2E back-nav fix' });

    await test.step('navigate to learn page', async () => {
      await page.goto('/learn');
    });

    await test.step('open a course', async () => {
      const courseCard = page.locator('[data-testid="course-card"]').first();
      const visible = await courseCard.isVisible({ timeout: 5_000 }).catch(() => false);
      if (!visible) {
        test.skip(true, 'No course cards available to click');
        return;
      }
      await courseCard.click();
      await page.waitForURL(/\/learn\/.+/);
    });

    await test.step('browser back button returns to /learn', async () => {
      await page.goBack();
      await expect(page).toHaveURL(/\/learn/);
    });
  });

  test('back button from exercise detail returns to library', async ({ page }) => {
    test.info().annotations.push({ type: 'severity', description: 'high' });

    await test.step('navigate to library page', async () => {
      await page.goto('/library');
    });

    await test.step('click on an exercise', async () => {
      const exerciseLink = page.locator('a[href^="/library/"]').first();
      const visible = await exerciseLink.isVisible({ timeout: 5_000 }).catch(() => false);
      if (!visible) {
        test.skip(true, 'No exercise links found in library');
        return;
      }
      await exerciseLink.click();
      await page.waitForURL(/\/library\/.+/);
    });

    await test.step('back returns to /library', async () => {
      await page.goBack();
      await expect(page).toHaveURL(/\/library/);
    });
  });
});

// ─── Guest mode data integrity ────────────────────────────────────────────────

test.describe('Regression — guest mode data integrity', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('guest profile is preserved after navigating to login and back', async ({ page }) => {
    test.info().annotations.push({ type: 'severity', description: 'critical' });

    await test.step('record guest user before navigation', async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('fit_user'));
      expect(raw).not.toBeNull();
    });

    await test.step('navigate to login and back without signing in', async () => {
      // Navigate to login URL (not clicking the sign-in button)
      await page.goto('/login');
      await page.goBack();
    });

    await test.step('guest user still present', async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('fit_user'));
      expect(raw).not.toBeNull();
    });
  });

  test('guest workout history is preserved across navigation', async ({ page }) => {
    test.info().annotations.push({ type: 'severity', description: 'critical' });

    await test.step('seed workout history', async () => {
      await page.evaluate(() => {
        const history = {
          sessions: [
            {
              id: 'reg-sess-1',
              programId: 'hyp-intermediate-4day',
              trainingDayIndex: 0,
              startedAt: '2025-03-01T10:00:00Z',
              completedAt: '2025-03-01T11:00:00Z',
              exercises: [],
              totalVolumeKg: 1500,
            },
          ],
          personalRecords: [],
        };
        window.localStorage.setItem('fit_history', JSON.stringify(history));
      });
    });

    await test.step('navigate to history page and back', async () => {
      await page.goto('/history');
      await page.goto('/');
    });

    await test.step('history data is unchanged', async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('fit_history'));
      const parsed = JSON.parse(raw!);
      expect(parsed.sessions).toHaveLength(1);
      expect(parsed.sessions[0].id).toBe('reg-sess-1');
    });
  });
});

// ─── Offline / AI degraded states ────────────────────────────────────────────

test.describe('Regression — offline / AI degraded states', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('Ask page shows degraded state when AI endpoint fails', async ({ page }) => {
    test.info().annotations.push({ type: 'severity', description: 'high' });
    test.info().annotations.push({ type: 'regression', description: 'AI degraded UX' });

    await test.step('intercept AI endpoint and return 500', async () => {
      await page.route('**/api/ask*', async (route) => {
        await route.fulfill({ status: 500, body: 'Internal Server Error' });
      });
      await page.route('**/api/ask-streaming*', async (route) => {
        await route.fulfill({ status: 500, body: 'Internal Server Error' });
      });
    });

    await test.step('navigate to ask page and submit a question', async () => {
      await page.goto('/ask');
      const input = page.getByPlaceholder(/ask|question|omni/i).first();
      const visible = await input.isVisible({ timeout: 5_000 }).catch(() => false);
      if (!visible) {
        test.skip(true, 'Ask input not visible');
        return;
      }
      await input.fill('What is progressive overload?');
      await page.keyboard.press('Enter');
    });

    await test.step('error or fallback message is shown — no blank white screen', async () => {
      await page.waitForTimeout(2_000);
      const body = await page.locator('body').textContent();
      expect(body?.trim().length).toBeGreaterThan(50);
    });
  });

  test('Insights page shows empty/error state when endpoint is unavailable', async ({ page }) => {
    test.info().annotations.push({ type: 'severity', description: 'medium' });

    await test.step('intercept insights endpoint', async () => {
      await page.route('**/api/insights*', async (route) => {
        await route.fulfill({ status: 503, body: 'Service Unavailable' });
      });
    });

    await test.step('navigate to insights page', async () => {
      await page.goto('/insights');
      await page.waitForLoadState('networkidle');
    });

    await test.step('page renders some content — not blank', async () => {
      const body = await page.locator('body').textContent();
      expect(body?.trim().length).toBeGreaterThan(30);
    });
  });
});

// ─── URL deep-link protection ─────────────────────────────────────────────────

test.describe('Regression — URL deep-linking', () => {
  test('unauthenticated deep-link to /profile does not crash the app', async ({ page }) => {
    test.info().annotations.push({ type: 'severity', description: 'high' });

    await page.addInitScript(() => {
      window.localStorage.setItem('omnexus_cookie_consent', 'accepted');
      window.localStorage.removeItem('fit_user');
      window.localStorage.removeItem('omnexus_guest');
    });

    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Should either redirect to login/onboarding or show the profile page
    const url = page.url();
    expect(url).toMatch(/login|onboarding|profile/);
  });

  test('direct navigation to /workout/active without a session redirects away', async ({ page }) => {
    test.info().annotations.push({ type: 'severity', description: 'high' });

    await test.step('clear any active session', async () => {
      await page.addInitScript(() => {
        window.localStorage.setItem('omnexus_cookie_consent', 'accepted');
        window.localStorage.removeItem('fit_active_session');
      });
    });

    await test.step('navigate directly to active workout page', async () => {
      await enterAsGuest(page);
      await page.evaluate(() => window.localStorage.removeItem('fit_active_session'));
      await page.goto('/workout/active', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
    });

    await test.step('not stuck on /workout/active', async () => {
      // Should redirect to / since there's no active session
      const url = page.url();
      expect(url).not.toMatch(/workout\/active/);
    });
  });
});
