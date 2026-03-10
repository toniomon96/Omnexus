export interface NotificationPreferences {
  push_enabled: boolean;
  training_reminders_enabled: boolean;
  missed_day_enabled: boolean;
  community_enabled: boolean;
  progress_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start_local: number;
  quiet_hours_end_local: number;
  preferred_hour_local: number;
  timezone: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  push_enabled: true,
  training_reminders_enabled: true,
  missed_day_enabled: true,
  community_enabled: true,
  progress_enabled: true,
  quiet_hours_enabled: false,
  quiet_hours_start_local: 22,
  quiet_hours_end_local: 7,
  preferred_hour_local: 18,
  timezone: 'UTC',
};

export function getLocalHour(timezone: string, now = new Date()): number {
  try {
    const formatted = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      hour12: false,
      timeZone: timezone,
    }).format(now);
    const hour = Number(formatted);
    if (Number.isInteger(hour) && hour >= 0 && hour <= 23) return hour;
  } catch {
    // Fall back to UTC if timezone is invalid.
  }
  return now.getUTCHours();
}

export function isPreferredHour(pref: NotificationPreferences, now = new Date()): boolean {
  return getLocalHour(pref.timezone, now) === pref.preferred_hour_local;
}

export function isWithinQuietHours(pref: NotificationPreferences, now = new Date()): boolean {
  if (!pref.quiet_hours_enabled) return false;
  const localHour = getLocalHour(pref.timezone, now);
  const start = pref.quiet_hours_start_local;
  const end = pref.quiet_hours_end_local;

  if (start === end) return true;
  if (start < end) {
    return localHour >= start && localHour < end;
  }
  return localHour >= start || localHour < end;
}

export function canSendNotificationNow(pref: NotificationPreferences, now = new Date()): boolean {
  return !isWithinQuietHours(pref, now);
}

export async function getPreferencesMap(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  userIds: string[],
): Promise<Map<string, NotificationPreferences>> {
  const map = new Map<string, NotificationPreferences>();
  for (const userId of userIds) {
    map.set(userId, { ...DEFAULT_NOTIFICATION_PREFERENCES });
  }

  if (userIds.length === 0) return map;

  const { data, error } = await supabaseAdmin
    .from('notification_preferences')
    .select('user_id, push_enabled, training_reminders_enabled, missed_day_enabled, community_enabled, progress_enabled, quiet_hours_enabled, quiet_hours_start_local, quiet_hours_end_local, preferred_hour_local, timezone')
    .in('user_id', userIds);

  if (error || !data) return map;

  for (const row of data) {
    const userId = row.user_id as string;
    map.set(userId, {
      push_enabled: row.push_enabled ?? true,
      training_reminders_enabled: row.training_reminders_enabled ?? true,
      missed_day_enabled: row.missed_day_enabled ?? true,
      community_enabled: row.community_enabled ?? true,
      progress_enabled: row.progress_enabled ?? true,
      quiet_hours_enabled: row.quiet_hours_enabled ?? false,
      quiet_hours_start_local: typeof row.quiet_hours_start_local === 'number' ? row.quiet_hours_start_local : 22,
      quiet_hours_end_local: typeof row.quiet_hours_end_local === 'number' ? row.quiet_hours_end_local : 7,
      preferred_hour_local: typeof row.preferred_hour_local === 'number' ? row.preferred_hour_local : 18,
      timezone: typeof row.timezone === 'string' && row.timezone ? row.timezone : 'UTC',
    });
  }

  return map;
}
