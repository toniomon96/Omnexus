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

/** Sign in via the login page and wait for the dashboard to load. */
export async function signIn(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Wait for dashboard to confirm successful login
  await page.waitForURL('/');
}

/** Clear localStorage and Supabase session to start fresh. */
export async function signOut(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('/login');
}

/** Enter the app as a guest (no Supabase account). */
export async function enterAsGuest(page: Page) {
  await page.goto('/guest');
  // Guest setup requires selecting a goal and experience level
  await page.getByRole('button', { name: /build muscle|muscle/i }).first().click();
  await page.getByRole('button', { name: /intermediate/i }).first().click();
  await page.getByRole('button', { name: /continue|start|get started/i }).first().click();
  await page.waitForURL('/');
}
