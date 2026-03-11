import type { Page } from '@playwright/test';

/**
 * Shared test credentials — set these in .env.test or as environment variables.
 * Never use real user accounts for E2E tests; create dedicated test accounts.
 */
export const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL ?? 'e2e-test@omnexus.test',
  password: process.env.E2E_TEST_PASSWORD ?? 'test-password-123',
  name: 'Test User',
};

export type SignInDestination = 'dashboard' | 'onboarding' | 'unavailable';

function normalizePathname(rawUrl: string) {
  const pathname = new URL(rawUrl).pathname.replace(/\/+$/, '');
  return pathname || '/';
}

export function isOnboardingUrl(rawUrl: string) {
  return normalizePathname(rawUrl) === '/onboarding';
}

/** Sign in via the login page and wait for the dashboard to fully load. */
export async function signIn(page: Page, email = TEST_USER.email, password = TEST_USER.password): Promise<SignInDestination> {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('omnexus_cookie_consent', 'accepted');
  });
  await page.getByLabel('Email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Fail fast in CI/mobile instead of consuming the full test timeout budget.
  let navigated = false;
  try {
    await page.waitForURL((url) => {
      const pathname = url.pathname.replace(/\/+$/, '') || '/';
      return pathname !== '/login' && pathname !== '/auth/callback';
    }, { timeout: 8_000 });
    navigated = true;
  } catch {
    const authError = await page
      .locator('p')
      .filter({ hasText: /sign in failed|invalid|too many failed sign-in attempts|email not confirmed/i })
      .first()
      .textContent()
      .catch(() => null);
    if (authError) {
      return 'unavailable';
    }
  }

  if (!navigated) {
    return 'unavailable';
  }

  if (isOnboardingUrl(page.url())) {
    return 'onboarding' as const;
  }

  // Wait for app hydration to complete — the loading spinner disappears once
  // GuestOrAuthGuard has fetched the profile and populated state.user.
  await page.waitForFunction(
    () => !document.querySelector('.animate-spin'),
    { timeout: 10_000 },
  ).catch(() => { /* spinner may already be gone */ });

  return 'dashboard' as const;
}

/** Clear localStorage and Supabase session to start fresh. */
export async function signOut(page: Page) {
  // Navigate first so localStorage is accessible (about:blank blocks it).
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Re-accept cookie consent so it doesn't block subsequent interactions.
    localStorage.setItem('omnexus_cookie_consent', 'accepted');
  });
}

/** Enter the app as a guest (no Supabase account). */
export async function enterAsGuest(page: Page) {
  // Ensure each test starts from a clean unauthenticated state.
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('omnexus_cookie_consent', 'accepted');
  });

  await page.goto('/guest');
  // Step 0: select a goal, then advance to step 1 with "Next"
  await page.getByRole('button', { name: /build muscle/i }).first().click();
  await page.getByRole('button', { name: /^next$/i }).click();
  // Step 1: select experience level, then finish
  await page.getByRole('button', { name: /intermediate/i }).first().click();
  await page.getByRole('button', { name: /start training/i }).click();
  await page.waitForURL('/');
}
