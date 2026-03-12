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

const DEFAULT_GUEST_USER = {
  id: 'guest_e2e',
  name: 'Guest',
  goal: 'hypertrophy',
  experienceLevel: 'intermediate',
  activeProgramId: 'hyp-intermediate-4day',
  onboardedAt: '2026-03-01T12:00:00.000Z',
  theme: 'dark',
  isGuest: true,
} as const;

const EMPTY_HISTORY = { sessions: [], personalRecords: [] };
const EMPTY_LEARNING_PROGRESS = {
  completedLessons: [],
  completedModules: [],
  completedCourses: [],
  quizScores: {},
  lastActivityAt: '',
};

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

async function seedGuestState(page: Page) {
  await page.context().clearCookies();
  await page.addInitScript(({ guestUser, history, learningProgress }) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('omnexus_cookie_consent', 'accepted');
    window.localStorage.setItem('fit_user', JSON.stringify(guestUser));
    window.localStorage.setItem('omnexus_guest', JSON.stringify(guestUser));
    window.localStorage.setItem('fit_history', JSON.stringify(history));
    window.localStorage.setItem('omnexus_learning_progress', JSON.stringify(learningProgress));
    window.localStorage.setItem('omnexus_weight_unit', JSON.stringify('lbs'));
    window.localStorage.setItem('fit_theme', JSON.stringify('dark'));
    window.localStorage.setItem('omnexus_experience_mode', JSON.stringify({ [guestUser.id]: 'guided' }));
  }, {
    guestUser: DEFAULT_GUEST_USER,
    history: EMPTY_HISTORY,
    learningProgress: EMPTY_LEARNING_PROGRESS,
  });
}

/** Enter the app as a guest (no Supabase account). */
export async function enterAsGuest(page: Page) {
  await seedGuestState(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForURL('/');
  await page.waitForFunction(() => {
    const hasGuestProfile = Boolean(window.localStorage.getItem('omnexus_guest'));
    const hasGuestUser = Boolean(window.localStorage.getItem('fit_user'));
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    const isLoading = Boolean(document.querySelector('.animate-spin'));
    const bodyText = document.body?.innerText ?? '';

    return hasGuestProfile
      && hasGuestUser
      && path !== '/login'
      && !isLoading
      && bodyText.trim().length > 0;
  }, { timeout: 10_000 });
}
