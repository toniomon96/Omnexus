import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, ALLOWED_ORIGIN } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';

// ─── Module-level clients (reused across warm invocations) ─────────────────────

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const supabaseAdmin =
  process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// ─── Exercise ID catalogue (mirrors src/data/exercises.ts) ───────────────────

const EXERCISE_IDS = [
  // Chest
  'barbell-bench-press', 'dumbbell-bench-press', 'incline-dumbbell-press',
  'incline-barbell-press', 'cable-chest-fly', 'push-up', 'dips',
  // Back
  'barbell-row', 'dumbbell-row', 'lat-pulldown', 'pull-up', 'seated-cable-row',
  'face-pull', 't-bar-row',
  // Shoulders
  'overhead-press', 'dumbbell-lateral-raise', 'dumbbell-shoulder-press',
  'arnold-press', 'rear-delt-fly',
  // Arms
  'barbell-curl', 'hammer-curl', 'tricep-pushdown', 'skull-crusher', 'overhead-tricep-extension',
  // Legs — Quads
  'barbell-back-squat', 'goblet-squat', 'leg-press', 'leg-extension',
  'walking-lunge', 'bulgarian-split-squat', 'step-up',
  // Legs — Posterior chain
  'romanian-deadlift', 'deadlift', 'hip-thrust', 'glute-bridge',
  'leg-curl', 'nordic-hamstring-curl',
  // Calves & Core
  'standing-calf-raise', 'plank', 'hanging-leg-raise', 'ab-wheel-rollout', 'cable-crunch',
  // Cardio / Conditioning
  'kettlebell-swing', 'box-jump', 'mountain-climbers',
];

const VALID_IDS = new Set(EXERCISE_IDS);

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserTrainingProfile {
  goals: string[];
  trainingAgeYears: number;
  daysPerWeek: number;
  sessionDurationMinutes: number;
  equipment: string[];
  injuries: string[];
  aiSummary: string;
  priorityMuscles?: string[];
  programStyle?: string;
  includeCardio?: boolean;
}

interface SetScheme {
  sets: number;
  reps: string;
  restSeconds: number;
  rpe?: number;
}

interface ProgramExercise {
  exerciseId: string;
  scheme: SetScheme;
  notes?: string;
  isOptional?: boolean;
}

interface TrainingDay {
  label: string;
  type: string;
  exercises: ProgramExercise[];
}

interface GeneratedProgram {
  id: string;
  name: string;
  goal: string;
  experienceLevel: string;
  description: string;
  trainingPhilosophy?: string;
  weeklyProgressionNotes?: string[];
  daysPerWeek: number;
  estimatedDurationWeeks: number;
  schedule: TrainingDay[];
  tags: string[];
  isCustom: boolean;
  isAiGenerated: boolean;
  aiLifecycleStatus?: 'draft' | 'active' | 'archived';
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateProgram(p: unknown): p is GeneratedProgram {
  if (!p || typeof p !== 'object') return false;
  const prog = p as Record<string, unknown>;
  if (!Array.isArray(prog.schedule) || prog.schedule.length === 0) return false;
  if (!['hypertrophy', 'fat-loss', 'general-fitness'].includes(prog.goal as string)) return false;
  if (!['beginner', 'intermediate', 'advanced'].includes(prog.experienceLevel as string)) return false;
  for (const day of prog.schedule as unknown[]) {
    if (!day || typeof day !== 'object') return false;
    const d = day as Record<string, unknown>;
    if (!Array.isArray(d.exercises)) return false;
    for (const ex of d.exercises as unknown[]) {
      if (!ex || typeof ex !== 'object') return false;
      const e = ex as Record<string, unknown>;
      if (typeof e.exerciseId !== 'string' || !VALID_IDS.has(e.exerciseId)) return false;
    }
  }
  return true;
}

// ─── Fallback program (used if Claude fails) ──────────────────────────────────

function buildFallback(profile: UserTrainingProfile): GeneratedProgram {
  const goal = (profile.goals[0] ?? 'general-fitness') as string;
  const days = Math.min(Math.max(profile.daysPerWeek, 2), 5);
  const level = profile.trainingAgeYears === 0
    ? 'beginner'
    : profile.trainingAgeYears <= 2
      ? 'intermediate'
      : 'advanced';

  const hasBarbell = !profile.equipment.length ||
    profile.equipment.some(e => /barbell|full|gym/i.test(e));
  const hasCable = !profile.equipment.length ||
    profile.equipment.some(e => /cable|full|gym/i.test(e));

  const fullBodyA: ProgramExercise[] = [
    {
      exerciseId: hasBarbell ? 'barbell-back-squat' : 'goblet-squat',
      scheme: { sets: 3, reps: '8-10', restSeconds: 120, rpe: 7 },
      notes: 'W1: 3×10 @RPE7 | W2: 4×8 @RPE7 | W3: 4×8 @RPE8 | W4: Deload 2×10 @RPE6 | W5: 4×8 @RPE8 | W6: 4×6 @RPE8 | W7: 5×5 @RPE9 | W8: Test 5RM or deload',
    },
    {
      exerciseId: hasBarbell ? 'barbell-bench-press' : 'dumbbell-bench-press',
      scheme: { sets: 3, reps: '8-10', restSeconds: 90, rpe: 7 },
      notes: 'W1: 3×10 @RPE7 | W2: 4×8 @RPE7 | W3: 4×8 @RPE8 | W4: Deload 2×10 @RPE6 | W5: 4×8 @RPE8 | W6: 4×6 @RPE8 | W7: 5×5 @RPE9 | W8: Test',
    },
    {
      exerciseId: hasBarbell ? 'barbell-row' : 'dumbbell-row',
      scheme: { sets: 3, reps: '8-10', restSeconds: 90, rpe: 7 },
      notes: 'W1: 3×10 @RPE7 | W2: 4×8 @RPE7 | W3: 4×8 @RPE8 | W4: Deload 2×10 @RPE6 | W5: 4×8 @RPE8 | W6: 4×6 @RPE8 | W7: 5×5 @RPE9 | W8: Test',
    },
    { exerciseId: 'overhead-press', scheme: { sets: 3, reps: '10-12', restSeconds: 90, rpe: 7 } },
    { exerciseId: 'romanian-deadlift', scheme: { sets: 3, reps: '10-12', restSeconds: 90, rpe: 7 } },
    { exerciseId: 'plank', scheme: { sets: 3, reps: '30-45s', restSeconds: 60 } },
  ];
  const fullBodyB: ProgramExercise[] = [
    {
      exerciseId: 'romanian-deadlift',
      scheme: { sets: 3, reps: '8-10', restSeconds: 120, rpe: 7 },
      notes: 'W1: 3×10 @RPE7 | W2: 4×8 @RPE7 | W3: 4×8 @RPE8 | W4: Deload 2×10 @RPE6 | W5: 4×8 @RPE8 | W6: 4×6 @RPE8 | W7: 5×5 @RPE9 | W8: Test',
    },
    { exerciseId: 'incline-dumbbell-press', scheme: { sets: 3, reps: '10-12', restSeconds: 90, rpe: 7 } },
    { exerciseId: hasCable ? 'lat-pulldown' : 'pull-up', scheme: { sets: 3, reps: '10-12', restSeconds: 90, rpe: 7 } },
    { exerciseId: 'dumbbell-shoulder-press', scheme: { sets: 3, reps: '10-12', restSeconds: 90, rpe: 7 } },
    { exerciseId: 'leg-press', scheme: { sets: 3, reps: '12-15', restSeconds: 90, rpe: 7 } },
    { exerciseId: 'hanging-leg-raise', scheme: { sets: 3, reps: '10-15', restSeconds: 60 } },
  ];

  const schedule: TrainingDay[] = [];
  for (let i = 0; i < days; i++) {
    schedule.push({
      label: `Day ${i + 1} — Full Body ${i % 2 === 0 ? 'A' : 'B'}`,
      type: 'full-body',
      exercises: i % 2 === 0 ? fullBodyA : fullBodyB,
    });
  }

  return {
    id: '',
    name: 'Full-Body Foundation Program',
    goal,
    experienceLevel: level,
    description: 'A balanced full-body program hitting every major movement pattern each session. Designed to build strength and muscle simultaneously while establishing solid technique fundamentals.',
    trainingPhilosophy: 'This program uses a linear periodization model. Each week you add either a rep or a small amount of weight to the main lifts, building strength progressively. The deload in Week 4 is mandatory — it lets your nervous system and joints recover so you can push harder in Weeks 5-8.',
    weeklyProgressionNotes: [
      'Week 1: Orientation — 3 sets, RPE 6-7. Focus entirely on form. Leave 3+ reps in the tank on every set.',
      'Week 2: Start pushing. Add a rep or 2.5kg where Week 1 felt easy. Still RPE 7.',
      'Week 3: Add another set to main lifts (4 sets total). Push to RPE 7-8. Should feel challenging.',
      'Week 4: DELOAD — Drop to 2 sets on everything, reduce weight ~20%, RPE 6. Mandatory recovery. Do not skip.',
      'Week 5: Back to 4 sets, load heavier than Week 3. RPE 7-8. You should feel fresh and strong.',
      'Week 6: Increase weight on all main lifts. Target RPE 8 on working sets. Real gains happen here.',
      'Week 7: Peak week — 4-5 sets, RPE 8-9. Push hard. Best performances of the program here.',
      'Week 8: Choice — test your maxes on main lifts, or take a second deload before starting a new block.',
    ],
    daysPerWeek: days,
    estimatedDurationWeeks: 8,
    schedule,
    tags: ['ai-generated', 'full-body', goal],
    isCustom: true,
    isAiGenerated: true,
  };
}

// ─── Prompt sanitization ──────────────────────────────────────────────────────

// BUG-15: Strip newlines and control characters from user-supplied strings before
// injecting them into the AI system prompt to prevent prompt injection attacks.
function sanitize(value: string): string {
  return value.replace(/[\r\n\t]+/g, ' ').trim();
}

// ─── World-class system prompt ────────────────────────────────────────────────

function buildSystemPrompt(profile: UserTrainingProfile): string {
  const expLevel = profile.trainingAgeYears === 0
    ? 'beginner'
    : profile.trainingAgeYears <= 2
      ? 'intermediate'
      : 'advanced';

  const hasBarbell = !profile.equipment.length ||
    profile.equipment.some(e => /barbell|full|gym/i.test(e));
  const hasCable = !profile.equipment.length ||
    profile.equipment.some(e => /cable|full|gym/i.test(e));
  const bodyweightOnly = profile.equipment.length > 0 &&
    profile.equipment.every(e => /bodyweight/i.test(e));

  const primaryGoal = sanitize(profile.goals[0] ?? 'general-fitness');
  const priorityText = profile.priorityMuscles?.length
    ? profile.priorityMuscles.map(sanitize).join(', ')
    : 'balanced development';
  const cardioText = profile.includeCardio
    ? 'YES — build 1-2 conditioning sessions into the weekly schedule'
    : 'NO — pure lifting only';

  // Determine the mandatory split
  const style = profile.programStyle;
  let mandatorySplit: string;
  if (profile.daysPerWeek <= 3) {
    mandatorySplit = 'FULL BODY — hit every major movement pattern each session';
  } else if (profile.daysPerWeek === 4) {
    mandatorySplit = (style === 'push-pull-legs')
      ? 'PUSH / PULL / LEGS / UPPER — 4-day PPL variant'
      : 'UPPER/LOWER — Upper A (strength bias), Upper B (volume bias), Lower A (quad dominant), Lower B (hip dominant)';
  } else if (profile.daysPerWeek === 5) {
    mandatorySplit = (style === 'upper-lower')
      ? 'UPPER A / LOWER A / PUSH / UPPER B / LOWER B — 5-day upper/lower emphasis'
      : 'PUSH / PULL / LEGS / UPPER / LOWER — 5-day PPL extension';
  } else {
    mandatorySplit = 'PUSH / PULL / LEGS × 2 — 6-day PPL with A/B variants for each day type';
  }

  // Equipment restrictions
  const equipRestrictions: string[] = [];
  if (!hasBarbell) equipRestrictions.push('NO barbell exercises (no rack/barbell available)');
  if (!hasCable) equipRestrictions.push('NO cable exercises (no cable machine available)');
  if (bodyweightOnly) equipRestrictions.push('BODYWEIGHT ONLY — limit to: push-up, pull-up, dips, plank, mountain-climbers, box-jump, nordic-hamstring-curl, hanging-leg-raise, walking-lunge, goblet-squat (bodyweight), glute-bridge');

  // Injury accommodations
  const injuryMods: string[] = [];
  const injStr = profile.injuries.join(' ').toLowerCase();
  if (/shoulder/i.test(injStr)) {
    injuryMods.push('SHOULDER: Replace overhead-press with dumbbell-shoulder-press. Replace barbell-bench-press with dumbbell-bench-press if needed. Add face-pull for rotator cuff health. No behind-neck movements.');
  }
  if (/back|spine|disc/i.test(injStr)) {
    injuryMods.push('LOWER BACK: Replace deadlift with romanian-deadlift. Add coaching cue "brace your core, maintain neutral spine throughout" to exercise notes. Avoid heavy loaded flexion.');
  }
  if (/knee|patellar|meniscus/i.test(injStr)) {
    injuryMods.push('KNEE: Replace barbell-back-squat with goblet-squat or leg-press. Add coaching cue "control the descent, keep knees tracking over toes" to notes. Avoid deep end-range loading initially.');
  }

  const durationGuide = profile.sessionDurationMinutes <= 45
    ? 'MAX 4-5 exercises per session. Prioritise big compounds only. Skip isolations except core.'
    : profile.sessionDurationMinutes <= 60
      ? '5-6 exercises per session. 1-2 isolation movements allowed.'
      : profile.sessionDurationMinutes <= 75
        ? '6-7 exercises per session. 2-3 isolation movements.'
        : '7-8 exercises per session. Full compound + 3-4 isolation complement.';

  return `You are an NSCA-certified strength coach and exercise scientist specialising in evidence-based hypertrophy, fat loss, and performance programming. Generate a personalised, periodized 8-week training program as a SINGLE valid JSON object with NO surrounding text.

═══════════════════ USER PROFILE ═══════════════════
Goal: ${profile.goals.map(sanitize).join(', ')}
Priority muscles to develop: ${priorityText}
Training age: ${profile.trainingAgeYears} year(s) → Experience level: ${expLevel}
Days per week: ${profile.daysPerWeek}
Session duration: ${profile.sessionDurationMinutes} minutes
Equipment available: ${profile.equipment.map(sanitize).join(', ') || 'full commercial gym (all equipment)'}
Injuries/limitations: ${profile.injuries.map(sanitize).join(', ') || 'none'}
Include cardio/conditioning: ${cardioText}

MANDATORY SPLIT FOR THIS PERSON: ${mandatorySplit}
${equipRestrictions.length ? '\nEQUIPMENT RESTRICTIONS — apply strictly:\n' + equipRestrictions.map(r => '• ' + r).join('\n') : ''}
${injuryMods.length ? '\nINJURY ACCOMMODATIONS — apply immediately:\n' + injuryMods.map(n => '• ' + n).join('\n') : ''}

═══════════════════ PERIODIZATION — MANDATORY 8-WEEK STRUCTURE ═══════════════════
You MUST follow this exact periodization model:

PHASE 1 — ACCUMULATION (Weeks 1-3): Build the volume base
  • Week 1 (Orientation): 3 sets per exercise, RPE 6-7. Form focus, establish movement patterns. Leave 3+ reps in the tank every set.
  • Week 2 (Build): 3-4 sets per compound, RPE 7. Add 1 set to main lifts. Start pushing.
  • Week 3 (Accumulate): 4 sets per compound, RPE 7-8. Should feel hard but completeable.

MANDATORY DELOAD — Week 4: Drop ALL exercises to 2 sets, reduce load ~20%, RPE 6. This is non-negotiable physiologically.

PHASE 2 — INTENSIFICATION (Weeks 5-7): Reduce volume, increase intensity
  • Week 5 (Re-entry): 4 sets, RPE 7-8. Load heavier than Week 3. You are fresher than you think.
  • Week 6 (Intensify): 4 sets, RPE 8. Increase load on ALL main lifts vs Week 5.
  • Week 7 (Peak): 4-5 sets, RPE 8-9. Maximum productive effort. Best performances here.

Week 8 (Optional Peak/Deload): Test 1-3RM on main lifts, or second deload. Athlete's choice.

═══════════════════ EXERCISE PROGRESSION NOTES — CRITICAL ═══════════════════
The "notes" field on EVERY exercise MUST contain a complete W1-W8 progression arc.
Format: "W1: 3×10 @RPE7 | W2: 4×8 @RPE7 | W3: 4×8 @RPE8 | W4: Deload 2×10 @RPE6 | W5: 4×8 @RPE8 | W6: 4×6 @RPE8 | W7: 5×5 @RPE9 | W8: Test 5RM or second deload"
Adapt the scheme to the exercise type. Compounds use lower reps. Isolations use higher reps.
This is what separates a world-class program from a generic list of exercises.

═══════════════════ VOLUME LANDMARKS (sets per muscle group per week) ═══════════════════
${primaryGoal === 'hypertrophy'
    ? `HYPERTROPHY TARGETS:
  • Priority muscles (${priorityText}): 16-22 working sets/week — allocate more sessions to these
  • Supporting muscles: 10-15 working sets/week
  • Minimum effective volume: 10 sets/muscle/week — never go below this`
    : primaryGoal === 'fat-loss'
      ? `FAT LOSS TARGETS:
  • All muscle groups: 8-15 working sets/week (preserve every ounce of muscle)
  • Keep rest periods tighter (60-90s on isolations)
  • If includeCardio is true: add 1-2 conditioning days using kettlebell-swing, mountain-climbers, or box-jump`
      : `GENERAL FITNESS TARGETS:
  • All muscle groups: 8-12 working sets/week
  • Balance strength, movement quality, and conditioning
  • Prioritise compound movements and movement pattern variety`}

═══════════════════ MOVEMENT PATTERN BALANCE (weekly totals across all sessions) ═══════════════════
Count sets across ALL days combined and hit these ranges:
  Horizontal push (bench, push-up, dips):            2-4 sets
  Vertical push (overhead press variants):           2-3 sets
  Horizontal pull (rows — barbell, dumbbell, cable): 4-6 sets  ← MUST be >= horizontal push
  Vertical pull (pull-up, lat-pulldown):             3-5 sets
  Hip hinge (deadlift, RDL, hip-thrust, swing):      3-5 sets
  Knee dominant (squat, lunge, leg-press, step-up):  3-6 sets
  Core (plank, raises, rollout, cable-crunch):       4-8 sets

═══════════════════ EXERCISE ORDERING WITHIN EACH SESSION ═══════════════════
1. Highest neural-demand compound (barbell squat, deadlift, bench, weighted pull-up) — done fresh
2. Secondary compound (row variation, press variation, lunge)
3. Accessory compound (dumbbell work, split squat, step-up)
4. Isolation movements (curls, lateral raises, leg extensions, calf raises)
5. Core work always last

═══════════════════ REP RANGES AND REST PERIODS ═══════════════════
Main compound lifts (squat/deadlift/bench/press/row): 5-8 reps, 180-240s rest
Accessory compounds (dumbbell press, lunge, row variations): 8-12 reps, 90-120s rest
Isolation movements (curls, raises, extensions, leg curl): 12-20 reps, 45-60s rest
${primaryGoal === 'fat-loss' ? 'Fat loss supersets: Pair antagonist isolations (e.g. curl + tricep-pushdown). Add "Superset with [exercise name]" to notes. 30s between exercises, 90s between pairs.' : ''}

SESSION DURATION CONSTRAINT: ${profile.sessionDurationMinutes} minutes
${durationGuide}

═══════════════════ AVAILABLE EXERCISE IDs — USE ONLY THESE EXACT STRINGS ═══════════════════
${EXERCISE_IDS.join(', ')}

Apply equipment and injury filters. Any exercise requiring unavailable equipment must be replaced.

═══════════════════ OUTPUT FORMAT ═══════════════════
Output ONLY a single JSON object. No markdown code fences. No prose. No explanation. Start with { end with }.

Required schema:
{
  "name": "Specific descriptive name (e.g. '4-Day Upper/Lower Hypertrophy Block' or '3-Day Full Body Strength Foundation')",
  "goal": "hypertrophy" or "fat-loss" or "general-fitness",
  "experienceLevel": "beginner" or "intermediate" or "advanced",
  "description": "2-3 sentences explaining what makes this program ideal for this specific person's goals and schedule",
  "trainingPhilosophy": "2-3 sentences on the periodization approach, what the athlete should expect in each phase, and how progressive overload is applied",
  "weeklyProgressionNotes": [
    "Week 1: [specific coaching note for this week]",
    "Week 2: [specific coaching note]",
    "Week 3: [specific coaching note]",
    "Week 4: [deload instructions]",
    "Week 5: [specific coaching note]",
    "Week 6: [specific coaching note]",
    "Week 7: [specific coaching note]",
    "Week 8: [peak/deload note]"
  ],
  "daysPerWeek": <must match profile: ${profile.daysPerWeek}>,
  "estimatedDurationWeeks": 8,
  "schedule": [
    {
      "label": "Day 1 — Upper Strength",
      "type": "upper" or "lower" or "push" or "pull" or "legs" or "full-body" or "cardio" or "rest",
      "exercises": [
        {
          "exerciseId": "<exact id from list above>",
          "scheme": {
            "sets": <number>,
            "reps": "<string, e.g. '5-6' or '10-12' or '30s'>",
            "restSeconds": <number>,
            "rpe": <number 6-9>
          },
          "notes": "W1: Xs×Yreps @RPEz | W2: ... | W3: ... | W4: Deload ... | W5: ... | W6: ... | W7: ... | W8: ..."
        }
      ]
    }
  ],
  "tags": ["<goal>", "<split-type>", "<experience-level>"]
}

FINAL CHECKLIST before generating:
- schedule length == ${profile.daysPerWeek} days
- All exerciseIds are from the provided list
- Every exercise has W1-W8 progression in its notes
- Pull volume >= Push volume (rows + vertical pull >= bench + overhead)
- Priority muscles (${priorityText}) have highest volume allocation
- Session duration respected: ${durationGuide}
- All injury accommodations applied
- weeklyProgressionNotes has exactly 8 entries`;
}

// ─── Handler ────────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, ALLOWED_ORIGIN);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!await checkRateLimit(req, res)) return;

  const { countAgainstQuota = false, ...rawProfile } = req.body ?? {};

  // Usage gating for authenticated users
  const authHeader = req.headers.authorization;
  let usageAuthUserId: string | null = null;
  let usageToday = '';
  let currentDayProgramCount = 0;
  let monthlyProgramCount = 0;
  let monthlyProgramLimit = 0;

  if (countAgainstQuota) {
    if (!authHeader?.startsWith('Bearer ') || !supabaseAdmin) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.slice(7);
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    // BUG-13: An invalid token must be rejected. Previously user === null caused the
    // entire gating block to be skipped, letting the request through ungated.
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    usageAuthUserId = user.id;
    usageToday = new Date().toISOString().split('T')[0];
    const monthStart = `${usageToday.slice(0, 8)}01`;

    const [{ data: sub }, { data: monthUsage }] = await Promise.all([
      supabaseAdmin
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle(),
      supabaseAdmin
        .from('user_ai_usage')
        .select('date, program_gen_count')
        .eq('user_id', user.id)
        .gte('date', monthStart)
        .lte('date', usageToday),
    ]);

    const isPremium = !!sub;
    monthlyProgramLimit = isPremium ? 5 : 1;
    currentDayProgramCount = (monthUsage ?? []).find((row) => row.date === usageToday)?.program_gen_count ?? 0;
    monthlyProgramCount = (monthUsage ?? []).reduce((sum, row) => sum + (row.program_gen_count ?? 0), 0);

    if (monthlyProgramCount >= monthlyProgramLimit) {
      return res.status(403).json({ error: 'Monthly AI program limit reached', upgradeRequired: !isPremium });
    }
  }

  if (!anthropic) {
    console.error('[/api/generate-program] ANTHROPIC_API_KEY is not configured');
    return res.status(500).json({ error: 'AI service is not configured' });
  }

  const profile = rawProfile as UserTrainingProfile;
  if (!profile?.goals || !Array.isArray(profile.goals)) {
    return res.status(400).json({ error: 'Valid UserTrainingProfile is required' });
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: buildSystemPrompt(profile),
      messages: [{ role: 'user', content: 'Generate my personalised 8-week program now.' }],
    });

    const block = message.content[0];
    if (block.type !== 'text') throw new Error('Unexpected Claude response type');

    let program: GeneratedProgram | null = null;

    try {
      // Strip any accidental markdown code fences
      const raw = block.text
        .replace(/^```[a-z]*\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();
      const parsed = JSON.parse(raw) as GeneratedProgram;
      if (validateProgram(parsed)) {
        program = { ...parsed, isCustom: true, isAiGenerated: true };
      } else {
        console.warn('[/api/generate-program] Validation failed — using fallback');
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[/api/generate-program] Raw output (first 500 chars):', raw.slice(0, 500));
        }
      }
    } catch (parseErr) {
      console.warn('[/api/generate-program] JSON parse error — using fallback', parseErr);
    }

    if (!program) {
      program = buildFallback(profile);
    }

    if (countAgainstQuota && supabaseAdmin && usageAuthUserId) {
      await supabaseAdmin
        .from('user_ai_usage')
        .upsert(
          { user_id: usageAuthUserId, date: usageToday, program_gen_count: currentDayProgramCount + 1 },
          { onConflict: 'user_id,date' },
        );
    }

    return res.status(200).json({ program });
  } catch (err: unknown) {
    console.error('[/api/generate-program]', err);
    // Always return a usable program even on hard server errors
    if (countAgainstQuota && supabaseAdmin && usageAuthUserId) {
      await supabaseAdmin
        .from('user_ai_usage')
        .upsert(
          { user_id: usageAuthUserId, date: usageToday, program_gen_count: currentDayProgramCount + 1 },
          { onConflict: 'user_id,date' },
        )
        .catch(() => {});
    }
    return res.status(200).json({ program: buildFallback(profile) });
  }
}
