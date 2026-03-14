# Community System

Omnexus community features connect users through friends, challenges, a real-time activity feed, and a weekly leaderboard.

---

## Architecture

All community data lives in Supabase. Real-time updates use Supabase Realtime subscriptions. Social actions (challenge invitations, friend workout notifications) are delivered via Web Push through the `/api/notify-friends` and `/api/notify-progress` endpoints.

---

## Friends

### Data Model

```sql
friendships (
  id uuid,
  user_id  uuid references profiles(id),
  friend_id uuid references profiles(id),
  status   text   -- 'pending' | 'accepted'
)
```

### Features
- Send, accept, and decline friend requests
- View friends list with rank badge and last-active workout
- Friends-only XP leaderboard tab
- Friend workout notifications via Web Push (`/api/notify-friends`)
- Friend milestone notifications via `/api/notify-progress`

### UI
- `src/pages/FriendsPage.tsx` — friend search, pending requests, current friends list
- `src/components/community/FriendCard.tsx` — per-friend display card

---

## Activity Feed

A real-time stream of workout completions and social milestones from the user's friends.

### Data Model

```sql
workout_sessions (
  id uuid, user_id uuid, ... -- existing workout table
)
reactions (
  id uuid,
  session_id  uuid references workout_sessions(id),
  user_id     uuid references profiles(id),
  emoji       text
)
```

### Features
- Live feed of friend workouts using `supabase.channel().on('INSERT')` on `workout_sessions`
- Emoji reaction system (tap to react to any workout)
- Activity items show exercise list, volume summary, and PR badges
- Feed visible to authenticated users only

### UI
- `src/pages/ActivityFeedPage.tsx` — full feed with infinite scroll
- `src/components/community/ActivityItem.tsx` — single feed entry
- `src/components/community/FeedReactionBar.tsx` — emoji reaction bar
- `src/pages/CommunityPage.tsx` — hub page with tabs (Feed / Challenges / Leaderboard)

---

## Leaderboard

Weekly XP ranking across all users and within friends.

### Features
- Global leaderboard by total XP this week
- Friends-only filtered leaderboard
- Rank badge display per user
- Weekly XP resets every Monday midnight UTC

### UI
- `src/pages/LeaderboardPage.tsx`
- `src/components/community/LeaderboardRow.tsx`

---

## Challenges

### Individual Challenges (Personal)

AI-generated personal goals based on the user's recent training history.

- Generated via `POST /api/generate-personal-challenge`
- Stored in `ai_challenges` table with user-specific targets
- Examples: "Hit a new squat PR this week", "Complete 4 workouts in 7 days"

### Shared Challenges (Weekly)

A single community-wide challenge published every Monday.

- Generated via `GET /api/generate-shared-challenge` (Vercel cron, Monday 6 AM UTC)
- Stored in `ai_challenges` with `is_shared = true`
- All users can join and track progress on the same goal

### Cooperative Team Challenges

Users can invite friends to form a team working toward a shared goal.

- Per-challenge leaderboard tracks team vs. individual contributions
- Friend invitation system via `challenge_invitations` table
- Real-time progress updates via Supabase Realtime subscriptions on `challenge_participants`

### Data Model

```sql
challenges (
  id uuid,
  title text, description text, type text,
  target_value numeric, unit text,
  start_date date, end_date date,
  is_cooperative boolean
)
challenge_participants (
  id uuid,
  challenge_id uuid references challenges(id),
  user_id uuid references profiles(id),
  progress numeric, completed_at timestamptz
)
challenge_invitations (
  id uuid,
  challenge_id uuid, from_user_id uuid, to_user_id uuid,
  status text -- 'pending' | 'accepted' | 'declined'
)
```

### UI
- `src/pages/ChallengesPage.tsx` — browse, join, and track challenges
- `src/components/community/ChallengeCard.tsx` — per-challenge card with progress
- `src/components/challenges/PersonalChallengeCard.tsx` — personal AI challenge card

---

## Peer Insights

Anonymous comparisons to peers with similar training profiles.

- `POST /api/peer-insights` — queries anonymized aggregate data from users in the same goal/experience tier
- Surfaced in `src/pages/InsightsPage.tsx` and `src/components/insights/PeerInsightsCard.tsx`
- Never exposes individual user data; always aggregate (e.g., "Athletes like you average 3.8 workouts/week")

---

## Web Push Notifications

Community events that trigger push notifications:

| Event | Endpoint | Trigger |
|---|---|---|
| Friend completes workout | `/api/notify-friends` | After every `completeWorkout()` |
| Friend hits milestone | `/api/notify-progress` | On XP rank-up |
| Daily reminder | `/api/daily-reminder` | Cron: 9 AM UTC daily |
| Training notification | `/api/training-notifications` | Cron: 5 PM UTC daily |
| Weekly digest | `/api/weekly-digest` | Cron: 8 AM UTC Mondays |

Push subscriptions are stored in the `push_subscriptions` table. VAPID keys are required environment variables.
