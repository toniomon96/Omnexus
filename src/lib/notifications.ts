import type { NotificationItem } from '../types';

const KEY = 'omnexus_notifications';
const UPDATE_EVENT = 'omnexus:notifications-updated';

function emitUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(UPDATE_EVENT));
  }
}

function readItems(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as NotificationItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeItems(items: NotificationItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Ignore quota or private-mode write failures.
  }
  emitUpdate();
}

function buildStarterItems(): NotificationItem[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'welcome-guidance',
      title: 'Welcome to Omnexus',
      message: 'Start simple: do one guided workout and one nutrition check-in this week.',
      kind: 'guidance',
      route: '/guided-pathways',
      actionLabel: 'Open pathways',
      createdAt: now,
      read: false,
    },
    {
      id: 'nutrition-nudge',
      title: 'Nutrition is ready',
      message: 'Open Nutrition to generate a beginner plan with practical daily tips.',
      kind: 'nutrition',
      route: '/nutrition',
      actionLabel: 'Open nutrition',
      createdAt: now,
      read: false,
    },
    {
      id: 'insight-hint',
      title: 'Insights unlock after workouts',
      message: 'Log a few sessions and Omnexus will explain your trends in plain language.',
      kind: 'insight',
      route: '/insights',
      actionLabel: 'View insights',
      createdAt: now,
      read: false,
    },
    {
      id: 'movement-demo-hint',
      title: 'Need form help?',
      message: 'In active workouts, tap “Show demo” on each exercise for a quick movement video.',
      kind: 'training',
      route: '/train',
      actionLabel: 'Start training',
      createdAt: now,
      read: false,
    },
  ];
}

export function getNotifications(): NotificationItem[] {
  const existing = readItems();
  if (existing.length > 0) return existing;
  const seeded = buildStarterItems();
  writeItems(seeded);
  return seeded;
}

export function getUnreadNotificationCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

export function markNotificationRead(id: string) {
  const updated = getNotifications().map((item) =>
    item.id === id ? { ...item, read: true } : item,
  );
  writeItems(updated);
}

export function markAllNotificationsRead() {
  const updated = getNotifications().map((item) => ({ ...item, read: true }));
  writeItems(updated);
}

export function subscribeToNotificationsUpdated(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = () => callback();
  window.addEventListener(UPDATE_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(UPDATE_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}
