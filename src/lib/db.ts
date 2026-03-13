import type {
  WorkoutSession,
  PersonalRecord,
  WorkoutHistory,
  Goal,
  ExperienceLevel,
  FriendProfile,
  FriendshipWithProfile,
  LeaderboardEntry,
  Challenge,
  FeedSession,
  LearningProgress,
  Program,
  NutritionLog,
  Measurement,
  MeasurementMetric,
  WorkoutTemplate,
  FeedReaction,
  ReactionEmoji,
  UserTrainingProfile,
  BlockMission,
  AiChallenge,
  ChallengeParticipant,
  ChallengeInvitation,
  NotificationPreferences,
} from '../types';

let supabasePromise: Promise<(typeof import('./supabase'))['supabase']> | null = null;

async function getSupabase() {
  supabasePromise ??= import('./supabase').then((module) => module.supabase);
  return supabasePromise;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSession(row: any): WorkoutSession {
  return {
    id: row.id,
    programId: row.program_id,
    trainingDayIndex: row.training_day_index,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
    durationSeconds: row.duration_seconds ?? undefined,
    exercises: row.exercises,
    totalVolumeKg: row.total_volume_kg,
    notes: row.notes ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPR(row: any): PersonalRecord {
  return {
    exerciseId: row.exercise_id,
    weight: row.weight,
    reps: row.reps,
    achievedAt: row.achieved_at,
    sessionId: row.session_id,
  };
}

// ─── Workout History ──────────────────────────────────────────────────────────

export async function fetchHistory(userId: string): Promise<WorkoutHistory> {
  const supabase = await getSupabase();
  const [sessionsResult, prsResult] = await Promise.all([
    supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: true }),
    supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId),
  ]);

  if (sessionsResult.error) throw new Error(`[fetchHistory] sessions: ${sessionsResult.error.message}`);
  if (prsResult.error) throw new Error(`[fetchHistory] personal records: ${prsResult.error.message}`);

  return {
    sessions: (sessionsResult.data ?? []).map(mapSession),
    personalRecords: (prsResult.data ?? []).map(mapPR),
  };
}

export async function upsertSession(
  session: WorkoutSession,
  userId: string,
): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.from('workout_sessions').upsert({
    id: session.id,
    user_id: userId,
    program_id: session.programId,
    training_day_index: session.trainingDayIndex,
    started_at: session.startedAt,
    completed_at: session.completedAt,
    duration_seconds: session.durationSeconds,
    exercises: session.exercises,
    total_volume_kg: session.totalVolumeKg,
    notes: session.notes,
  });
  if (error) throw new Error(`[upsertSession] ${error.message}`);
}

export async function upsertPersonalRecords(
  prs: PersonalRecord[],
  userId: string,
): Promise<void> {
  if (prs.length === 0) return;
  const supabase = await getSupabase();
  const { error } = await supabase.from('personal_records').upsert(
    prs.map((pr) => ({
      user_id: userId,
      exercise_id: pr.exerciseId,
      weight: pr.weight,
      reps: pr.reps,
      achieved_at: pr.achievedAt,
      session_id: pr.sessionId,
    })),
    { onConflict: 'user_id,exercise_id' },
  );
  if (error) throw new Error(`[upsertPersonalRecords] ${error.message}`);
}

// ─── Learning Progress ────────────────────────────────────────────────────────

export async function fetchLearningProgress(
  userId: string,
): Promise<LearningProgress | null> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from('learning_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!data) return null;
  return {
    completedLessons: data.completed_lessons ?? [],
    completedModules: data.completed_modules ?? [],
    completedCourses: data.completed_courses ?? [],
    quizScores: data.quiz_scores ?? {},
    lastActivityAt: data.last_activity_at ?? '',
  };
}

export async function upsertLearningProgress(
  progress: LearningProgress,
  userId: string,
): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.from('learning_progress').upsert({
    user_id: userId,
    completed_lessons: progress.completedLessons,
    completed_modules: progress.completedModules,
    completed_courses: progress.completedCourses,
    quiz_scores: progress.quizScores,
    last_activity_at: progress.lastActivityAt || new Date().toISOString(),
  });
  if (error) throw new Error(`[upsertLearningProgress] ${error.message}`);
}

// ─── Custom Programs ──────────────────────────────────────────────────────────

export async function fetchCustomPrograms(userId: string): Promise<Program[]> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from('custom_programs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).filter((row: any) => row.data != null).map((row: any) => row.data as Program);
}

export async function upsertCustomProgram(
  program: Program,
  userId: string,
): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.from('custom_programs').upsert({
    id: program.id,
    user_id: userId,
    data: program,
  });
  if (error) throw new Error(`[upsertCustomProgram] ${error.message}`);
}

export async function deleteCustomProgramDb(id: string): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.from('custom_programs').delete().eq('id', id);
  if (error) throw new Error(`[deleteCustomProgramDb] ${error.message}`);
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function updateAvatarUrl(userId: string, url: string): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', userId);
  if (error) throw new Error(`updateAvatarUrl: ${error.message}`);
}

interface ProfileRecord {
  id: string;
  name: string;
  goal: Goal;
  experience_level: ExperienceLevel;
  active_program_id: string | null;
  created_at: string;
  avatar_url: string | null;
}

export async function getProfileById(userId: string): Promise<ProfileRecord | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, goal, experience_level, active_program_id, created_at, avatar_url')
    .eq('id', userId)
    .maybeSingle<ProfileRecord>();

  if (error) {
    throw new Error(`[getProfileById] ${error.message}`);
  }

  return data ?? null;
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('push_enabled, training_reminders_enabled, missed_day_enabled, community_enabled, progress_enabled, preferred_hour_local, timezone')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`[getNotificationPreferences] ${error.message}`);
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  return {
    pushEnabled: data?.push_enabled ?? true,
    trainingRemindersEnabled: data?.training_reminders_enabled ?? true,
    missedDayEnabled: data?.missed_day_enabled ?? true,
    communityEnabled: data?.community_enabled ?? true,
    progressEnabled: data?.progress_enabled ?? true,
    preferredHourLocal: data?.preferred_hour_local ?? 18,
    timezone: data?.timezone ?? timezone,
  };
}

export async function upsertNotificationPreferences(
  userId: string,
  prefs: NotificationPreferences,
): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.from('notification_preferences').upsert({
    user_id: userId,
    push_enabled: prefs.pushEnabled,
    training_reminders_enabled: prefs.trainingRemindersEnabled,
    missed_day_enabled: prefs.missedDayEnabled,
    community_enabled: prefs.communityEnabled,
    progress_enabled: prefs.progressEnabled,
    preferred_hour_local: prefs.preferredHourLocal,
    timezone: prefs.timezone,
  });

  if (error) {
    throw new Error(`[upsertNotificationPreferences] ${error.message}`);
  }
}

// ─── Community: Friendships ───────────────────────────────────────────────────

export async function searchProfiles(
  query: string,
  excludeId: string,
): Promise<FriendProfile[]> {
  if (!query.trim()) return [];
  const supabase = await getSupabase();
  const escaped = query.trim().replace(/[%_\\]/g, '\\$&');
  const { data } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .ilike('name', `%${escaped}%`)
    .neq('id', excludeId)
    .eq('is_public', true)
    .limit(10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    avatarUrl: r.avatar_url ?? null,
  }));
}

export async function getFriendships(
  userId: string,
): Promise<FriendshipWithProfile[]> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from('friendships')
    .select('id, status, requester_id, addressee_id')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .neq('status', 'blocked');

  if (!data || data.length === 0) return [];

  // Collect all unique peer IDs to fetch their profiles in one query
  const peerIds = data.map((row) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row as any).requester_id === userId
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (row as any).addressee_id
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (row as any).requester_id,
  );

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', peerIds);

  const profileMap = Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profiles ?? []).map((p: any) => [p.id, p]),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => {
    const isRequester = row.requester_id === userId;
    const friendId = isRequester ? row.addressee_id : row.requester_id;
    const profile = profileMap[friendId] ?? { id: friendId, name: 'Unknown', avatar_url: null };
    return {
      id: row.id,
      status: row.status as 'pending' | 'accepted' | 'blocked',
      direction: isRequester ? ('sent' as const) : ('received' as const),
      friend: { id: profile.id, name: profile.name, avatarUrl: profile.avatar_url ?? null },
    };
  });
}

export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string,
): Promise<void> {
  const supabase = await getSupabase();
  await supabase
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId });
}

export async function respondFriendRequest(
  id: string,
  status: 'accepted' | 'blocked',
): Promise<void> {
  const supabase = await getSupabase();
  await supabase.from('friendships').update({ status }).eq('id', id);
}

export async function removeFriendship(id: string): Promise<void> {
  const supabase = await getSupabase();
  await supabase.from('friendships').delete().eq('id', id);
}

// ─── Community: Leaderboard ───────────────────────────────────────────────────

export async function getWeeklyLeaderboard(
  userId: string,
): Promise<LeaderboardEntry[]> {
  const supabase = await getSupabase();
  const { data: friendships } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted');

  const friendIds = (friendships ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (f: any) => (f.requester_id === userId ? f.addressee_id : f.requester_id),
  );
  const allIds = [userId, ...friendIds];

  // Monday of current week
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);

  const [sessionsResult, profilesResult] = await Promise.all([
    supabase
      .from('workout_sessions')
      .select('user_id, total_volume_kg')
      .in('user_id', allIds)
      .gte('started_at', weekStart.toISOString())
      .not('completed_at', 'is', null),
    supabase.from('profiles').select('id, name').in('id', allIds),
  ]);

  const volumeMap: Record<string, number> = {};
  for (const s of sessionsResult.data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = s as any;
    volumeMap[row.user_id] = (volumeMap[row.user_id] ?? 0) + (row.total_volume_kg ?? 0);
  }

  return (profilesResult.data ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => ({
      userId: p.id,
      name: p.name,
      weeklyVolumeKg: Math.round(volumeMap[p.id] ?? 0),
      isCurrentUser: p.id === userId,
    }))
    .sort((a, b) => b.weeklyVolumeKg - a.weeklyVolumeKg);
}

// ─── Community: Challenges ────────────────────────────────────────────────────

export async function getChallenges(userId: string): Promise<Challenge[]> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from('challenges')
    .select('*, challenge_participants(*)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(30);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((c: any) => {
    const parts = c.challenge_participants ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userPart = parts.find((p: any) => p.user_id === userId);
    return {
      id: c.id,
      createdBy: c.created_by,
      name: c.name,
      description: c.description ?? null,
      type: c.type as Challenge['type'],
      targetValue: c.target_value ?? null,
      startDate: c.start_date,
      endDate: c.end_date,
      isPublic: c.is_public,
      participantCount: parts.length,
      userProgress: userPart?.progress ?? null,
      isJoined: !!userPart,
      isCooperative: c.is_cooperative ?? false,
    };
  });
}

export async function joinChallenge(
  challengeId: string,
  userId: string,
): Promise<void> {
  const supabase = await getSupabase();
  await supabase
    .from('challenge_participants')
    .insert({ challenge_id: challengeId, user_id: userId });
}

export async function createChallenge(
  input: {
    name: string;
    description?: string;
    type: Challenge['type'];
    targetValue?: number;
    startDate: string;
    endDate: string;
    isCooperative?: boolean;
  },
  userId: string,
): Promise<string> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('challenges')
    .insert({
      created_by: userId,
      name: input.name,
      description: input.description ?? null,
      type: input.type,
      target_value: input.targetValue ?? null,
      start_date: input.startDate,
      end_date: input.endDate,
      is_public: true,
      is_cooperative: input.isCooperative ?? false,
    })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create challenge');
  }
  return data.id as string;
}

export async function getChallengeLeaderboard(
  challengeId: string,
  currentUserId: string,
): Promise<ChallengeParticipant[]> {
  const supabase = await getSupabase();
  const { data: parts, error } = await supabase
    .from('challenge_participants')
    .select('user_id, progress')
    .eq('challenge_id', challengeId)
    .order('progress', { ascending: false });

  if (error) throw new Error(`[getChallengeLeaderboard] ${error.message}`);
  if (!parts || parts.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userIds = parts.map((r: any) => r.user_id as string);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', userIds);

  const nameMap: Record<string, string> = Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profiles ?? []).map((p: any) => [p.id as string, p.name as string]),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return parts.map((r: any) => ({
    userId: r.user_id as string,
    name: nameMap[r.user_id] ?? 'Unknown',
    progress: (r.progress as number) ?? 0,
    isCurrentUser: r.user_id === currentUserId,
  }));
}

export async function getCooperativeTotal(challengeId: string): Promise<number> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('challenge_participants')
    .select('progress')
    .eq('challenge_id', challengeId);

  if (error) throw new Error(`[getCooperativeTotal] ${error.message}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).reduce((sum: number, r: any) => sum + ((r.progress as number) ?? 0), 0);
}

export async function sendChallengeInvitation(
  challengeId: string,
  fromUserId: string,
  toUserId: string,
): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('challenge_invitations')
    .insert({ challenge_id: challengeId, from_user_id: fromUserId, to_user_id: toUserId });
  // Silently ignore duplicate (UNIQUE constraint → 23505)
  if (error && error.code !== '23505') {
    throw new Error(`[sendChallengeInvitation] ${error.message}`);
  }
}

export async function getPendingInvitations(userId: string): Promise<ChallengeInvitation[]> {
  const supabase = await getSupabase();
  const { data: rows, error } = await supabase
    .from('challenge_invitations')
    .select('id, challenge_id, from_user_id, to_user_id, status, created_at')
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`[getPendingInvitations] ${error.message}`);
  if (!rows || rows.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const challengeIds = [...new Set(rows.map((r: any) => r.challenge_id as string))];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromIds = [...new Set(rows.map((r: any) => r.from_user_id as string))];

  const [{ data: challenges }, { data: profiles }] = await Promise.all([
    supabase.from('challenges').select('id, name').in('id', challengeIds),
    supabase.from('profiles').select('id, name').in('id', fromIds),
  ]);

  const challengeNameMap: Record<string, string> = Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (challenges ?? []).map((c: any) => [c.id as string, c.name as string]),
  );
  const profileNameMap: Record<string, string> = Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profiles ?? []).map((p: any) => [p.id as string, p.name as string]),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => ({
    id: r.id as string,
    challengeId: r.challenge_id as string,
    challengeName: challengeNameMap[r.challenge_id] ?? 'Unknown Challenge',
    fromUserId: r.from_user_id as string,
    fromUserName: profileNameMap[r.from_user_id] ?? 'Unknown',
    toUserId: r.to_user_id as string,
    status: r.status as ChallengeInvitation['status'],
    createdAt: r.created_at as string,
  }));
}

export async function respondChallengeInvitation(
  invitationId: string,
  status: 'accepted' | 'declined',
): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('challenge_invitations')
    .update({ status })
    .eq('id', invitationId);
  if (error) throw new Error(`[respondChallengeInvitation] ${error.message}`);
}

// ─── Nutrition ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNutritionLog(row: any): NutritionLog {
  return {
    id: row.id,
    userId: row.user_id,
    loggedAt: row.logged_at,
    mealName: row.meal_name ?? undefined,
    calories: row.calories ?? undefined,
    proteinG: row.protein_g ?? undefined,
    carbsG: row.carbs_g ?? undefined,
    fatG: row.fat_g ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

export async function fetchNutritionLogs(
  userId: string,
  date: string,
): Promise<NutritionLog[]> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('logged_at', date)
    .order('created_at', { ascending: true });
  return (data ?? []).map(mapNutritionLog);
}

export async function addNutritionLog(
  log: Omit<NutritionLog, 'id' | 'createdAt'>,
): Promise<NutritionLog | null> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from('nutrition_logs')
    .insert({
      user_id: log.userId,
      logged_at: log.loggedAt,
      meal_name: log.mealName ?? null,
      calories: log.calories ?? null,
      protein_g: log.proteinG ?? null,
      carbs_g: log.carbsG ?? null,
      fat_g: log.fatG ?? null,
      notes: log.notes ?? null,
    })
    .select('*')
    .single();
  return data ? mapNutritionLog(data) : null;
}

export async function deleteNutritionLog(id: string, userId: string): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('nutrition_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(`[deleteNutritionLog] ${error.message}`);
}

export async function fetchRecentNutritionLogs(
  userId: string,
  since: string, // YYYY-MM-DD
): Promise<NutritionLog[]> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', since)
    .order('created_at', { ascending: false });
  return (data ?? []).map(mapNutritionLog);
}

export async function fetchNutritionLogDates(
  userId: string,
  since: string, // YYYY-MM-DD
): Promise<string[]> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from('nutrition_logs')
    .select('logged_at')
    .eq('user_id', userId)
    .gte('logged_at', since);
  return [...new Set((data ?? []).map((r) => r.logged_at as string))];
}

// ─── Community: Activity Feed ─────────────────────────────────────────────────

// ─── Measurements ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMeasurement(row: any): Measurement {
  return {
    id: row.id,
    userId: row.user_id,
    metric: row.metric as MeasurementMetric,
    value: row.value,
    unit: row.unit,
    measuredAt: row.measured_at,
    createdAt: row.created_at,
  };
}

export async function fetchMeasurements(
  userId: string,
  metric?: MeasurementMetric,
): Promise<Measurement[]> {
  const supabase = await getSupabase();
  let query = supabase
    .from('measurements')
    .select('*')
    .eq('user_id', userId)
    .order('measured_at', { ascending: true });
  if (metric) {
    query = query.eq('metric', metric);
  }
  const { data } = await query;
  return (data ?? []).map(mapMeasurement);
}

export async function addMeasurement(
  data: Omit<Measurement, 'id' | 'createdAt'>,
): Promise<Measurement | null> {
  const supabase = await getSupabase();
  const { data: row } = await supabase
    .from('measurements')
    .insert({
      user_id: data.userId,
      metric: data.metric,
      value: data.value,
      unit: data.unit,
      measured_at: data.measuredAt,
    })
    .select('*')
    .single();
  return row ? mapMeasurement(row) : null;
}

export async function deleteMeasurement(id: string, userId: string): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('measurements')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(`[deleteMeasurement] ${error.message}`);
}

// ─── Workout Templates ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTemplate(row: any): WorkoutTemplate {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    exercises: row.exercises,
    createdAt: row.created_at,
  };
}

export async function fetchWorkoutTemplates(
  userId: string,
): Promise<WorkoutTemplate[]> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from('workout_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  return (data ?? []).map(mapTemplate);
}

export async function upsertWorkoutTemplate(
  template: WorkoutTemplate,
  userId: string,
): Promise<void> {
  const supabase = await getSupabase();
  await supabase.from('workout_templates').upsert({
    id: template.id,
    user_id: userId,
    name: template.name,
    exercises: template.exercises,
  });
}

export async function deleteWorkoutTemplateDb(id: string): Promise<void> {
  const supabase = await getSupabase();
  await supabase.from('workout_templates').delete().eq('id', id);
}

// ─── Feed Reactions ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReaction(row: any): FeedReaction {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    emoji: row.emoji as ReactionEmoji,
    createdAt: row.created_at,
  };
}

export async function getSessionReactions(
  sessionIds: string[],
): Promise<FeedReaction[]> {
  if (sessionIds.length === 0) return [];
  const supabase = await getSupabase();
  const { data } = await supabase
    .from('feed_reactions')
    .select('*')
    .in('session_id', sessionIds);
  return (data ?? []).map(mapReaction);
}

export async function addReaction(
  sessionId: string,
  userId: string,
  emoji: ReactionEmoji,
): Promise<void> {
  const supabase = await getSupabase();
  await supabase
    .from('feed_reactions')
    .upsert({ session_id: sessionId, user_id: userId, emoji }, { onConflict: 'session_id,user_id' });
}

export async function removeReaction(
  sessionId: string,
  userId: string,
): Promise<void> {
  const supabase = await getSupabase();
  await supabase
    .from('feed_reactions')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId);
}

export async function getFriendFeed(userId: string): Promise<FeedSession[]> {
  const supabase = await getSupabase();
  const { data: friendships } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted');

  const friendIds = (friendships ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (f: any) => (f.requester_id === userId ? f.addressee_id : f.requester_id),
  );

  if (friendIds.length === 0) return [];

  // Single query: join workout_sessions with profiles via the user_id FK.
  // PostgREST resolves the FK automatically when profiles.id references auth.users.id
  // and workout_sessions.user_id also references auth.users.id.
  // If the FK relationship isn't declared in Supabase, fall back to a parallel query.
  const { data: sessionsWithProfiles, error: joinError } = await supabase
    .from('workout_sessions')
    .select('id, user_id, program_id, started_at, completed_at, total_volume_kg, duration_seconds, profiles!inner(name)')
    .in('user_id', friendIds)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(30);

  if (!joinError && sessionsWithProfiles) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (sessionsWithProfiles as any[]).map((s) => ({
      sessionId: s.id,
      userId: s.user_id,
      userName: s.profiles?.name ?? 'Unknown',
      programId: s.program_id,
      startedAt: s.started_at,
      completedAt: s.completed_at ?? undefined,
      totalVolumeKg: s.total_volume_kg ?? 0,
      durationSeconds: s.duration_seconds ?? undefined,
    }));
  }

  // Fallback: parallel queries if the FK join isn't available
  const [sessionsResult, profilesResult] = await Promise.all([
    supabase
      .from('workout_sessions')
      .select('id, user_id, program_id, started_at, completed_at, total_volume_kg, duration_seconds')
      .in('user_id', friendIds)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(30),
    supabase.from('profiles').select('id, name').in('id', friendIds),
  ]);

  const nameMap = Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profilesResult.data ?? []).map((p: any) => [p.id, p.name]),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (sessionsResult.data ?? []).map((s: any) => ({
    sessionId: s.id,
    userId: s.user_id,
    userName: nameMap[s.user_id] ?? 'Unknown',
    programId: s.program_id,
    startedAt: s.started_at,
    completedAt: s.completed_at ?? undefined,
    totalVolumeKg: s.total_volume_kg ?? 0,
    durationSeconds: s.duration_seconds ?? undefined,
  }));
}

// ─── AI Training Profiles ─────────────────────────────────────────────────────

export async function upsertTrainingProfile(
  userId: string,
  profile: UserTrainingProfile,
): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.from('training_profiles').upsert({
    user_id: userId,
    goals: profile.goals,
    training_age_years: profile.trainingAgeYears,
    days_per_week: profile.daysPerWeek,
    session_duration_minutes: profile.sessionDurationMinutes,
    equipment: profile.equipment,
    injuries: profile.injuries,
    ai_summary: profile.aiSummary,
    raw_profile: profile,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw new Error(`[upsertTrainingProfile] ${error.message}`);
}

export async function fetchTrainingProfile(
  userId: string,
): Promise<UserTrainingProfile | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('training_profiles')
    .select('raw_profile, goals, training_age_years, days_per_week, session_duration_minutes, equipment, injuries, ai_summary')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`[fetchTrainingProfile] ${error.message}`);
  if (!data) return null;

  if (data.raw_profile) {
    return data.raw_profile as UserTrainingProfile;
  }

  return {
    goals: data.goals ?? [],
    trainingAgeYears: data.training_age_years ?? 0,
    daysPerWeek: data.days_per_week ?? 4,
    sessionDurationMinutes: data.session_duration_minutes ?? 60,
    equipment: data.equipment ?? [],
    injuries: data.injuries ?? [],
    aiSummary: data.ai_summary ?? '',
  } satisfies UserTrainingProfile;
}

export async function saveAiGeneratedProgram(
  userId: string,
  program: Program,
): Promise<string> {
  const id = crypto.randomUUID();
  const programWithMeta: Program = {
    ...program,
    id,
    isCustom: true,
    isAiGenerated: true,
    createdAt: new Date().toISOString(),
  };
  await upsertCustomProgram(programWithMeta, userId);
  return id;
}

// ─── Block Missions ───────────────────────────────────────────────────────────

function toSafeMissionTarget(value: unknown): BlockMission['target'] {
  const candidate = (value ?? {}) as {
    metric?: unknown;
    value?: unknown;
    unit?: unknown;
  };

  const metric = typeof candidate.metric === 'string' && candidate.metric.trim().length > 0
    ? candidate.metric.trim()
    : 'target';
  const unit = typeof candidate.unit === 'string' && candidate.unit.trim().length > 0
    ? candidate.unit.trim()
    : '';
  const parsedValue = Number(candidate.value);
  const safeValue = Number.isFinite(parsedValue) ? Math.max(1, Math.round(parsedValue)) : 1;

  return { metric, value: safeValue, unit };
}

function toSafeMissionProgress(value: unknown): BlockMission['progress'] {
  const candidate = (value ?? {}) as {
    current?: unknown;
    history?: Array<{ date?: unknown; value?: unknown }>;
  };

  const parsedCurrent = Number(candidate.current);
  const current = Number.isFinite(parsedCurrent) ? Math.max(0, parsedCurrent) : 0;
  const history = Array.isArray(candidate.history)
    ? candidate.history
        .map((entry) => {
          const trimmedDate = typeof entry?.date === 'string' ? entry.date.trim() : '';
          const date = trimmedDate.length > 0
            ? trimmedDate
            : new Date().toISOString().split('T')[0];
          const parsed = Number(entry?.value);
          const safeValue = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
          return { date, value: safeValue };
        })
        .slice(-30)
    : [];

  return { current, history };
}

const VALID_MISSION_TYPES = new Set<BlockMission['type']>(['pr', 'consistency', 'volume', 'rpe']);
const VALID_MISSION_STATUSES = new Set<BlockMission['status']>(['active', 'completed', 'failed']);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMission(row: any): BlockMission {
  const type: BlockMission['type'] = VALID_MISSION_TYPES.has(row.type)
    ? (row.type as BlockMission['type'])
    : 'volume';
  const status: BlockMission['status'] = VALID_MISSION_STATUSES.has(row.status)
    ? (row.status as BlockMission['status'])
    : 'active';
  return {
    id: row.id,
    userId: row.user_id,
    programId: row.program_id,
    type,
    description: row.description,
    target: toSafeMissionTarget(row.target),
    progress: toSafeMissionProgress(row.progress),
    status,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
  };
}

export async function getBlockMissions(userId: string, programId: string): Promise<BlockMission[]> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from('block_missions')
    .select('*')
    .eq('user_id', userId)
    .eq('program_id', programId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => mapMission(row));
}

export async function updateMissionProgress(
  missionId: string,
  progress: BlockMission['progress'],
  status?: BlockMission['status'],
): Promise<void> {
  const supabase = await getSupabase();
  const update: Record<string, unknown> = { progress };
  if (status) {
    update.status = status;
    if (status === 'completed') {
      update.completed_at = new Date().toISOString();
    }
  }
  const { error } = await supabase
    .from('block_missions')
    .update(update)
    .eq('id', missionId);
  if (error) throw new Error(`[updateMissionProgress] ${error.message}`);
}

// ─── AI Challenges ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAiChallenge(row: any): AiChallenge {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    type: row.type as AiChallenge['type'],
    title: row.title,
    description: row.description,
    metric: row.metric as AiChallenge['metric'],
    target: Number(row.target),
    unit: row.unit,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
  };
}

export async function getAiChallenges(userId: string): Promise<AiChallenge[]> {
  // Fetch user's personal challenges + shared (user_id IS NULL) active this week
  const supabase = await getSupabase();
  const today = new Date().toISOString().split('T')[0];
  const { data: personal } = await supabase
    .from('ai_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'personal')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: shared } = await supabase
    .from('ai_challenges')
    .select('*')
    .is('user_id', null)
    .eq('type', 'shared')
    .lte('start_date', today)
    .gte('end_date', today)
    .order('created_at', { ascending: false })
    .limit(1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return [...(personal ?? []).map((r: any) => mapAiChallenge(r)), ...(shared ?? []).map((r: any) => mapAiChallenge(r))];
}
