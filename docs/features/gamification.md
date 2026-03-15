# Gamification System

XP system, rank thresholds, streak mechanics, achievement catalogue, Sparks currency, combo multiplier, and the XP events log.

---

## Overview

The gamification system is the engagement engine behind the Omnexus learning system. It rewards every meaningful action a user takes — completing a lesson, logging a workout, earning a personal record — with XP and progress toward the next rank. Combined with daily streaks, achievement badges, and the Sparks currency, it creates a daily habit loop that makes the app genuinely addictive.

---

## XP Calculation Rules

### XP Awarded by Action

| Action | XP |
|---|---|
| Complete a lesson | 10 XP |
| Perfect quiz score (module quiz) | 20 XP |
| Complete a full module | 50 XP |
| Complete a course | 200 XP |
| Complete a workout | 25 XP |
| Log nutrition (daily macro entry) | 5 XP |
| Earn a personal record (PR) | 15 XP |
| Daily lesson challenge completion | Triple XP for the lesson (30 XP) |
| Interactive lesson checkpoint correct | Mini XP reward (2 XP) |

### Combo Multiplier

Answering quiz questions correctly in a row builds a combo. The multiplier applies to quiz XP only:

| Combo | XP Multiplier |
|---|---|
| 3 in a row | 1.25× |
| 5 in a row | 1.5× |
| 10 in a row | 2× |

Breaking the combo resets to 1×. The combo counter is displayed visually during the quiz session.

### Premium Subscription Bonus

Users with an active Premium subscription earn **double Sparks** on all Sparks-earning actions. XP rates are identical for free and premium users.

---

## Omnexus Rank System

Ranks create a progression narrative. Each rank unlock triggers a full-screen animated celebration. Higher ranks unlock new content, custom UI themes, and profile badges.

| Rank | Name | XP Range | Unlocks |
|---|---|---|---|
| 1 | Recruit | 0 – 499 XP | Basic profile badge |
| 2 | Trainee | 500 – 1,499 XP | Trainee profile badge + UI accent color |
| 3 | Athlete | 1,500 – 3,499 XP | Athlete badge + exclusive streak decoration |
| 4 | Competitor | 3,500 – 6,999 XP | Competitor badge + early-access content unlock |
| 5 | Elite | 7,000 – 11,999 XP | Elite badge + Elite UI theme |
| 6 | Coach | 12,000 – 19,999 XP | Coach badge + community mentoring badge |
| 7 | Master | 20,000 – 34,999 XP | Master badge + Master UI theme |
| 8 | Legend | 35,000+ XP | Legend badge + Legend profile frame + exclusive community status |

---

## Learning Streaks

Completing at least one lesson per day maintains the user's learning streak.

### Streak Display
The streak counter appears prominently in the app header/navigation. It is never hidden.

### Streak Milestones and Badges

| Streak Days | Badge Earned |
|---|---|
| 7 | Consistent Learner |
| 30 | Knowledge Seeker |
| 100 | Scholar |
| 365 | Einstein *(highest learning achievement)* |

Each milestone triggers a full-screen special moment with the streak number displayed large and an auto-generated share card.

### Streak Freeze
Missing a day offers a **streak freeze mechanic**:
- Users can spend earned Sparks to protect their streak once per week.
- Freeze tokens are tracked in the `learning_streaks` table (`freeze_tokens` column).
- Users earn one freeze token per 7-day active streak maintained.
- A freeze is consumed automatically if the user has tokens and misses a day.

---

## Sparks Currency

Sparks are the in-app engagement currency. They are earned through consistent activity and spent on utility and cosmetic features.

### Earning Sparks

| Action | Sparks Earned |
|---|---|
| Completing a 7-day streak | 10 Sparks |
| Completing a full course | 25 Sparks |
| Winning a Knowledge Battle | 15 Sparks |
| High-rated Teach It Back contribution | 5 Sparks |
| Premium subscribers earn | Double on all above |

### Spending Sparks

| Item | Sparks Cost |
|---|---|
| Streak freeze (1 use) | 10 Sparks |
| Hint unlock during a quiz (1 use) | 3 Sparks |
| Cosmetic profile customization | 20–50 Sparks |

**Important:** Sparks are **not purchasable with real money** in v1. They are a pure engagement mechanic. This preserves the integrity of the currency and avoids pay-to-win dynamics.

---

## Achievement Catalogue

### Bronze Tier — Early Milestones

| ID | Name | Trigger | XP Reward |
|---|---|---|---|
| `first-lesson` | First Lesson | Complete first lesson | 5 XP |
| `first-workout` | First Workout | Log first workout | 5 XP |
| `first-pr` | First PR | Record first personal best | 10 XP |
| `first-perfect-quiz` | Perfect Score | Score 100% on a quiz | 10 XP |
| `first-week-streak` | Week Warrior | Maintain a 7-day streak | 15 XP |
| `explorer` | Explorer | Visit all 5 app sections | 10 XP |

### Silver Tier — Sustained Engagement

| ID | Name | Trigger | XP Reward |
|---|---|---|---|
| `ten-workouts` | Ten-Strong | Log 10 workouts | 25 XP |
| `thirty-day-streak` | Knowledge Seeker | Maintain a 30-day streak | 50 XP |
| `first-course` | Course Graduate | Complete first full course | 30 XP |
| `first-program` | Program Finisher | Complete an 8-week program | 50 XP |
| `nutrition-tracker` | Fuel the Machine | Log nutrition 7 consecutive days | 20 XP |
| `social-butterfly` | Social Butterfly | Add first friend + give first reaction | 15 XP |

### Gold Tier — Mastery

| ID | Name | Trigger | XP Reward |
|---|---|---|---|
| `hundred-workouts` | Century | Log 100 workouts | 100 XP |
| `year-streak` | 365 | Maintain a 365-day streak | 500 XP |
| `all-courses` | Omnexus Scholar | Complete every available course | 250 XP |
| `fifty-prs` | PR Machine | Record 50 personal bests | 100 XP |
| `ambassador` | Ambassador | Refer 5 friends who register | 150 XP |
| `legend-rank` | Legendary | Reach Rank 8 (Legend) | 200 XP |

### Achievement Display
Achievements display prominently on the Profile page with:
- Achievement icon
- Achievement name
- Tier badge (bronze/silver/gold)
- Earned date
- XP reward received
- Share card button (generates a shareable image)

---

## Weekly XP Leaderboard

Every week, users compete with friends on XP earned that week. The leaderboard resets every **Monday at 00:00 UTC**.

- Top 3 users on the friends leaderboard earn special profile decorations for that week.
- This is separate from the workout leaderboard and specifically rewards **learning engagement**.
- `weekly_xp` in `user_xp` is reset to 0 on Monday. Historical weekly XP is queryable from `xp_events`.

---

## Daily Lesson Challenge

Each day at midnight UTC, the system selects one specific lesson to feature as the **Daily Challenge**. That lesson awards **triple XP** (30 XP instead of 10) if completed before midnight UTC.

- The challenge is the same for all users (not personalized) to encourage social discussion.
- Challenge state is stored in a `daily_challenges` table with the lesson ID and date.
- The Challenge indicator appears prominently on the Learn tab home screen.

---

## Celebration Mechanics

Every significant gamification event triggers a visual celebration:

| Event | Celebration |
|---|---|
| **Rank up** | Full-screen animated celebration with new rank badge, confetti burst, summary of what unlocked |
| **Perfect quiz** | Screen flashes gold briefly, 2× XP bonus displayed, combo counter animates to new total |
| **Streak milestone** (7/30/100/365 days) | Full-screen moment with streak number displayed large, auto-generated share card |
| **Achievement unlock** | Toast notification rises from bottom with achievement icon, name, and XP reward. Tapping opens full achievement detail. |
| **Personal record** | Existing confetti mechanic (already implemented) + XP award overlay |
| **Course completion** | Certificate-style completion screen with course name, completion date, and share button. Certificate stored in profile. |

**Design principle:** The rest of the UI is calm and premium so that celebrations feel special rather than constant noise.

---

## XP Events Log

The `xp_events` table is an **append-only event log** — the source of truth for all XP activity. It serves:
- Audit trail for user XP history
- Feed for the "Your XP History" screen on the profile
- Source for analytics (which actions drive the most engagement?)
- Replay source if `user_xp.total_xp` ever needs to be recalculated

### Event Types

```typescript
type XpEventType =
  | 'lesson_completed'
  | 'quiz_perfect'
  | 'module_completed'
  | 'course_completed'
  | 'workout_completed'
  | 'nutrition_logged'
  | 'personal_record'
  | 'daily_challenge'
  | 'checkpoint_correct'
  | 'achievement_unlock'
  | 'battle_won'
  | 'battle_participated'
```

---

## Database Schema

See `learning-system.md` for the full SQL schema. The gamification tables are:

```sql
user_xp           -- totalXp, weeklyXp, currentRank, weeklyXpResetsAt
learning_streaks  -- currentStreak, longestStreak, lastLessonDate, freezeTokens
achievements      -- static catalogue: id, name, description, tier, xpReward, iconName
user_achievements -- userId + achievementId + earnedAt
user_sparks       -- totalSparks, earnedLifetime, spentLifetime
xp_events         -- append-only log: userId, eventType, xpAmount, description, createdAt
```

---

## AppContext Integration

The `AppContext` reducer handles gamification state so that UI celebrations fire immediately on the client without a round-trip to Supabase:

```typescript
// Optimistic XP update on lesson completion
dispatch({ type: 'LESSON_COMPLETED', lessonId, xpAmount: 10 });

// Reducer checks if xp crosses a rank threshold and fires RANK_UP action
// RANK_UP action triggers the full-screen celebration component
```

**Sync strategy:** Optimistic update on client → async write to `xp_events` and `user_xp` in Supabase → reconcile on next app load.

---

## Sprint Plan

| Sprint | Deliverable |
|---|---|
| **Sprint C** | Create six Supabase tables. Build XP event system in AppContext reducer. Implement Rank system with visual rank badge components. Build Streak tracker component. Add XP rewards to: workout completion, lesson completion, PR celebration. Build Achievement catalogue. |
| **Sprint D** | Add combo multiplier to quiz engine. Build Daily Lesson Challenge feature. Integrate Sparks earning for course completion. |
| **Sprint F** | Weekly XP leaderboard integration with learning. Knowledge Battle XP flow. Teach It Back Sparks rewards. Study Group shared XP. |
| **Sprint J** | Build all celebration animations: rank-up full screen, perfect quiz gold flash, streak milestone full screen, achievement toast, course completion certificate. Build share card generator. |

---

## Related Documents

- `learning-system.md` — course architecture, quiz design, spaced repetition, lesson format
- `ai-coach.md` — Omni references user rank and streak in coaching responses
- `../archive/Program_Mastery.md` — Part Two (original gamification vision)
