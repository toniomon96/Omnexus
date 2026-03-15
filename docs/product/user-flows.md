# User Flows

## Onboarding

1. User chooses account onboarding or guest mode.
2. Account onboarding collects identity and training inputs, then runs the multi-turn AI onboarding chat.
3. The app generates a training profile and program, creates the account, stores the profile, and lands the user on the dashboard.
4. Guest onboarding creates a lightweight local profile and sends the user directly into the app.

## Program Generation

1. User finishes onboarding or opens the dedicated generation flow.
2. Frontend sends a structured request to `/api/generate-program`.
3. Backend validates input, calls AI generation, and falls back to the deterministic engine if needed.
4. The resulting program is stored and surfaced in training pages.

## Starting a Workout

1. User opens Dashboard, Train, Program Detail, or Quick Log.
2. The app resolves the current session context and any pre-workout guidance.
3. Starting a workout creates or resumes an active session in state and persistence.
4. The workout screen loads exercises, sets, rest timing, and completion handling.

## Logging a Set

1. User enters reps, weight, and optional RPE in the active workout screen.
2. Session state updates locally first for responsiveness.
3. Completion logic recalculates totals, PRs, and post-workout summaries.
4. Sync helpers persist the session; the UI surfaces sync state and any failures.

## Viewing Insights

1. User opens the insights surface after workout history exists.
2. Frontend composes a request from recent sessions and profile context.
3. Backend analyzes recent training and returns actionable insight cards.
4. The UI pairs insight summaries with adjacent actions such as adaptation, progression, or the next workout.

## Learning System Usage

1. User opens Learn and sees current recommendations, progress, and due review work.
2. Lessons update local and server-backed progress state as they are completed.
3. Quizzes and checkpoints reinforce understanding and award XP.
4. Spaced repetition and recommendations bring the user back into the learning loop later.
