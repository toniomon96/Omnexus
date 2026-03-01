import { test, expect } from '@playwright/test';
import { signIn, signOut, TEST_USER } from './helpers/auth';

test.describe('Authentication', () => {
  test('shows login page at /login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('shows error for wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText(/invalid|incorrect|not found/i)).toBeVisible({ timeout: 10_000 });
  });

  test('redirects unauthenticated users from / to /login', async ({ page }) => {
    // Clear any existing session
    await signOut(page);
    await page.goto('/');
    await page.waitForURL(/\/(login|onboarding|guest)/);
  });

  test('signs in and lands on dashboard', async ({ page }) => {
    await signIn(page);
    await expect(page).toHaveURL('/');
    // Dashboard should show the user's name or a greeting
    await expect(page.getByText(/good (morning|afternoon|evening)|today's workout|your program/i)).toBeVisible({ timeout: 10_000 });
  });

  test('sign out clears session and redirects to login', async ({ page }) => {
    await signIn(page);
    // Navigate to profile page to find sign out
    await page.goto('/profile');
    await page.getByRole('button', { name: /sign out|log out/i }).click();
    await page.waitForURL(/\/(login|onboarding|guest)/);
    // Attempting to go back to dashboard should redirect
    await page.goto('/');
    await page.waitForURL(/\/(login|onboarding|guest)/);
  });
});

test.describe('Guest mode', () => {
  test('shows guest setup page at /guest', async ({ page }) => {
    await page.goto('/guest');
    await expect(page.getByText(/build muscle|lose fat|stay fit/i).first()).toBeVisible();
  });

  test('guest user lands on dashboard after setup', async ({ page }) => {
    await page.goto('/guest');
    // Select a goal
    await page.getByText('Build Muscle').click();
    // Continue to experience level step
    await page.getByRole('button', { name: /continue/i }).click();
    // Select experience level
    await page.getByText('Beginner').click();
    await page.getByRole('button', { name: /start|get started|continue/i }).click();
    await page.waitForURL('/');
  });

  test('guest user data persists on refresh', async ({ page }) => {
    await page.goto('/guest');
    await page.getByText('Lose Fat').click();
    await page.getByRole('button', { name: /continue/i }).click();
    await page.getByText('Intermediate').click();
    await page.getByRole('button', { name: /start|get started|continue/i }).click();
    await page.waitForURL('/');
    // Refresh
    await page.reload();
    // Should still be on dashboard, not redirected to login
    await expect(page).toHaveURL('/');
  });
});
