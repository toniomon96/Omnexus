# Onboarding

Omnexus offers two onboarding paths: a full AI-driven account onboarding flow and a lightweight guest mode for users who want to explore the app without creating an account.

---

## Path 1 — AI Onboarding (New Account)

### Flow Overview

```
/onboarding
  ├── Step 0: Email + password entry
  ├── Step 1: First name
  ├── Step 2: OnboardingChat (multi-turn AI conversation)
  │           → POST /api/onboard (repeated until profileComplete: true)
  │           → Claude gathers: goals, training age, days/week, equipment, injuries, session duration
  │           → Produces UserTrainingProfile
  ├── Step 3: ProfileSummaryCard
  │           → POST /api/generate-program → 8-week mesocycle JSON returned
  │           → supabase.auth.signUp()
  │           → saveAiGeneratedProgram() → custom_programs table
  │           → POST /api/setup-profile (requires active session)
  │           → upsertTrainingProfile() → training_profiles table
  └── → navigate to / (Dashboard)
```

### Key Components

| File | Purpose |
|---|---|
| `src/pages/OnboardingPage.tsx` | Step orchestrator — manages step state |
| `src/components/onboarding/OnboardingChat.tsx` | Chat bubble UI for the AI conversation |
| `src/components/onboarding/OnboardingForm.tsx` | Email + password + name input forms |
| `src/components/onboarding/ProfileSummaryCard.tsx` | Review card + "Generate Program" trigger |
| `src/components/onboarding/ExperienceSelector.tsx` | Training experience level picker |
| `src/components/onboarding/GoalCard.tsx` | Goal selection cards |
| `src/components/onboarding/WelcomeTutorial.tsx` | Post-onboarding app tutorial overlay |
| `src/components/onboarding/AppTutorial.tsx` | Feature walkthrough component |
| `api/onboard.ts` | Multi-turn Claude conversation endpoint |
| `api/generate-program.ts` | 8-week mesocycle generation endpoint |
| `api/setup-profile.ts` | Admin SDK profile row creation |

### Data Produced at Onboarding Completion

| Item | Destination |
|---|---|
| Email + password credentials | Supabase Auth |
| User training profile | `training_profiles` table |
| AI-generated 8-week program | `custom_programs` table |
| Guest data (if migrating) | Merged into account data |

### Email Confirmation

When Supabase email confirmation is enabled, new users see a "Check your email" state after signup. Their profile row is created after first verified login via the profile recovery path in `AuthGuard.hydrate()`.

---

## Path 2 — Guest Mode

### Flow

```
/guest → GuestSetupPage (name + goal) → navigate to /
```

- No account created; data stored exclusively in `localStorage` under `omnexus_guest = true`
- Guest users can access all non-social features (workout tracking, program viewing, exercise library, learning)
- Social features (`/feed`, `/friends`, `/community`) show an upgrade prompt
- Guest banner is shown throughout the app with a clear "Create Account" CTA

### Guest Data Migration

When a guest user creates an account, their localStorage data is migrated to Supabase:

1. `GuestDataMigrationModal` prompts the user to confirm migration
2. `runMigrationIfNeeded()` runs once after first login (via `AuthGuard.hydrate()`)
3. Workout history, learning progress, and gamification data are upserted to the appropriate tables

### Key Files

| File | Purpose |
|---|---|
| `src/pages/GuestSetupPage.tsx` | Guest name + goal setup |
| `src/components/ui/GuestBanner.tsx` | Persistent upgrade prompt for guest users |
| `src/components/ui/GuestDataMigrationModal.tsx` | Migration confirmation modal |

---

## Returning User (Cross-Device Hydration)

```
/login → supabase.auth.signInWithPassword()
       → onAuthStateChange fires
       → AuthGuard.hydrate() (once per session via hydratedRef)
         ├── runMigrationIfNeeded()
         ├── db.fetchHistory()          → dispatch SET_HISTORY
         ├── db.fetchLearningProgress() → dispatch SET_LEARNING_PROGRESS
         └── db.fetchCustomPrograms()   → setCustomPrograms(localStorage)
       → navigate to /
```

The `hydratedRef` guard prevents duplicate hydration calls on navigation.

---

## Tutorial

First-time users (both onboarding and guest) see a feature walkthrough after reaching the Dashboard. The tutorial state is stored per-user in `localStorage` to prevent re-showing on shared devices or re-logins.

| Component | Purpose |
|---|---|
| `src/components/onboarding/WelcomeTutorial.tsx` | Welcome overlay shown after onboarding |
| `src/components/onboarding/AppTutorial.tsx` | Step-by-step feature walkthrough |
