# Program Generation Architecture

This document describes how Omnexus builds AI training programs and protects users from malformed or low-quality outputs.

## Goals

- Respect user inputs: goal, experience, days per week, preferred split, equipment, injuries, and session duration.
- Produce coach-like programs with clear week-to-week progression.
- Block malformed or structurally weak programs before they reach the UI.
- Keep runtime predictable without adding extra model calls.

## Current Pipeline

Omnexus uses a single model call with a staged server-side acceptance pipeline.

1. AI generation
- Endpoint: `POST /api/generate-program`
- Model: `claude-sonnet-4-6`
- Prompt includes split constraints, progression requirements, equipment/injury filters, and movement-balance guidance.

2. JSON extraction
- The handler strips code fences and extracts the outer JSON object candidate.

3. Structural normalization
- Invalid or weak fields are normalized in-process:
  - day count clamped to supported range
  - schemes clamped (sets, rest, optional RPE)
  - missing progression notes backfilled
  - unknown values replaced with safe defaults

4. Integrity validation
- Program is accepted only if it passes quality gates:
  - valid schema and known exercise IDs
  - progression structure completeness (W1-W8 markers and deload checks)
  - movement-balance checks (pull >= push)
  - lower-body volume floor
  - core/conditioning presence
  - duration realism checks per day
  - explicit split enforcement when user requests `upper-lower`, `push-pull-legs`, or `full-body`

5. Fallback safety
- If parsing, normalization, or integrity checks fail, server returns deterministic fallback program.
- API still returns usable `200` response so user flow remains resilient.

## Split Validation Rules

Split validation is strict only when the user explicitly requests a split style.

- `full-body`: every day must be `full-body`
- `upper-lower`:
  - 4-day: `upper, lower, upper, lower`
  - 5-day: `upper, lower, upper, lower, upper`
  - 6-day: alternating upper/lower
- `push-pull-legs`:
  - 3-day: `push, pull, legs`
  - 4-day: `push, pull, legs, upper`
  - 5-day: `push, pull, legs, upper, lower`
  - 6-day: `push, pull, legs, push, pull, legs`

If `programStyle` is `any` or unset, split mismatch is not used as a rejection criterion.

## Progression Logic Requirements

Two progression layers are required:

- Program level: `weeklyProgressionNotes` must have 8 entries with ordered week markers and deload guidance in week 4.
- Exercise level: each exercise `notes` must include full W1-W8 markers and a week-4 deload marker.

Programs missing either layer are rejected and replaced with fallback.

## Duration Realism

Each day is scored with a rough duration estimate based on:

- set count
- rep targets
- rest periods
- per-exercise transition/logging overhead

Days outside acceptable bounds relative to requested session duration are rejected.

## Rendering and Parsing Safety

- UI only consumes accepted program payloads.
- Workout start logic sanitizes set counts and blocks malformed empty day payloads.
- This prevents malformed AI output from creating invalid active sessions.

## Performance Notes

- No additional model calls were introduced in this phase.
- All added checks are in-memory and lightweight compared to model latency.
- Quota accounting and fallback behavior remain unchanged.

## Key Files

- `api/generate-program.ts`
- `api/generate-program.test.ts`
- `src/hooks/useWorkoutSession.ts`

## Future Evolution

If generation quality still plateaus, the next safe evolution is a two-call pipeline:

1. Structure blueprint generation
2. Exercise population + progression pass

This should only be introduced if quality improvements cannot be reached with current single-call prompt + validation architecture.
