import type { User } from '../types';

const LS_KEY = 'omnexus_tutorial_seen';
const AUTO_SHOW_WINDOW_MS = 30 * 60 * 1000;

function tutorialKey(userId?: string): string {
  return userId ? `${LS_KEY}:${userId}` : LS_KEY;
}

export function hasTutorialBeenSeen(userId?: string): boolean {
  try {
    if (userId) {
      return localStorage.getItem(tutorialKey(userId)) === 'true';
    }

    return localStorage.getItem(LS_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markTutorialSeen(userId?: string): void {
  try {
    if (userId) {
      localStorage.setItem(tutorialKey(userId), 'true');
      return;
    }

    localStorage.setItem(LS_KEY, 'true');
  } catch {
    // Ignore storage failures in restricted browser contexts.
  }
}

export function shouldAutoShowTutorial(user: Pick<User, 'id' | 'onboardedAt'> | null | undefined): boolean {
  if (!user || hasTutorialBeenSeen(user.id)) {
    return false;
  }

  const onboardedAt = Date.parse(user.onboardedAt);
  if (Number.isNaN(onboardedAt)) {
    return false;
  }

  return Date.now() - onboardedAt <= AUTO_SHOW_WINDOW_MS;
}