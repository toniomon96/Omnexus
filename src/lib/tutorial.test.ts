import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hasTutorialBeenSeen, markTutorialSeen, shouldAutoShowTutorial } from './tutorial';

const store: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    for (const key of Object.keys(store)) delete store[key];
  }),
};

vi.stubGlobal('localStorage', localStorageMock);

describe('tutorial helpers', () => {
  const now = Date.parse('2026-03-12T12:00:00.000Z');

  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks tutorial state per user id', () => {
    expect(hasTutorialBeenSeen('user-a')).toBe(false);
    expect(hasTutorialBeenSeen('user-b')).toBe(false);

    markTutorialSeen('user-a');

    expect(hasTutorialBeenSeen('user-a')).toBe(true);
    expect(hasTutorialBeenSeen('user-b')).toBe(false);
  });

  it('auto-shows tutorial for newly onboarded users when unseen', () => {
    const user = {
      id: 'user-new',
      onboardedAt: '2026-03-12T11:45:00.000Z',
    };

    expect(shouldAutoShowTutorial(user)).toBe(true);
  });

  it('does not auto-show tutorial if onboarding window elapsed', () => {
    const user = {
      id: 'user-old',
      onboardedAt: '2026-03-12T10:00:00.000Z',
    };

    expect(shouldAutoShowTutorial(user)).toBe(false);
  });

  it('handles storage failures safely', () => {
    const originalGetItem = localStorageMock.getItem;
    const originalSetItem = localStorageMock.setItem;

    localStorageMock.getItem = vi.fn(() => {
      throw new Error('storage blocked');
    });
    localStorageMock.setItem = vi.fn(() => {
      throw new Error('storage blocked');
    });

    expect(() => markTutorialSeen('user-safe')).not.toThrow();
    expect(hasTutorialBeenSeen('user-safe')).toBe(false);

    localStorageMock.getItem = originalGetItem;
    localStorageMock.setItem = originalSetItem;
  });
});
