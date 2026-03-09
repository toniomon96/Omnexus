import type {
  ExperienceLevel,
  Goal,
  LearningProgress,
  PersonalRecord,
  Program,
  WorkoutHistory,
  WorkoutSession,
} from '../types';

let supabasePromise: Promise<(typeof import('./supabase'))['supabase']> | null = null;

async function getSupabase() {
  supabasePromise ??= import('./supabase').then((module) => module.supabase);
  return supabasePromise;
}

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