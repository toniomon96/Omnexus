import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotificationsUpdated,
} from '../lib/notifications';
import { useEffect, useMemo, useState } from 'react';
import type { NotificationItem } from '../types';
import { trackFeatureEntry } from '../lib/analytics';

const KIND_LABEL: Record<NotificationItem['kind'], string> = {
  reminder: 'Reminder',
  guidance: 'Guidance',
  insight: 'Insight',
  feature: 'Feature',
  training: 'Training',
  nutrition: 'Nutrition',
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>(() => getNotifications());

  useEffect(() => {
    const unsubscribe = subscribeToNotificationsUpdated(() => {
      setItems(getNotifications());
    });
    return unsubscribe;
  }, []);

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  return (
    <AppShell>
      <TopBar title="Notifications" showBack />
      <div className="px-4 pt-4 pb-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {unreadCount > 0
              ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`
              : 'You are all caught up'}
          </p>
          {items.length > 0 && unreadCount > 0 && (
            <button
              type="button"
              onClick={() => {
                markAllNotificationsRead();
                setItems(getNotifications());
              }}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              <CheckCheck size={13} />
              Mark all read
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <Card className="py-8 text-center">
            <Bell size={28} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">No notifications yet</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Omnexus will add training reminders, guidance, and insights here.
            </p>
          </Card>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (!item.read) {
                  markNotificationRead(item.id);
                  setItems(getNotifications());
                }
                if (item.route) {
                  trackFeatureEntry({
                    source: 'notifications',
                    destination: item.route,
                    label: item.id,
                  });
                  navigate(item.route);
                }
              }}
              className="w-full text-left"
            >
              <Card className={item.read ? 'opacity-80' : 'border-brand-400/40 bg-brand-50/40 dark:bg-brand-900/10'}>
                <div className="flex items-start gap-3">
                  <span
                    className={[
                      'mt-1 h-2.5 w-2.5 rounded-full shrink-0',
                      item.read ? 'bg-slate-300 dark:bg-slate-700' : 'bg-brand-500',
                    ].join(' ')}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">{KIND_LABEL[item.kind]}</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.message}</p>
                    {item.actionLabel && item.route && (
                      <p className="text-[11px] font-semibold text-brand-500 mt-1.5">{item.actionLabel} →</p>
                    )}
                  </div>
                </div>
              </Card>
            </button>
          ))
        )}
      </div>
    </AppShell>
  );
}
