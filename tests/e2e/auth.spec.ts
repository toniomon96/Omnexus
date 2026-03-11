import { test, expect } from './helpers/fixtures';
import { signIn, signOut } from './helpers/auth';

/** True when real test credentials have been configured (not placeholder values). */
const hasRealCredentials =
  !!process.env.E2E_TEST_EMAIL &&
  process.env.E2E_TEST_EMAIL !== 'e2e-test@your-domain.com' &&
  process.env.E2E_TEST_EMAIL !== 'e2e-test@omnexus.test';

test.describe('Authentication', () => {
  test('shows login page at /login', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Auth' });

    await test.step('navigate to login', () => page.goto('/login'));

    await test.step('verify form fields are visible', async () => {
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
    });
  });

  test('shows error for wrong credentials', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Auth' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });

    await test.step('navigate to login', () => page.goto('/login'));

    await test.step('submit wrong credentials', async () => {
      const uniqueWrongEmail = `wrong-${Date.now()}@example.com`;
      await page.getByLabel('Email').fill(uniqueWrongEmail);
      await page.locator('#password').fill('wrongpassword');
      await page.getByRole('button', { name: 'Sign in' }).click();
    });

    await test.step('verify error message is shown', async () => {
      await expect(
        page.getByText(/invalid|incorrect|not found|couldn'?t find an account|reset your password|create a free account|too many failed sign-in attempts|sign in failed/i),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test('redirects unauthenticated users from / to /login', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Auth' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });

    await test.step('clear any existing session', () => signOut(page));
    await test.step('navigate to protected route /', () => page.goto('/'));
    await test.step('verify redirect to public route', () =>
      page.waitForURL(/\/(login|onboarding|guest)/),
    );
  });

  test('signs in and lands in the app', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Mobile auth login is flaky in CI');
    test.skip(!hasRealCredentials, 'Requires real E2E_TEST_EMAIL / E2E_TEST_PASSWORD credentials');
    test.info().annotations.push({ type: 'feature', description: 'Auth' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });

    const destination = await test.step('sign in with valid credentials', () => signIn(page));
    test.skip(destination === 'unavailable', 'Auth sign-in unavailable in this environment');

    await test.step('verify the post-login destination is shown', async () => {
      if (destination === 'onboarding') {
        await expect(page).toHaveURL(/\/onboarding$/);
        await expect(page.getByRole('heading', { name: /what's your name\?/i })).toBeVisible({
          timeout: 10_000,
        });
        return;
      }

      await expect(page).toHaveURL('/');
      await expect(
        page.getByText(/good (morning|afternoon|evening)|today's workout|your program/i),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test('sign out clears session and redirects to login', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Mobile auth login is flaky in CI');
    test.skip(!hasRealCredentials, 'Requires real E2E_TEST_EMAIL / E2E_TEST_PASSWORD credentials');
    test.info().annotations.push({ type: 'feature', description: 'Auth' });

    const destination = await test.step('sign in', () => signIn(page));

    test.skip(destination === 'unavailable', 'Auth sign-in unavailable in this environment');
    test.skip(destination === 'onboarding', 'Test account still requires onboarding before sign-out flow can be exercised');

    await test.step('navigate to profile and sign out', async () => {
      await page.goto('/profile');
      // Wait for GuestOrAuthGuard to finish re-hydrating after the full page reload
      await page.waitForFunction(
        () => !document.querySelector('.animate-spin'),
        { timeout: 20_000 },
      ).catch(() => {});
      await page.getByRole('button', { name: /sign out|log out/i }).click();
    });

    await test.step('verify redirected to public route', () =>
      page.waitForURL(/\/(login|onboarding|guest)/),
    );

    await test.step('verify accessing dashboard redirects again', async () => {
      await page.goto('/');
      await page.waitForURL(/\/(login|onboarding|guest)/);
    });
  });
});

test.describe('Guest mode', () => {
  test('shows guest setup page at /guest', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Guest' });

    await test.step('navigate to /guest', () => page.goto('/guest'));

    await test.step('verify goal options are visible', async () => {
      await expect(page.getByText(/build muscle|lose fat|stay fit/i).first()).toBeVisible();
    });
  });

  test('guest user lands on dashboard after setup', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Guest' });
    test.info().annotations.push({ type: 'severity', description: 'critical' });

    await test.step('navigate to /guest', () => page.goto('/guest'));
    await test.step('select Build Muscle goal', () => page.getByText('Build Muscle').click());
    await test.step('proceed to experience level step', () =>
      page.getByRole('button', { name: /continue|next/i }).click(),
    );
    await test.step('select Beginner level', () => page.getByText('Beginner').click());
    await test.step('complete setup', () =>
      page.getByRole('button', { name: /start|get started|continue/i }).click(),
    );
    await test.step('verify dashboard is shown', () => page.waitForURL('/'));
  });

  test('guest user data persists on refresh', async ({ page }) => {
    test.info().annotations.push({ type: 'feature', description: 'Guest' });
    test.info().annotations.push({ type: 'severity', description: 'high' });

    await test.step('complete guest setup', async () => {
      await page.goto('/guest');
      await page.getByText('Lose Fat').click();
      await page.getByRole('button', { name: /continue|next/i }).click();
      await page.getByText('Intermediate').click();
      await page.getByRole('button', { name: /start|get started|continue/i }).click();
      await page.waitForURL('/');
    });

    await test.step('reload the page', () => page.reload());

    await test.step('verify still on dashboard (not redirected to login)', async () => {
      await expect(page).toHaveURL('/');
    });
  });
});
