import type { Session } from '@supabase/supabase-js';
import type { ExperienceLevel, Goal, User } from '../types';
import { apiBase } from './api';
import { getProfileById } from './dbHydration';
import { markTutorialSeen } from './tutorial';
import { getGuestProfile, getTheme } from '../utils/localStorage';

function fallbackName(session: Session) {
  const guestProfile = getGuestProfile();
  if (guestProfile?.name?.trim()) {
    return guestProfile.name.trim();
  }

  const metadata = session.user.user_metadata;
  const candidate = [metadata?.name, metadata?.full_name, metadata?.user_name]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0);
  if (candidate) {
    return candidate.trim();
  }

  const emailPrefix = session.user.email?.split('@')[0]?.trim();
  if (emailPrefix) {
    return emailPrefix.slice(0, 100);
  }

  return 'Omnexus User';
}

function fallbackGoal(): Goal {
  return getGuestProfile()?.goal ?? 'general-fitness';
}

function fallbackExperienceLevel(): ExperienceLevel {
  return getGuestProfile()?.experienceLevel ?? 'beginner';
}

function mapProfileToUser(profile: NonNullable<Awaited<ReturnType<typeof getProfileById>>>): User {
  return {
    id: profile.id,
    name: profile.name,
    goal: profile.goal,
    experienceLevel: profile.experience_level,
    activeProgramId: profile.active_program_id ?? undefined,
    onboardedAt: profile.created_at,
    theme: getTheme(),
    avatarUrl: profile.avatar_url ?? null,
  };
}

async function createFallbackProfile(session: Session) {
  const response = await fetch(`${apiBase}/api/setup-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      userId: session.user.id,
      name: fallbackName(session),
      goal: fallbackGoal(),
      experienceLevel: fallbackExperienceLevel(),
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Profile recovery failed with status ${response.status}`);
  }

  // Recovered accounts are legacy/broken-account repairs, not true first-run onboarding.
  markTutorialSeen();
}

export async function ensureProfileUser(session: Session): Promise<User | null> {
  const existing = await getProfileById(session.user.id);
  if (existing) {
    return mapProfileToUser(existing);
  }

  await createFallbackProfile(session);

  const recovered = await getProfileById(session.user.id);
  return recovered ? mapProfileToUser(recovered) : null;
}