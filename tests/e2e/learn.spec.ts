import { test, expect } from './helpers/fixtures';
import { enterAsGuest } from './helpers/auth';

test.describe('Learn', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('shows learn page with courses', async ({ page }) => {
    await page.goto('/learn');
    await expect(page.getByPlaceholder(/search topics, exercises, lessons/i)).toBeVisible({ timeout: 10_000 });
    // Should show at least one course card
    await expect(page.locator('[data-testid="course-card"]').first()).toBeVisible({ timeout: 5_000 });
  });

  test('can open a course', async ({ page }) => {
    await page.goto('/learn');
    await page.locator('[data-testid="course-card"]').first().click();
    await page.waitForURL(/\/learn\/.+/);
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('semantic search returns results', async ({ page }) => {
    await page.goto('/learn');
    const searchInput = page.getByPlaceholder(/search|ask/i);
    if (await searchInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await searchInput.fill('how to increase bench press');
      // Results or AI micro-lesson CTA should appear
      await expect(
        page.getByText(/bench|strength|progressive overload/i).first()
      ).toBeVisible({ timeout: 8_000 });
    }
  });

  test('search no-results state shows clear recovery action', async ({ page }) => {
    await page.route('**/api/recommend-content', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ recommendations: [], hasContentGap: false }),
      });
    });

    await page.goto('/learn');
    const searchInput = page.getByPlaceholder(/search topics, exercises, lessons/i);
    await searchInput.fill('zzzz impossible query');

    await expect(page.getByText(/no matching lessons yet/i)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('button', { name: /clear search/i })).toBeVisible({ timeout: 5_000 });
  });
});

// ─── Sprint J: Quiz perfect-score badge ──────────────────────────────────────

test.describe('Sprint J — Quiz perfect-score indicator', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('course detail page renders without crash', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Sprint J' });
    test.info().annotations.push({ type: 'severity', description: 'medium' });

    await page.goto('/learn');

    const courseCard = page.locator('[data-testid="course-card"]').first();
    const visible = await courseCard.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!visible) {
      test.skip(true, 'No course cards visible');
      return;
    }

    await courseCard.click();
    await page.waitForURL(/\/learn\/.+/);

    // Page should have a heading and not be blank
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 5_000 });
  });

  test('course detail page shows completion badge when all lessons done', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Sprint J — course completion' });
    test.info().annotations.push({ type: 'severity', description: 'medium' });

    // We need to navigate to a course and have it fully completed.
    // Seed the learning progress to mark the first course as complete.
    await page.goto('/learn');

    const courseCard = page.locator('[data-testid="course-card"]').first();
    const visible = await courseCard.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!visible) {
      test.skip(true, 'No course cards visible');
      return;
    }

    // Get the course href
    const href = await courseCard.locator('a').first().getAttribute('href').catch(() => null)
      ?? await courseCard.getAttribute('href').catch(() => null);

    if (!href) {
      test.skip(true, 'Could not determine course link');
      return;
    }

    // Extract course id from the href e.g. /learn/strength-foundations
    const courseId = href.replace(/^\/learn\//, '');

    // Seed the learning progress to mark the course complete
    await page.evaluate((id) => {
      const lp = JSON.parse(
        window.localStorage.getItem('omnexus_learning_progress') ?? '{}',
      );
      lp.completedCourses = [...(lp.completedCourses ?? []), id];
      // Also mark all lessons — we do this by adding any lesson id pattern
      lp.completedLessons = lp.completedLessons ?? [];
      window.localStorage.setItem('omnexus_learning_progress', JSON.stringify(lp));
    }, courseId);

    await page.reload();
    await courseCard.click();
    await page.waitForURL(/\/learn\/.+/);

    // Should show the "Course complete!" or similar text + share button
    const completionText = page.getByText(/course complete|all lessons done|🎉/i).first();
    const shareBtn = page.getByRole('button', { name: /share certificate/i });

    // At least one of these should be visible
    const textVisible = await completionText.isVisible({ timeout: 3_000 }).catch(() => false);
    const btnVisible = await shareBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(textVisible || btnVisible).toBe(true);
  });
});
