import type { User } from '../types';

const LS_KEY = 'omnexus_tutorial_seen';
const AUTO_SHOW_WINDOW_MS = 30 * 60 * 1000;

export function hasTutorialBeenSeen(): boolean {
  return localStorage.getItem(LS_KEY) === 'true';
}

export function markTutorialSeen(): void {
  localStorage.setItem(LS_KEY, 'true');
}

export function shouldAutoShowTutorial(user: Pick<User, 'onboardedAt'> | null | undefined): boolean {
  if (!user || hasTutorialBeenSeen()) {
    return false;
  }

  const onboardedAt = Date.parse(user.onboardedAt);
  if (Number.isNaN(onboardedAt)) {
    return false;
  }

  return Date.now() - onboardedAt <= AUTO_SHOW_WINDOW_MS;
}