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

/** Sign in via the login page and wait for the dashboard to fully load. */
export async function signIn(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Wait for redirect to dashboard
  await page.waitForURL('/');
  // Wait for app hydration to complete — the loading spinner disappears once
  // GuestOrAuthGuard has fetched the profile and populated state.user.
  await page.waitForFunction(
    () => !document.querySelector('.animate-spin'),
    { timeout: 20_000 },
  ).catch(() => { /* spinner may already be gone */ });
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
  await page.goto('/guest');
  // Step 0: select a goal, then advance to step 1 with "Next"
  await page.getByRole('button', { name: /build muscle/i }).first().click();
  await page.getByRole('button', { name: /^next$/i }).click();
  // Step 1: select experience level, then finish
  await page.getByRole('button', { name: /intermediate/i }).first().click();
  await page.getByRole('button', { name: /start training/i }).click();
  await page.waitForURL('/');
}
