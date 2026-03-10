# Omnexus API Reference

All API endpoints are Vercel serverless functions in `/api/`. They run on Node.js 20. API keys and service-role credentials are never exposed to the browser.

---

## Base URL

| Environment | URL |
|---|---|
| Local | `http://localhost:3000/api` |
| Production | `https://<your-vercel-domain>/api` |

---

## Authentication

| Endpoint | Auth Required |
|---|---|
| `POST /api/signup` | No |
| `POST /api/signin` | No |
| `POST /api/setup-profile` | No (verifies user exists via admin SDK) |
| `POST /api/ask` | No |
| `POST /api/insights` | **Yes** — Bearer JWT |
| `POST /api/onboard` | No |
| `POST /api/generate-program` | No |
| `GET /api/articles` | No |
| `POST /api/report-bug` | No (optional Bearer — associates report with user if present) |
| `POST /api/notify-friends` | **Yes** — Bearer JWT |
| `GET /api/export-data` | **Yes** — Bearer JWT |
| `DELETE /api/delete-account` | **Yes** — Bearer JWT |
| `POST /api/adapt` | Bearer JWT (optional — `userId` in body) |
| `POST /api/generate-missions` | Bearer JWT (optional — `userId` in body) |
| `POST /api/generate-personal-challenge` | Bearer JWT (optional — `userId` in body) |
| `GET /api/generate-shared-challenge` | Vercel Cron (internal, requires `Authorization: Bearer <CRON_SECRET>`) |
| `POST /api/peer-insights` | Bearer JWT (optional — `userId` in body) |
| `GET /api/daily-reminder` | Vercel Cron (internal, requires `Authorization: Bearer <CRON_SECRET>`) |
| `GET /api/weekly-digest` | Vercel Cron (internal, requires `Authorization: Bearer <CRON_SECRET>`) |

Endpoints marked **Yes** require:
```http
Authorization: Bearer <supabase-access-token>
```
The server verifies the JWT using `supabaseAdmin.auth.getUser(token)`.

---

## POST /api/onboard

---

## POST /api/signin

Server-mediated sign-in endpoint with brute-force protections. It applies endpoint rate limiting and account lockout controls before exchanging credentials with Supabase Auth.

**Request**

```http
POST /api/signin
Content-Type: application/json
```

```json
{
  "email": "you@example.com",
  "password": "your-password"
}
```

**Response 200**

```json
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

**Errors**

| Status | Cause |
|---|---|
| `400` | Invalid email/password format |
| `401` | Invalid credentials |
| `429` | Lockout due to repeated failed attempts |
| `500` | Supabase auth not configured |

---

Multi-turn AI onboarding conversation. Collects user training goals, history, schedule, equipment, and injuries. When sufficient data is gathered, Claude outputs a structured `UserTrainingProfile`.

**Request**

```http
POST /api/onboard
Content-Type: application/json
```

```json
{
  "messages": [
    { "role": "user", "content": "Hi, my name is Alex." },
    { "role": "assistant", "content": "Hi Alex! What's your primary training goal?" },
    { "role": "user", "content": "I want to build muscle." }
  ],
  "userName": "Alex"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `messages` | `{role, content}[]` | Yes | Full conversation history; capped at last 20 turns server-side |
| `userName` | `string` | No | Injected into the initial greeting if `messages` is empty |

**Response 200**

```json
{
  "reply": "Great! How many years have you been lifting consistently?",
  "profileComplete": false
}
```

When the profile is complete:

```json
{
  "reply": "You're all set! Here's your profile summary...",
  "profileComplete": true,
  "profile": {
    "goals": ["hypertrophy"],
    "trainingAgeYears": 2,
    "daysPerWeek": 4,
    "sessionDurationMinutes": 60,
    "equipment": ["barbell", "dumbbell"],
    "injuries": [],
    "aiSummary": "You're an intermediate lifter with 2 years of experience..."
  }
}
```

**AI signal:** Claude appends `[PROFILE_COMPLETE]` + JSON to its reply internally. The endpoint strips this before returning `reply`, and parses the JSON into `profile`.

**Model:** `claude-sonnet-4-6` · `max_tokens: 600`

---

## POST /api/generate-program

Generates a complete 8-week training program as JSON using Claude, tailored to the user's `UserTrainingProfile`. Returns a valid `Program` object that the client saves as a custom program.

**Request**

```http
POST /api/generate-program
Content-Type: application/json
```

```json
{
  "goals": ["hypertrophy"],
  "trainingAgeYears": 2,
  "daysPerWeek": 4,
  "sessionDurationMinutes": 60,
  "equipment": ["barbell", "dumbbell"],
  "injuries": [],
  "aiSummary": "..."
}
```

**Response 200**

```json
{
  "program": {
    "name": "Intermediate Hypertrophy Push/Pull/Legs",
    "goal": "hypertrophy",
    "experienceLevel": "intermediate",
    "description": "A 4-day PPL program designed for your barbell/dumbbell setup...",
    "daysPerWeek": 4,
    "estimatedDurationWeeks": 8,
    "schedule": [ ... ],
    "tags": ["ppl", "hypertrophy", "ai-generated"],
    "isCustom": true,
    "isAiGenerated": true
  }
}
```

**Server-side validation:** All exercise IDs in the schedule are validated against the known exercise catalogue. If Claude outputs an invalid ID or invalid enum value (goal/experienceLevel), a hardcoded fallback full-body program is returned instead — the endpoint never returns a 4xx/5xx for generation failures.

**Fallback:** Even on Claude API errors, a usable fallback program is returned with `HTTP 200`.

**Model:** `claude-sonnet-4-6` · `max_tokens: 4096`

---

## POST /api/ask

Sends a fitness or health question to Claude and returns an evidence-based answer. Supports multi-turn conversation via optional `conversationHistory`.

**Request**

```http
POST /api/ask
Content-Type: application/json
```

```json
{
  "question": "How much protein do I need to build muscle?",
  "userContext": {
    "goal": "hypertrophy",
    "experienceLevel": "intermediate"
  },
  "conversationHistory": [
    { "role": "user", "content": "Previous question" },
    { "role": "assistant", "content": "Previous answer" }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `question` | `string` | Yes | Max 1000 chars |
| `userContext.goal` | `"hypertrophy" \| "fat-loss" \| "general-fitness"` | No | Personalizes the response |
| `userContext.experienceLevel` | `"beginner" \| "intermediate" \| "advanced"` | No | Personalizes the response |
| `conversationHistory` | `{role, content}[]` | No | Up to last 4 exchanges; enables follow-up questions |

**Response 200**

```json
{ "answer": "Protein needs for muscle building typically range from **1.6–2.2 g per kg**..." }
```

**Errors**

| Status | Cause |
|---|---|
| `400` | Missing/empty question or question > 1000 chars |
| `405` | Non-POST request |
| `500` | Claude API failure or missing `ANTHROPIC_API_KEY` |

**Model:** `claude-sonnet-4-6` · `max_tokens: 1024`

---

## POST /api/insights

Analyzes a user's recent workout history and returns personalized training insights.

**Request**

```http
POST /api/insights
Content-Type: application/json
```

```json
{
  "userGoal": "hypertrophy",
  "userExperience": "intermediate",
  "workoutSummary": "Sessions in last 4 weeks: 12\nAverage session volume: 4200 kg\n..."
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `userGoal` | `string` | No | Defaults to `"general fitness"` |
| `userExperience` | `string` | No | Defaults to `"beginner"` |
| `workoutSummary` | `string` | Yes | Max 10,000 chars. Built by `insightsService.ts` |

The `workoutSummary` is generated client-side: filters to last 28 days (max 20 sessions), calculates total/avg volume, lists each session with date, volume, duration, and top exercises.

**Response 200**

```json
{ "insight": "**Training Overview**\nYour training shows strong consistency..." }
```

**Errors**

| Status | Cause |
|---|---|
| `400` | Missing `workoutSummary` or summary > 10,000 chars |
| `401` | Missing/invalid Bearer token |
| `405` | Non-POST request |
| `500` | Claude API failure or missing `ANTHROPIC_API_KEY` |

**Model:** `claude-sonnet-4-6` · `max_tokens: 1024`

---

## GET /api/articles

Fetches recent peer-reviewed research from PubMed for a fitness category.

**Request**

```
GET /api/articles?category=strength-training&limit=5
```

| Param | Type | Default | Notes |
|---|---|---|---|
| `category` | `string` | `strength-training` | See valid values below |
| `limit` | `number` | `5` | Max `10` |

**Valid `category` values**

| Value | Focus |
|---|---|
| `strength-training` | Resistance training, hypertrophy, strength |
| `nutrition` | Sports nutrition, protein, macronutrients |
| `recovery` | Exercise recovery, DOMS, muscle repair |
| `sleep` | Sleep quality, athletic performance |
| `metabolic-health` | Insulin sensitivity, body composition |
| `cardio` | Aerobic exercise, HIIT |
| `mobility` | Flexibility, stretching, range of motion |

**Response 200**

```json
{
  "articles": [
    {
      "id": "38563521",
      "title": "Dose-response relationship...",
      "summary": "Abstract text truncated to 400 chars...",
      "source": "Schoenfeld BJ et al. — Journal of Strength and Conditioning Research",
      "sourceUrl": "https://pubmed.ncbi.nlm.nih.gov/38563521/",
      "publishedDate": "2024 Mar",
      "category": "strength-training",
      "cachedAt": "2025-01-24T14:30:00.000Z"
    }
  ]
}
```

Caching is handled **client-side** in `localStorage` with a 6-hour TTL per category.

**Errors**

| Status | Cause |
|---|---|
| `400` | Unrecognised `category` |
| `405` | Non-GET request |
| `500` | PubMed API failure |

---

## POST /api/setup-profile

Creates the user's profile row in `profiles` using the Supabase Admin SDK, bypassing Row Level Security. Called immediately after `supabase.auth.signUp()` during onboarding.

This endpoint exists because when email confirmation is enabled, no client session exists after `signUp()` — so `auth.uid()` is null and direct client inserts would fail the RLS check.

**Request**

```http
POST /api/setup-profile
Content-Type: application/json
```

```json
{
  "userId": "uuid-of-new-user",
  "name": "Alex",
  "goal": "hypertrophy",
  "experienceLevel": "intermediate",
  "activeProgramId": "program-id"
}
```

| Field | Type | Required |
|---|---|---|
| `userId` | `string` (UUID) | Yes |
| `name` | `string` | Yes |
| `goal` | `string` | Yes |
| `experienceLevel` | `string` | Yes |
| `activeProgramId` | `string` | No |

The server verifies `userId` exists in `auth.users` before inserting. Duplicate key (`23505`) returns `200` silently.

**Response 200**

```json
{ "ok": true }
```

**Errors**

| Status | Cause |
|---|---|
| `400` | Missing required fields |
| `401` | `userId` not found in auth.users |
| `405` | Non-POST request |
| `500` | Supabase insert failure |

---

## POST /api/notify-friends

Sends a Web Push notification to all accepted friends of the authenticated user when they complete a workout. Called fire-and-forget from `useWorkoutSession.completeWorkout()`.

**Request**

```http
POST /api/notify-friends
Authorization: Bearer <supabase-access-token>
Content-Type: application/json
```

```json
{
  "userName": "Alex",
  "sessionSummary": "Completed Push Day — 4,200 kg volume"
}
```

| Field | Type | Required |
|---|---|---|
| `userName` | `string` | Yes |
| `sessionSummary` | `string` | No |

The server fetches the user's accepted friends, looks up their `push_subscriptions` rows, and delivers via `web-push`. Stale/expired endpoints (410 Gone) are cleaned from the table automatically.

**Response 200**

```json
{ "sent": 3 }
```

**Errors**

| Status | Cause |
|---|---|
| `401` | Missing/invalid Bearer token |
| `405` | Non-POST request |
| `500` | Push delivery failure or missing VAPID keys |

---

## GET /api/daily-reminder

**Vercel Cron** — runs at **9am UTC daily**. Sends a motivational push notification to all users with an active push subscription.

Not called by the client. Scheduled in `vercel.json`:
```json
{ "path": "/api/daily-reminder", "schedule": "0 9 * * *" }
```

**Response 200**

```json
{ "sent": 142 }
```

---

## GET /api/training-notifications

**Vercel Cron** - runs at **5pm UTC daily**. Sends two categories of push notifications:

1. Missed-day nudges at fixed inactivity checkpoints (`2`, `3`, `7`, `14` days since the last completed session)
2. Progress milestones reached in the last 24 hours (session count, volume, and streak milestones)

Not called by the client. Scheduled in `vercel.json`:
```json
{ "path": "/api/training-notifications", "schedule": "0 17 * * *" }
```

**Response 200**

```json
{ "sent": 37, "usersEvaluated": 214 }
```

---

## GET /api/weekly-digest

**Vercel Cron** — runs at **8am UTC every Monday**. Sends each subscribed user a summary comparing their current week's training volume to the previous week.

Not called by the client. Scheduled in `vercel.json`:
```json
{ "path": "/api/weekly-digest", "schedule": "0 8 * * 1" }
```

> **Also on Mondays:** `GET /api/generate-shared-challenge` runs at **6am UTC** (before the digest) to create the new weekly community challenge. See the [generate-shared-challenge](#get-apigenerate-shared-challenge) section above.

**Response 200**

```json
{ "sent": 89 }
```

---

## GET /api/export-data

Returns a JSON download of all the authenticated user's data. GDPR Article 20 (data portability).

**Request**

```http
GET /api/export-data
Authorization: Bearer <supabase-access-token>
```

**Response 200**

```http
Content-Type: application/json
Content-Disposition: attachment; filename="omnexus-data-2026-02-25.json"
```

```json
{
  "exportedAt": "2026-02-25T12:00:00.000Z",
  "profile": { ... },
  "workoutSessions": [ ... ],
  "personalRecords": [ ... ],
  "learningProgress": { ... },
  "customPrograms": [ ... ]
}
```

**Errors**

| Status | Cause |
|---|---|
| `401` | Missing/invalid Bearer token |
| `405` | Non-GET request |
| `500` | Supabase fetch failure |

---

## DELETE /api/delete-account

Permanently deletes the authenticated user's account and all associated data. GDPR Article 17 (right to erasure).

**Deletion order** (respects foreign-key constraints):
1. `challenge_participants`
2. `friendships` (both `requester_id` and `addressee_id`)
3. `push_subscriptions`
4. `personal_records`
5. `workout_sessions`
6. `nutrition_logs`
7. `measurements`
8. `learning_progress`
9. `custom_programs`
10. `challenges` (created by user)
11. `profiles`
12. `auth.users` via `supabaseAdmin.auth.admin.deleteUser()`

**Request**

```http
DELETE /api/delete-account
Authorization: Bearer <supabase-access-token>
```

**Response 200**

```json
{ "ok": true }
```

After receiving `200`, the client calls `localStorage.clear()` then `supabase.auth.signOut()` and redirects to `/login`.

**Errors**

| Status | Cause |
|---|---|
| `401` | Missing/invalid Bearer token |
| `405` | Non-DELETE request |
| `500` | Supabase delete failure |

---

## POST /api/adapt

Analyzes the exercises from a completed workout session and returns per-exercise adjustment recommendations using Claude.

**Request**

```http
POST /api/adapt
Content-Type: application/json
Authorization: Bearer <supabase-access-token>
```

```json
{
  "userId": "uuid",
  "exerciseSets": [
    {
      "exerciseId": "barbell-squat",
      "exerciseName": "Barbell Squat",
      "sets": [
        { "setNumber": 1, "weight": 100, "reps": 5, "completed": true, "rpe": 8, "timestamp": "..." }
      ]
    }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `userId` | `string` (UUID) | Yes | Caller passes Supabase user ID |
| `exerciseSets` | `array` | Yes | Exercises + sets from the completed session |

**Process:**
1. Fetches last 3 sessions containing each `exerciseId` from `workout_sessions` using service role
2. Builds per-exercise history table: `[date, sets×reps×weight, avgRPE]`
3. Sends to Claude (`claude-sonnet-4-6`, `max_tokens: 1024`) for double-progression analysis
4. Returns JSON with per-exercise actions and a session narrative summary

**Response 200**

```json
{
  "adaptations": [
    {
      "exerciseId": "barbell-squat",
      "exerciseName": "Barbell Squat",
      "action": "increase_weight",
      "suggestion": "Add 2.5 kg next session — hit all reps at RPE 7",
      "confidence": "high"
    }
  ],
  "summary": "Strong session today. You're progressing well on compound lifts."
}
```

`action` values: `increase_weight` | `decrease_weight` | `increase_reps` | `maintain` | `deload`
`confidence` values: `high` | `medium` | `low`

**Fallback:** On Claude error, returns `{ adaptations: [], summary: "..." }` with `HTTP 200` — never errors.

**Model:** `claude-sonnet-4-6` · `max_tokens: 1024`

---

## POST /api/generate-missions

Generates 4–5 program-scoped block missions using Claude when a user activates a training program.

**Request**

```http
POST /api/generate-missions
Content-Type: application/json
```

```json
{
  "userId": "uuid",
  "programId": "program-id",
  "programName": "PPL Hypertrophy",
  "goal": "hypertrophy",
  "experienceLevel": "intermediate",
  "daysPerWeek": 3,
  "durationWeeks": 8
}
```

**Process:**
1. Claude generates 4–5 missions as JSON: `{ type, description, target }` per mission
2. Deletes existing `active` missions for `(userId, programId)` via service role
3. Inserts new missions to `block_missions`
4. Returns `{ missions: BlockMission[] }`

**Response 200**

```json
{
  "missions": [
    {
      "id": "uuid",
      "userId": "uuid",
      "programId": "program-id",
      "type": "pr",
      "description": "Hit a new 1RM on Barbell Squat",
      "target": { "metric": "pr_count", "value": 1, "unit": "PRs" },
      "progress": { "current": 0, "history": [] },
      "status": "active",
      "createdAt": "..."
    }
  ]
}
```

**Errors**

| Status | Cause |
|---|---|
| `400` | Missing required fields |
| `500` | Claude API failure or database error |

**Model:** `claude-sonnet-4-6` · `max_tokens: 512`

---

## POST /api/generate-personal-challenge

Generates a personalized 7-day AI challenge for a single user based on their goal, experience level, and recent activity.

**Request**

```http
POST /api/generate-personal-challenge
Content-Type: application/json
```

```json
{
  "userId": "uuid",
  "goal": "hypertrophy",
  "experienceLevel": "intermediate",
  "recentStats": {
    "weeklyVolume": 12500,
    "sessionsLast30Days": 14,
    "avgRpe": 7.5
  }
}
```

**Response 200**

```json
{
  "challenge": {
    "id": "uuid",
    "userId": "uuid",
    "type": "personal",
    "title": "Volume Surge Week",
    "description": "Push your weekly tonnage to a new high...",
    "metric": "total_volume",
    "target": 15000,
    "unit": "kg",
    "startDate": "2026-02-28",
    "endDate": "2026-03-07",
    "createdAt": "..."
  }
}
```

`metric` values: `total_volume` | `sessions_count` | `pr_count` | `consistency`

**Errors**

| Status | Cause |
|---|---|
| `400` | Missing `userId` |
| `500` | Claude API failure or database error |

**Model:** `claude-sonnet-4-6` · `max_tokens: 256`

---

## GET /api/generate-shared-challenge

**Vercel Cron** — runs at **6am UTC every Monday**. Generates a community-wide 7-day shared challenge visible to all authenticated users.

Not called by the client. Scheduled in `vercel.json`:
```json
{ "path": "/api/generate-shared-challenge", "schedule": "0 6 * * 1" }
```

**Process:**
1. Queries aggregate workout stats from the last 7 days (all users, service role)
2. Claude generates a community challenge JSON based on current activity trends
3. Inserts to `ai_challenges` with `user_id = NULL` and `type = 'shared'`
4. Returns `{ challenge: AiChallenge }`

**Response 200**

```json
{
  "challenge": {
    "id": "uuid",
    "userId": null,
    "type": "shared",
    "title": "Community Volume Week",
    "description": "This week the whole community is lifting together...",
    "metric": "sessions_count",
    "target": 3,
    "unit": "sessions",
    "startDate": "2026-03-03",
    "endDate": "2026-03-10",
    "createdAt": "..."
  }
}
```

**Fallback:** If Claude fails, a hardcoded default challenge is inserted — the endpoint always returns `HTTP 200`.

**Model:** `claude-sonnet-4-6` · `max_tokens: 512`

---

## POST /api/peer-insights

Generates a 2–3 sentence benchmarking narrative comparing the requesting user's peer group activity. Only aggregate statistics are passed to Claude — no individual user records.

**Request**

```http
POST /api/peer-insights
Content-Type: application/json
```

```json
{
  "userId": "uuid",
  "goal": "hypertrophy",
  "experienceLevel": "intermediate"
}
```

| Field | Type | Required |
|---|---|---|
| `userId` | `string` (UUID) | Yes |
| `goal` | `string` | No |
| `experienceLevel` | `string` | No |

**Process:**
1. Service role queries `training_profiles` for all peers (excluding `userId`)
2. Queries `workout_sessions` for those peers in the last 30 days
3. Calculates aggregate averages (sessions/week, volume/week)
4. If `peerCount < 3`: returns `{ hasEnoughPeers: false }` without calling Claude
5. Passes **only aggregated numbers** to Claude (never individual records)
6. Returns Claude-generated narrative

**Response 200 — enough peers**

```json
{
  "narrative": "Your peer group averages 3.2 sessions per week lifting 9,400 kg...",
  "peerCount": 47,
  "hasEnoughPeers": true
}
```

**Response 200 — not enough peers**

```json
{
  "narrative": "",
  "peerCount": 2,
  "hasEnoughPeers": false
}
```

**Errors**

| Status | Cause |
|---|---|
| `400` | Missing `userId` |
| `500` | Claude API failure or database error |

**Model:** `claude-sonnet-4-6` · `max_tokens: 256`

---

## Shared AI System Prompt

Both `/api/ask` and `/api/insights` use this persona:

```
You are Omnexus AI, a health and fitness education assistant.

ALWAYS:
- Root answers in peer-reviewed research and established guidelines (ACSM, WHO, NIH, ISSN)
- Cite sources inline: [Author et al., Year — Journal]
- Explain the "why" behind recommendations
- Acknowledge uncertainty or conflicting evidence
- Use accessible, plain language

NEVER:
- Diagnose, prescribe, or treat medical conditions
- Recommend extreme diets, dangerous training, or harmful practices
- Make guarantees about personal outcomes
- Replace qualified healthcare professionals
```

Every response ends with:
> ⚠️ This is educational information only, not medical advice. Consult a qualified healthcare professional for personal health concerns.

---

## POST /api/signup

Creates a new user account via the Supabase admin API and sends a branded confirmation email via Resend. Using the admin API (rather than `supabase.auth.signUp`) avoids email enumeration protection and allows full control over email design.

**Request**

```http
POST /api/signup
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "redirectTo": "https://your-app.vercel.app/auth/callback"
}
```

**Response (200)**

```json
{ "userId": "uuid", "emailSent": true }
```

**Errors**

| Status | Meaning |
|---|---|
| 400 | Invalid email or password too short (< 6 chars) |
| 409 | Email already registered |
| 429 | Rate limited |
| 500 | Service not configured (missing env vars) |

**Environment variables required:** `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

---

## POST /api/report-bug

Saves a bug report to the `bug_reports` Supabase table. If a valid Bearer token is present, the report is associated with the authenticated user's ID.

**Request**

```http
POST /api/report-bug
Content-Type: application/json
Authorization: Bearer <supabase-access-token>   (optional)
```

```json
{
  "description": "The workout doesn't save after completing a session.",
  "steps": "1. Start workout\n2. Complete all sets\n3. Tap Finish",
  "email": "user@example.com"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `description` | string | Yes | Max 2000 chars |
| `steps` | string | No | Steps to reproduce, max 2000 chars |
| `email` | string | No | Contact email, max 200 chars |

**Response (200)**

```json
{ "ok": true }
```

**Errors**

| Status | Meaning |
|---|---|
| 400 | `description` missing or empty |
| 429 | Rate limited |
| 500 | Database error |

---

## Client-Side Services

| File | Calls | Responsibility |
|---|---|---|
| [`src/services/claudeService.ts`](../src/services/claudeService.ts) | `/api/ask`, `/api/insights` | Typed `fetch()` wrappers; passes conversation history |
| [`src/services/adaptService.ts`](../src/services/adaptService.ts) | `/api/adapt`, `/api/generate-missions`, `/api/generate-personal-challenge`, `/api/peer-insights` | Phase 3 typed wrappers; uses `apiBase` + Supabase auth bearer token |
| [`src/services/insightsService.ts`](../src/services/insightsService.ts) | — | Builds `workoutSummary` string from `WorkoutSession[]` |
| [`src/services/pubmedService.ts`](../src/services/pubmedService.ts) | `/api/articles` | Calls API + manages 6h localStorage cache |
| [`src/lib/db.ts`](../src/lib/db.ts) | Supabase directly | All typed Supabase table operations (incl. `getBlockMissions`, `updateMissionProgress`, `getAiChallenges`) |
| [`src/lib/pushSubscription.ts`](../src/lib/pushSubscription.ts) | `/api/notify-friends` | VAPID subscription management + permission checks |
| [`src/components/onboarding/OnboardingChat.tsx`](../src/components/onboarding/OnboardingChat.tsx) | `/api/onboard` | Chat bubble UI for AI onboarding conversation |
| [`src/components/onboarding/ProfileSummaryCard.tsx`](../src/components/onboarding/ProfileSummaryCard.tsx) | `/api/generate-program` | Profile review + "Generate My 8-Week Program" trigger |
