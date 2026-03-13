// ─── Enums & Literals ────────────────────────────────────────────────────────

export type Goal = 'hypertrophy' | 'fat-loss' | 'general-fitness';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type MuscleGroup =
  // Legacy broad groups (preserved for backward compatibility)
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'cardio'
  // Lower body
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'adductors'
  | 'abductors'
  | 'hip-flexors'
  | 'tibialis'
  // Upper body push
  | 'front-deltoid'
  | 'side-deltoid'
  | 'rear-deltoid'
  | 'rotator-cuff'
  | 'triceps'
  | 'forearms'
  // Upper body pull
  | 'lats'
  | 'traps'
  | 'rhomboids'
  | 'serratus'
  | 'erectors'
  // Core
  | 'abs'
  | 'obliques';

export type ExerciseCategory = 'strength' | 'cardio' | 'mobility';

export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'push-horizontal'
  | 'push-vertical'
  | 'pull-horizontal'
  | 'pull-vertical'
  | 'isolation'
  | 'carry'
  | 'cardio';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'resistance-band'
  | 'cardio-machine'
  | 'ez-bar'
  | 'suspension-trainer'
  | 'smith-machine'
  | 'trap-bar'
  | 'dip-bars'
  | 'rings'
  | 'bench'
  | 'pull-up-bar'
  | 'box';

export type DayType =
  | 'full-body'
  | 'upper'
  | 'lower'
  | 'push'
  | 'pull'
  | 'legs'
  | 'cardio'
  | 'rest';

export type WeightUnit = 'kg' | 'lbs';

export type WorkoutSyncStatus = 'saved_on_device' | 'syncing' | 'synced' | 'needs_attention';

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  goal: Goal;
  experienceLevel: ExperienceLevel;
  activeProgramId?: string;
  onboardedAt: string;
  theme: 'dark' | 'light';
  /** True when user is in local-only guest mode (no Supabase account) */
  isGuest?: boolean;
  avatarUrl?: string | null;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  trainingRemindersEnabled: boolean;
  missedDayEnabled: boolean;
  communityEnabled: boolean;
  progressEnabled: boolean;
  preferredHourLocal: number;
  timezone: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  kind: 'reminder' | 'guidance' | 'insight' | 'feature' | 'training' | 'nutrition';
  route?: string;
  actionLabel?: string;
  createdAt: string;
  read: boolean;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export interface SubscriptionStatus {
  tier: 'free' | 'premium';
  periodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  askCount: number;
  askLimit: number;
  programGenCount: number;
  programGenLimit: number;
}

export type ProgramLifecycleStatus = 'draft' | 'active' | 'archived';

// ─── AI Training Profile ──────────────────────────────────────────────────────

export interface UserTrainingProfile {
  goals: Goal[];
  trainingAgeYears: number;
  daysPerWeek: number;
  sessionDurationMinutes: number;
  equipment: string[];
  injuries: string[];
  aiSummary: string;
  /** Muscle groups the user most wants to develop, e.g. ['chest', 'legs'] */
  priorityMuscles?: string[];
  /** Preferred training split structure */
  programStyle?: 'full-body' | 'upper-lower' | 'push-pull-legs' | 'any';
  /** Whether the user wants cardio/conditioning built into the program */
  includeCardio?: boolean;
  /** Athlete's bodyweight in kg — used for dip/pull-up progressions */
  bodyweightKg?: number;
  /** Current working lifts in kg — used to calibrate realistic load recommendations */
  currentLiftsKg?: {
    bench?: number;
    squat?: number;
    deadlift?: number;
    press?: number;
  };
  /** Most recent workout feedback — injected into next program generation */
  recentFeedback?: string;
}

// ─── Workout Feedback ─────────────────────────────────────────────────────────

export interface WorkoutFeedback {
  sessionId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  savedAt: string;
}

// ─── Exercise Library ─────────────────────────────────────────────────────────

export interface ExerciseMistake {
  mistake: string;
  why: string;
}

export interface ExerciseProgressionPath {
  easier?: string;
  harder?: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment[];
  instructions: string[];
  tips: string[];
  pattern?: MovementPattern;
  /** Relative difficulty tier — used for equipment-swap matching and filtering */
  difficulty?: ExperienceLevel;
  /** Numeric difficulty level 1–5 (1 = beginner, 5 = elite) */
  difficultyLevel?: 1 | 2 | 3 | 4 | 5;
  /** Variant links for equipment-swap: other exercise IDs sharing the same pattern+muscles */
  exerciseVariants?: string[];
  /** Step-by-step execution walkthrough */
  steps?: string[];
  /** Common errors and explanations */
  commonMistakes?: ExerciseMistake[];
  /** Short verbal cues for technique reinforcement */
  coachingCues?: string[];
  /** Advanced technique refinements */
  proTips?: string[];
  /** Easier and harder progression links by exercise ID */
  progressionPath?: ExerciseProgressionPath;
  /** Search and filter tags */
  tags?: string[];
  /** Relative popularity derived from program generation frequency */
  popularityScore?: number;
}

// ─── Program Structure ────────────────────────────────────────────────────────

export interface SetScheme {
  sets: number;
  reps: string;
  restSeconds: number;
  rpe?: number;
}

export interface ProgramExercise {
  exerciseId: string;
  scheme: SetScheme;
  notes?: string;
  isOptional?: boolean;
}

export interface TrainingDay {
  label: string;
  type: DayType;
  exercises: ProgramExercise[];
}

export interface Program {
  id: string;
  name: string;
  goal: Goal;
  experienceLevel: ExperienceLevel;
  description: string;
  daysPerWeek: number;
  estimatedDurationWeeks: number;
  schedule: TrainingDay[];
  tags: string[];
  isCustom?: boolean;
  isAiGenerated?: boolean;
  aiLifecycleStatus?: ProgramLifecycleStatus;
  createdAt?: string;
  /** 8-entry array, one coaching note per week of the program */
  weeklyProgressionNotes?: string[];
  /** 2-3 sentences explaining the periodization logic and what the athlete should expect */
  trainingPhilosophy?: string;
}

// ─── Active Workout Session ───────────────────────────────────────────────────

export interface LoggedSet {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  isPersonalRecord?: boolean;
  rpe?: number;
  timestamp: string;
}

export interface LoggedExercise {
  exerciseId: string;
  sets: LoggedSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  programId: string;
  trainingDayIndex: number;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  exercises: LoggedExercise[];
  totalVolumeKg: number;
  notes?: string;
  syncStatus?: WorkoutSyncStatus;
  syncStatusUpdatedAt?: string;
}

// ─── History & Analytics ──────────────────────────────────────────────────────

export interface PersonalRecord {
  exerciseId: string;
  weight: number;
  reps: number;
  achievedAt: string;
  sessionId: string;
}

export interface WorkoutHistory {
  sessions: WorkoutSession[];
  personalRecords: PersonalRecord[];
}

// ─── Learning System ──────────────────────────────────────────────────────────

export type LearningCategory =
  | 'strength-training'
  | 'nutrition'
  | 'recovery'
  | 'sleep'
  | 'metabolic-health'
  | 'cardio'
  | 'mobility';

export interface ContentReference {
  title: string;
  authors?: string;
  journal?: string;
  year?: number;
  url?: string;
  type: 'journal' | 'guideline' | 'book' | 'organization' | 'meta-analysis';
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  questions: QuizQuestion[];
}

export interface Lesson {
  id: string;
  title: string;
  content: string; // Markdown prose
  keyPoints: string[];
  references: ContentReference[];
  estimatedMinutes: number;
}

export interface ContentRecommendation {
  id: string;
  title: string;
  type: 'lesson' | 'exercise' | 'course';
  courseId?: string;
  category?: string;
  relevanceScore: number;  // 0-1 cosine similarity
  metadata?: Record<string, unknown>;
}

export interface DynamicLesson extends Lesson {
  isGenerated: true;
  generatedAt: string;
  topic: string;
}

// ─── Intelligence Layer (Phase 3) ─────────────────────────────────────────────

export interface BlockMission {
  id: string;
  userId: string;
  programId: string;
  type: 'pr' | 'consistency' | 'volume' | 'rpe';
  description: string;
  target: { metric: string; value: number; unit: string };
  progress: { current: number; history: { date: string; value: number }[] };
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export interface AdaptationAction {
  exerciseId: string;
  exerciseName: string;
  action: 'increase_weight' | 'decrease_weight' | 'increase_reps' | 'maintain' | 'deload';
  suggestion: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface AdaptationResult {
  adaptations: AdaptationAction[];
  summary: string;
}

export interface AiChallenge {
  id: string;
  userId: string | null;
  type: 'personal' | 'shared';
  title: string;
  description: string;
  metric: 'total_volume' | 'sessions_count' | 'pr_count' | 'consistency';
  target: number;
  unit: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: Lesson[];
  quiz?: Quiz;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: LearningCategory;
  difficulty: ExperienceLevel;
  estimatedMinutes: number;
  relatedGoals: Goal[];
  tags: string[];
  modules: CourseModule[];
  coverEmoji: string;
}

// ─── Learning Progress ────────────────────────────────────────────────────────

export interface QuizAttempt {
  score: number;         // 0–100
  correctCount: number;
  totalQuestions: number;
  attemptedAt: string;
}

export interface LearningProgress {
  completedLessons: string[];   // lesson IDs
  completedModules: string[];   // module IDs
  completedCourses: string[];   // course IDs
  quizScores: Record<string, QuizAttempt>; // moduleId → best attempt
  lastActivityAt: string;
}

// ─── AI Insights & Q&A ────────────────────────────────────────────────────────

export type InsightCategory =
  | 'workout-analysis'
  | 'nutrition'
  | 'recovery'
  | 'general-health'
  | 'ask-anything';

export interface InsightMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  references?: ContentReference[];
  timestamp: string;
}

export interface InsightSession {
  id: string;
  category: InsightCategory;
  messages: InsightMessage[];
  createdAt: string;
}

// ─── Health Articles ──────────────────────────────────────────────────────────

export interface HealthArticle {
  id: string;
  title: string;
  summary: string;
  keyTakeaways: string[];
  source: string;
  sourceUrl: string;
  publishedDate: string;
  category: LearningCategory;
  tags: string[];
  cachedAt: string;
}

export interface ArticleCache {
  articles: HealthArticle[];
  lastFetchedAt: Partial<Record<LearningCategory, string>>;
}

// ─── Community ────────────────────────────────────────────────────────────────

export interface FriendProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface FriendshipWithProfile {
  id: string;
  status: 'pending' | 'accepted' | 'blocked';
  direction: 'sent' | 'received';
  friend: FriendProfile;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  weeklyVolumeKg: number;
  isCurrentUser: boolean;
}

export interface Challenge {
  id: string;
  createdBy: string;
  name: string;
  description: string | null;
  type: 'volume' | 'streak' | 'sessions';
  targetValue: number | null;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  participantCount: number;
  userProgress: number | null;
  isJoined: boolean;
  isCooperative: boolean;
}

export interface ChallengeParticipant {
  userId: string;
  name: string;
  progress: number;
  isCurrentUser: boolean;
}

export interface ChallengeInvitation {
  id: string;
  challengeId: string;
  challengeName: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface FeedSession {
  sessionId: string;
  userId: string;
  userName: string;
  programId: string;
  startedAt: string;
  completedAt?: string;
  totalVolumeKg: number;
  durationSeconds?: number;
}

// ─── Body Measurements ────────────────────────────────────────────────────────

export type MeasurementMetric =
  | 'weight'
  | 'body-fat'
  | 'waist'
  | 'chest'
  | 'left-arm'
  | 'right-arm'
  | 'hips'
  | 'thighs';

export type MeasurementUnit = 'kg' | 'lbs' | 'cm' | 'in' | '%';

export interface Measurement {
  id: string;
  userId: string;
  metric: MeasurementMetric;
  value: number;
  unit: MeasurementUnit;
  measuredAt: string; // YYYY-MM-DD
  createdAt: string;
}

// ─── Workout Templates ────────────────────────────────────────────────────────

export interface TemplateExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  restSeconds: number;
}

export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  exercises: TemplateExercise[];
  createdAt: string;
}

// ─── Feed Reactions ───────────────────────────────────────────────────────────

export type ReactionEmoji = '💪' | '🔥' | '👏' | '🎉' | '⭐';

export interface FeedReaction {
  id: string;
  sessionId: string;
  userId: string;
  emoji: ReactionEmoji;
  createdAt: string;
}

// ─── Meal Plan ────────────────────────────────────────────────────────────────

export interface Meal {
  name: string;
  description: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  mealTime: string; // e.g. 'Breakfast', 'Lunch', 'Dinner', 'Snack'
}

export interface MealPlan {
  planType?: 'weight-loss' | 'weight-gain' | 'maintenance';
  overview?: string;
  dailyTips?: string[];
  hydrationReminder?: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

// ─── Nutrition ────────────────────────────────────────────────────────────────

export interface NutritionLog {
  id: string;
  userId: string;
  /** YYYY-MM-DD */
  loggedAt: string;
  mealName?: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  notes?: string;
  createdAt: string;
}

export interface NutritionGoals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

// ─── XP / Gamification ───────────────────────────────────────────────────────

export type XpEventType =
  | 'workout_completed'
  | 'pr_achieved'
  | 'streak_milestone'
  | 'lesson_completed'
  | 'quiz_passed'
  | 'challenge_joined'
  | 'challenge_completed'
  | 'friend_reaction_sent'
  | 'daily_checkin';

export interface XpEvent {
  id: string;
  userId: string;
  type: XpEventType;
  /** XP awarded (always ≥ 0; computed server-side) */
  amount: number;
  /** Human-readable label shown to the user */
  label: string;
  /** Optional reference to the triggering resource */
  referenceId?: string;
  occurredAt: string;
}

export interface XpProfile {
  userId: string;
  totalXp: number;
  /** Current level (1-based, derived from totalXp) */
  level: number;
  /** XP needed to reach the next level */
  xpToNextLevel: number;
  /** XP accumulated within the current level */
  xpInCurrentLevel: number;
  /** Rank label for the current level */
  rankLabel: string;
}

// ─── Streak Freeze ───────────────────────────────────────────────────────────

export interface StreakFreeze {
  id: string;
  userId: string;
  /** ISO date string (YYYY-MM-DD) the freeze was consumed on (null = unused) */
  consumedDate: string | null;
  awardedAt: string;
}

// ─── Progressive Overload ────────────────────────────────────────────────────

export type ProgressionAction =
  | 'increase_load'
  | 'increase_reps'
  | 'hold'
  | 'deload';

export interface ProgressionRecommendation {
  exerciseId: string;
  exerciseName: string;
  action: ProgressionAction;
  /** Suggested new load in the same unit the user logged */
  suggestedLoad?: number;
  currentLoad?: number;
  reason: string;
  /** ACSM-aligned confidence: 'high' when clear over-performance; 'medium' otherwise */
  confidence: 'high' | 'medium' | 'low';
}

// ─── Equipment Swap ──────────────────────────────────────────────────────────

export interface SwapCandidate {
  exercise: Exercise;
  /** 0–100 score: higher = better swap match */
  score: number;
  matchReasons: string[];
}

// ─── Spaced Repetition ───────────────────────────────────────────────────────

export interface SpacedRepCard {
  /** Quiz question or lesson ID */
  cardId: string;
  userId: string;
  /** SM-2 easiness factor (default 2.5) */
  easinessFactor: number;
  /** Current interval in days */
  intervalDays: number;
  /** Number of consecutive successful reviews */
  repetitions: number;
  /** ISO date string for when the card is next due */
  nextDueAt: string;
  lastReviewedAt: string;
}

export type SpacedRepQuality = 0 | 1 | 2 | 3 | 4 | 5;
