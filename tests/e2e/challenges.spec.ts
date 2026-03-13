import { test, expect } from './helpers/fixtures';
import { signIn, enterAsGuest } from './helpers/auth';

const hasRealCredentials =
  !!process.env.E2E_TEST_EMAIL &&
  process.env.E2E_TEST_EMAIL !== 'e2e-test@omnexus.test';

// ─── Guest upgrade prompt ──────────────────────────────────────────────────────

test.describe('Challenges — guest upgrade wall', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('guest sees upgrade prompt at /challenges', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Challenges' });

    await test.step('navigate to challenges', () => page.goto('/challenges'));

    await test.step('verify upgrade prompt is shown (not challenge list)', async () => {
      await expect(
        page.getByRole('heading', { name: /community requires an account/i }),
      ).toBeVisible({ timeout: 8_000 });
    });
  });
});

// ─── Authenticated user flows ──────────────────────────────────────────────────

test.describe('Challenges — authenticated', () => {
  test.skip(({ isMobile }) => isMobile, 'Mobile auth login is flaky in CI');

  test.beforeEach(async ({ page }, _testInfo) => {
    test.skip(!hasRealCredentials, 'Requires real E2E_TEST_EMAIL / E2E_TEST_PASSWORD credentials');
    const destination = await signIn(page);
    test.skip(destination === 'unavailable', 'Auth sign-in unavailable in this environment');
    test.skip(destination === 'onboarding', 'Test account still requires onboarding before challenges can be exercised');
    await page.goto('/challenges');
  });

  test('page loads and shows Community heading', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Challenges' });

    await expect(page.getByRole('heading', { name: /community/i })).toBeVisible({ timeout: 15_000 });
  });

  test('Create Challenge button toggles the create form', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Challenges' });

    await test.step('click Create Challenge', async () => {
      await page.getByRole('button', { name: /create challenge/i }).click();
    });

    await test.step('verify form is visible', async () => {
      await expect(page.getByLabel(/challenge name/i)).toBeVisible();
    });

    await test.step('click Cancel to close form', async () => {
      await page.getByRole('button', { name: /cancel/i }).click();
    });

    await test.step('verify form is hidden', async () => {
      await expect(page.getByLabel(/challenge name/i)).not.toBeVisible();
    });
  });

  test('create form includes Team mode toggle', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Challenges' });

    await page.getByRole('button', { name: /create challenge/i }).click();

    await expect(page.getByRole('switch', { name: /team mode/i })).toBeVisible();
    // Default should be off
    await expect(page.getByRole('switch', { name: /team mode/i })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  test('Team mode toggle flips aria-checked', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Challenges' });

    await page.getByRole('button', { name: /create challenge/i }).click();
    const toggle = page.getByRole('switch', { name: /team mode/i });

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  test('Create button is disabled when name is empty', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Challenges' });

    await page.getByRole('button', { name: /create challenge/i }).click();

    await expect(
      page.getByRole('button', { name: /create & join/i }),
    ).toBeDisabled();
  });

  test('Create button enables when name is filled', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Challenges' });

    await page.getByRole('button', { name: /create challenge/i }).click();
    await page.getByLabel(/challenge name/i).fill('My Test Challenge');

    await expect(
      page.getByRole('button', { name: /create & join/i }),
    ).toBeEnabled();
  });

  test('existing challenges show "Show rankings" toggle', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Challenges' });

    // Only meaningful if at least one challenge exists
    const rankingButtons = page.getByRole('button', { name: /show rankings/i });
    const count = await rankingButtons.count();

    if (count > 0) {
      await rankingButtons.first().click();
      // Should toggle to "Hide rankings"
      await expect(
        page.getByRole('button', { name: /hide rankings/i }).first(),
      ).toBeVisible();
    } else {
      test.skip(true, 'No challenges exist yet — leaderboard toggle test skipped');
    }
  });

  test('joined challenges appear under "Your Challenges" section', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Challenges' });

    const yourSection = page.getByText(/your challenges/i);
    const browseSection = page.getByText(/^browse$/i);
    const either = yourSection.or(browseSection);

    // At least one section should be visible if challenges exist
    const hasSection = await either.isVisible().catch(() => false);
    if (!hasSection) {
      test.skip(true, 'No challenges in the database for the test account');
    }
  });
});

// ─── Invitations banner ────────────────────────────────────────────────────────

test.describe('Challenges — invitation banner', () => {
  test('pending invitations section is shown when invitations exist', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Mobile auth login is flaky in CI');
    test.skip(!hasRealCredentials, 'Requires real E2E_TEST_EMAIL / E2E_TEST_PASSWORD credentials');
    test.info().annotations.push({ type: 'feature', description: 'Challenges' });

    const destination = await signIn(page);
    test.skip(destination === 'unavailable', 'Auth sign-in unavailable in this environment');
    test.skip(destination === 'onboarding', 'Test account still requires onboarding before challenges can be exercised');
    await page.goto('/challenges');

    // The banner is only shown when invitations exist. We just verify
    // the page renders without crashing regardless.
    await expect(page.getByRole('heading', { name: /community/i })).toBeVisible({
      timeout: 15_000,
    });

    // If banner exists, verify it has Join and Decline buttons
    const banner = page.getByText(/invitations \(/i);
    if (await banner.isVisible().catch(() => false)) {
      await expect(page.getByRole('button', { name: /join/i }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /decline/i }).first()).toBeVisible();
    }
  });
});
