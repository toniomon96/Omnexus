# Nutrition Tracking

Omnexus nutrition tracking lets users log daily macro intake, set goals, and monitor progress through a date-navigable log and a plate-composition calculator.

---

## Overview

Nutrition is a companion feature to the training system. Users set daily macro targets during onboarding (or in settings) and log meals throughout the day. Logged data is stored in Supabase and synced across devices.

---

## Data Model

```sql
nutrition_logs (
  id          uuid primary key,
  user_id     uuid references profiles(id),
  logged_at   date,
  meal_name   text,          -- 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | custom
  calories    numeric,
  protein_g   numeric,
  carbs_g     numeric,
  fat_g       numeric,
  notes       text
)
```

Macro goals are stored in the `training_profiles` table as part of the user's profile.

---

## Features

### Daily Macro Log
- Log meals by name with calories, protein, carbs, and fat
- Visual progress bars showing actual vs. target for each macro
- Daily summary totals recalculate in real time as entries are added
- Date navigator lets users scroll through past days and view historical logs

### Quick Add
- Pre-populated common meals for fast entry
- Supports custom food entries with manual macro input

### Macro Goal Management
- Set daily targets for calories, protein, carbs, and fat
- Goals accessible and editable from the Nutrition page header
- Targets carry forward as the daily benchmark

### Plate Calculator
- Interactive tool for estimating macro composition of a plate
- Visual plate representation showing protein/carb/fat proportions
- Standalone page accessible from the nutrition section

---

## UI

| File | Purpose |
|---|---|
| `src/pages/NutritionPage.tsx` | Main nutrition hub: log view, macro progress bars, quick add |
| `src/pages/PlateCalculatorPage.tsx` | Interactive plate composition calculator |

---

## AI Integration (Future — v1.x)

The `/api/meal-plan.ts` endpoint exists as a server-side stub for future AI-powered meal plan generation. The endpoint is not surfaced in the UI for v1 but is available for testing via direct API calls.

Future integration will connect logged nutrition data to training load for AI-driven macro adjustment recommendations.
