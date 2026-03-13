import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const anthropicCreateMock = vi.hoisted(() => vi.fn());

vi.mock('@anthropic-ai/sdk', () => ({
  default: class AnthropicMock {
    messages = { create: anthropicCreateMock };
  },
}));

function createMockResponse() {
  let statusCode = 200;
  let body: unknown;

  const res = {
    setHeader() {
      return res;
    },
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      body = payload;
      return res;
    },
    end() {
      return res;
    },
  } as unknown as VercelResponse;

  return {
    res,
    getStatusCode: () => statusCode,
    getBody: () => body,
  };
}

function createReq(body: Record<string, unknown>): VercelRequest {
  return {
    method: 'POST',
    headers: { origin: 'http://localhost:3000' },
    socket: { remoteAddress: '127.0.0.1' },
    body,
  } as unknown as VercelRequest;
}

const baseProfile = {
  goals: ['hypertrophy'],
  trainingAgeYears: 2,
  daysPerWeek: 4,
  sessionDurationMinutes: 60,
  equipment: ['full gym'],
  injuries: [],
  aiSummary: 'test profile',
};

describe('generate-program integrity pipeline', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it('returns fallback program when AI JSON is malformed', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    anthropicCreateMock.mockResolvedValue({
      content: [{ type: 'text', text: '{ this-is-not-valid-json' }],
    });

    const { default: generateProgram } = await import('./generate-program.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await generateProgram(createReq(baseProfile), res);

    expect(getStatusCode()).toBe(200);
    const body = getBody() as { program?: { name?: string; schedule?: unknown[] } };
    expect(body.program?.name).toBe('Full-Body Foundation Program');
    expect(Array.isArray(body.program?.schedule)).toBe(true);
  });

  it('normalizes sparse AI output into a complete multi-day draft', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    anthropicCreateMock.mockResolvedValue({
      content: [{
        type: 'text',
        text: JSON.stringify({
          name: 'Custom Strength Draft',
          goal: 'hypertrophy',
          experienceLevel: 'intermediate',
          description: 'Custom draft from AI.',
          daysPerWeek: 4,
          estimatedDurationWeeks: 8,
          schedule: [
            {
              label: 'Day 1',
              type: 'full-body',
              exercises: [
                { exerciseId: 'barbell-bench-press', scheme: { sets: 3, reps: '6-8', restSeconds: 120 } },
                { exerciseId: 'barbell-row', scheme: { sets: 3, reps: '6-8', restSeconds: 120 } },
                { exerciseId: 'barbell-back-squat', scheme: { sets: 3, reps: '6-8', restSeconds: 150 } },
                { exerciseId: 'plank', scheme: { sets: 3, reps: '45s', restSeconds: 60 } },
                { exerciseId: 'lat-pulldown', scheme: { sets: 3, reps: '8-10', restSeconds: 90 } },
              ],
            },
            {
              label: 'Day 2',
              type: 'full-body',
              exercises: [
                { exerciseId: 'dumbbell-bench-press', scheme: { sets: 3, reps: '8-10', restSeconds: 90 } },
                { exerciseId: 'seated-cable-row', scheme: { sets: 3, reps: '8-10', restSeconds: 90 } },
                { exerciseId: 'pull-up', scheme: { sets: 3, reps: '6-8', restSeconds: 120 } },
                { exerciseId: 'walking-lunge', scheme: { sets: 3, reps: '10-12', restSeconds: 90 } },
                { exerciseId: 'hanging-leg-raise', scheme: { sets: 3, reps: '10-15', restSeconds: 60 } },
              ],
            },
            {
              label: 'Day 3',
              type: 'full-body',
              exercises: [
                { exerciseId: 'incline-dumbbell-press', scheme: { sets: 3, reps: '8-10', restSeconds: 90 } },
                { exerciseId: 'dumbbell-row', scheme: { sets: 3, reps: '8-10', restSeconds: 90 } },
                { exerciseId: 'lat-pulldown', scheme: { sets: 3, reps: '8-10', restSeconds: 90 } },
                { exerciseId: 'hip-thrust', scheme: { sets: 3, reps: '8-10', restSeconds: 120 } },
                { exerciseId: 'ab-wheel-rollout', scheme: { sets: 3, reps: '8-12', restSeconds: 60 } },
              ],
            },
            {
              label: 'Day 4',
              type: 'full-body',
              exercises: [
                { exerciseId: 'push-up', scheme: { sets: 3, reps: '12-15', restSeconds: 60 } },
                { exerciseId: 'barbell-row', scheme: { sets: 3, reps: '6-8', restSeconds: 120 } },
                { exerciseId: 'pull-up', scheme: { sets: 3, reps: '6-8', restSeconds: 120 } },
                { exerciseId: 'goblet-squat', scheme: { sets: 3, reps: '10-12', restSeconds: 90 } },
                { exerciseId: 'cable-crunch', scheme: { sets: 3, reps: '12-15', restSeconds: 60 } },
              ],
            },
          ],
          weeklyProgressionNotes: [
            'Week 1: Build baseline',
            'Week 2: Add reps',
            'Week 3: Add load',
            'Week 4: Deload and recover',
            'Week 5: Rebuild volume',
            'Week 6: Push intensity',
            'Week 7: Peak performance',
            'Week 8: Test and reset',
          ],
          tags: ['hypertrophy', 'full-body'],
        }),
      }],
    });

    const { default: generateProgram } = await import('./generate-program.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await generateProgram(createReq(baseProfile), res);

    expect(getStatusCode()).toBe(200);
    const body = getBody() as { program?: { name?: string; daysPerWeek?: number; schedule?: Array<{ exercises: unknown[] }>; weeklyProgressionNotes?: string[] } };
    expect(body.program?.name).toBe('Custom Strength Draft');
    expect(body.program?.daysPerWeek).toBe(4);
    expect(body.program?.schedule?.length).toBe(4);
    expect(body.program?.schedule?.every((day) => day.exercises.length >= 5)).toBe(true);
    expect(body.program?.weeklyProgressionNotes?.length).toBe(8);
  });

  it('falls back when integrity checks fail push-pull balance', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    anthropicCreateMock.mockResolvedValue({
      content: [{
        type: 'text',
        text: JSON.stringify({
          name: 'Push Only Program',
          goal: 'hypertrophy',
          experienceLevel: 'intermediate',
          description: 'Unbalanced program',
          daysPerWeek: 4,
          estimatedDurationWeeks: 8,
          schedule: [
            {
              label: 'Day 1',
              type: 'push',
              exercises: [
                { exerciseId: 'barbell-bench-press', scheme: { sets: 6, reps: '5-6', restSeconds: 120 } },
                { exerciseId: 'dumbbell-bench-press', scheme: { sets: 6, reps: '6-8', restSeconds: 90 } },
                { exerciseId: 'incline-dumbbell-press', scheme: { sets: 6, reps: '8-10', restSeconds: 90 } },
                { exerciseId: 'cable-chest-fly', scheme: { sets: 6, reps: '12-15', restSeconds: 60 } },
                { exerciseId: 'dips', scheme: { sets: 6, reps: '8-10', restSeconds: 90 } },
              ],
            },
            {
              label: 'Day 2',
              type: 'push',
              exercises: [
                { exerciseId: 'barbell-bench-press', scheme: { sets: 6, reps: '5-6', restSeconds: 120 } },
                { exerciseId: 'dumbbell-bench-press', scheme: { sets: 6, reps: '6-8', restSeconds: 90 } },
                { exerciseId: 'incline-dumbbell-press', scheme: { sets: 6, reps: '8-10', restSeconds: 90 } },
                { exerciseId: 'cable-chest-fly', scheme: { sets: 6, reps: '12-15', restSeconds: 60 } },
                { exerciseId: 'dips', scheme: { sets: 6, reps: '8-10', restSeconds: 90 } },
              ],
            },
            {
              label: 'Day 3',
              type: 'push',
              exercises: [
                { exerciseId: 'barbell-bench-press', scheme: { sets: 6, reps: '5-6', restSeconds: 120 } },
                { exerciseId: 'dumbbell-bench-press', scheme: { sets: 6, reps: '6-8', restSeconds: 90 } },
                { exerciseId: 'incline-dumbbell-press', scheme: { sets: 6, reps: '8-10', restSeconds: 90 } },
                { exerciseId: 'cable-chest-fly', scheme: { sets: 6, reps: '12-15', restSeconds: 60 } },
                { exerciseId: 'dips', scheme: { sets: 6, reps: '8-10', restSeconds: 90 } },
              ],
            },
            {
              label: 'Day 4',
              type: 'push',
              exercises: [
                { exerciseId: 'barbell-bench-press', scheme: { sets: 6, reps: '5-6', restSeconds: 120 } },
                { exerciseId: 'dumbbell-bench-press', scheme: { sets: 6, reps: '6-8', restSeconds: 90 } },
                { exerciseId: 'incline-dumbbell-press', scheme: { sets: 6, reps: '8-10', restSeconds: 90 } },
                { exerciseId: 'cable-chest-fly', scheme: { sets: 6, reps: '12-15', restSeconds: 60 } },
                { exerciseId: 'dips', scheme: { sets: 6, reps: '8-10', restSeconds: 90 } },
              ],
            },
          ],
          weeklyProgressionNotes: [
            'Week 1: Push baseline',
            'Week 2: Push volume',
            'Week 3: Push load',
            'Week 4: Deload',
            'Week 5: Push volume',
            'Week 6: Push intensity',
            'Week 7: Push peak',
            'Week 8: Push test',
          ],
          tags: ['push'],
        }),
      }],
    });

    const { default: generateProgram } = await import('./generate-program.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await generateProgram(createReq(baseProfile), res);

    expect(getStatusCode()).toBe(200);
    const body = getBody() as { program?: { name?: string } };
    expect(body.program?.name).toBe('Full-Body Foundation Program');
  });

  it('falls back when explicit split preference is violated', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    anthropicCreateMock.mockResolvedValue({
      content: [{
        type: 'text',
        text: JSON.stringify({
          name: 'Split Violation Program',
          goal: 'hypertrophy',
          experienceLevel: 'intermediate',
          description: 'Balanced but wrong split for requested style.',
          daysPerWeek: 4,
          estimatedDurationWeeks: 8,
          schedule: [
            {
              label: 'Day 1',
              type: 'full-body',
              exercises: [
                {
                  exerciseId: 'barbell-bench-press',
                  scheme: { sets: 3, reps: '8-10', restSeconds: 90 },
                  notes: 'W1: 3x10 @RPE7 | W2: 3x10 @RPE7 | W3: 4x8 @RPE8 | W4: Deload 2x10 @RPE6 | W5: 4x8 @RPE8 | W6: 4x6 @RPE8 | W7: 5x5 @RPE9 | W8: Test',
                },
                {
                  exerciseId: 'barbell-row',
                  scheme: { sets: 3, reps: '8-10', restSeconds: 90 },
                  notes: 'W1: 3x10 @RPE7 | W2: 3x10 @RPE7 | W3: 4x8 @RPE8 | W4: Deload 2x10 @RPE6 | W5: 4x8 @RPE8 | W6: 4x6 @RPE8 | W7: 5x5 @RPE9 | W8: Test',
                },
                {
                  exerciseId: 'barbell-back-squat',
                  scheme: { sets: 3, reps: '8-10', restSeconds: 120 },
                  notes: 'W1: 3x10 @RPE7 | W2: 3x10 @RPE7 | W3: 4x8 @RPE8 | W4: Deload 2x10 @RPE6 | W5: 4x8 @RPE8 | W6: 4x6 @RPE8 | W7: 5x5 @RPE9 | W8: Test',
                },
                {
                  exerciseId: 'lat-pulldown',
                  scheme: { sets: 3, reps: '10-12', restSeconds: 90 },
                  notes: 'W1: 3x12 @RPE7 | W2: 3x12 @RPE7 | W3: 4x10 @RPE8 | W4: Deload 2x12 @RPE6 | W5: 4x10 @RPE8 | W6: 4x8 @RPE8 | W7: 5x6 @RPE9 | W8: Test',
                },
                {
                  exerciseId: 'plank',
                  scheme: { sets: 3, reps: '45s', restSeconds: 60 },
                  notes: 'W1: 3x45s @RPE7 | W2: 3x45s @RPE7 | W3: 4x40s @RPE8 | W4: Deload 2x40s @RPE6 | W5: 4x45s @RPE8 | W6: 4x50s @RPE8 | W7: 5x45s @RPE9 | W8: Test',
                },
              ],
            },
            {
              label: 'Day 2',
              type: 'full-body',
              exercises: [
                {
                  exerciseId: 'dumbbell-bench-press',
                  scheme: { sets: 3, reps: '8-10', restSeconds: 90 },
                  notes: 'W1: 3x10 @RPE7 | W2: 3x10 @RPE7 | W3: 4x8 @RPE8 | W4: Deload 2x10 @RPE6 | W5: 4x8 @RPE8 | W6: 4x6 @RPE8 | W7: 5x5 @RPE9 | W8: Test',
                },
                {
                  exerciseId: 'seated-cable-row',
                  scheme: { sets: 3, reps: '8-10', restSeconds: 90 },
                  notes: 'W1: 3x10 @RPE7 | W2: 3x10 @RPE7 | W3: 4x8 @RPE8 | W4: Deload 2x10 @RPE6 | W5: 4x8 @RPE8 | W6: 4x6 @RPE8 | W7: 5x5 @RPE9 | W8: Test',
                },
                {
                  exerciseId: 'walking-lunge',
                  scheme: { sets: 3, reps: '10-12', restSeconds: 90 },
                  notes: 'W1: 3x12 @RPE7 | W2: 3x12 @RPE7 | W3: 4x10 @RPE8 | W4: Deload 2x12 @RPE6 | W5: 4x10 @RPE8 | W6: 4x8 @RPE8 | W7: 5x8 @RPE9 | W8: Test',
                },
                {
                  exerciseId: 'pull-up',
                  scheme: { sets: 3, reps: '6-8', restSeconds: 120 },
                  notes: 'W1: 3x8 @RPE7 | W2: 3x8 @RPE7 | W3: 4x6 @RPE8 | W4: Deload 2x8 @RPE6 | W5: 4x6 @RPE8 | W6: 4x5 @RPE8 | W7: 5x4 @RPE9 | W8: Test',
                },
                {
                  exerciseId: 'hanging-leg-raise',
                  scheme: { sets: 3, reps: '10-15', restSeconds: 60 },
                  notes: 'W1: 3x15 @RPE7 | W2: 3x15 @RPE7 | W3: 4x12 @RPE8 | W4: Deload 2x15 @RPE6 | W5: 4x12 @RPE8 | W6: 4x10 @RPE8 | W7: 5x10 @RPE9 | W8: Test',
                },
              ],
            },
            {
              label: 'Day 3',
              type: 'full-body',
              exercises: [
                {
                  exerciseId: 'incline-dumbbell-press',
                  scheme: { sets: 3, reps: '8-10', restSeconds: 90 },
                  notes: 'W1: 3x10 @RPE7 | W2: 3x10 @RPE7 | W3: 4x8 @RPE8 | W4: Deload 2x10 @RPE6 | W5: 4x8 @RPE8 | W6: 4x6 @RPE8 | W7: 5x5 @RPE9 | W8: Test',
                },
                {
                  exerciseId: 'dumbbell-row',
                  scheme: { sets: 3, reps: '8-10', restSeconds: 90 },
                  notes: 'W1: 3x10 @RPE7 | W2: 3x10 @RPE7 | W3: 4x8 @RPE8 | W4: Deload 2x10 @RPE6 | W5: 4x8 @RPE8 | W6: 4x6 @RPE8 | W7: 5x5 @RPE9 | W8: Test',
                },
                {
                  exerciseId: 'hip-thrust',
                  scheme: { sets: 3, reps: '8-10', restSeconds: 120 },
                  notes: 'W1: 3x10 @RPE7 | W2: 3x10 @RPE7 | W3: 4x8 @RPE8 | W4: Deload 2x10 @RPE6 | W5: 4x8 @RPE8 | W6: 4x6 @RPE8 | W7: 5x5 @RPE9 | W8: Test',
                },
                {
                  exerciseId: 'lat-pulldown',
                  scheme: { sets: 3, reps: '10-12', restSeconds: 90 },
                  notes: 'W1: 3x12 @RPE7 | W2: 3x12 @RPE7 | W3: 4x10 @RPE8 | W4: Deload 2x12 @RPE6 | W5: 4x10 @RPE8 | W6: 4x8 @RPE8 | W7: 5x6 @RPE9 | W8: Test',
                },
                {
                  exerciseId: 'ab-wheel-rollout',
                  scheme: { sets: 3, reps: '8-12', restSeconds: 60 },
                  notes: 'W1: 3x12 @RPE7 | W2: 3x12 @RPE7 | W3: 4x10 @RPE8 | W4: Deload 2x12 @RPE6 | W5: 4x10 @RPE8 | W6: 4x8 @RPE8 | W7: 5x8 @RPE9 | W8: Test',
                },
              ],
            },
            {
              label: 'Day 4',
              type: 'full-body',
              exercises: [
                {
                  exerciseId: 'push-up',
                  scheme: { sets: 3, reps: '12-15', restSeconds: 60 },
                  notes: 'W1: 3x15 @RPE7 | W2: 3x15 @RPE7 | W3: 4x12 @RPE8 | W4: Deload 2x15 @RPE6 | W5: 4x12 @RPE8 | W6: 4x10 @RPE8 | W7: 5x10 @RPE9 | W8: Test',
                },
                {
                  exerciseId: 'barbell-row',
                  scheme: { sets: 3, reps: '6-8', restSeconds: 120 },
                  notes: 'W1: 3x8 @RPE7 | W2: 3x8 @RPE7 | W3: 4x6 @RPE8 | W4: Deload 2x8 @RPE6 | W5: 4x6 @RPE8 | W6: 4x5 @RPE8 | W7: 5x4 @RPE9 | W8: Test',
                },
                {
                  exerciseId: 'goblet-squat',
                  scheme: { sets: 3, reps: '10-12', restSeconds: 90 },
                  notes: 'W1: 3x12 @RPE7 | W2: 3x12 @RPE7 | W3: 4x10 @RPE8 | W4: Deload 2x12 @RPE6 | W5: 4x10 @RPE8 | W6: 4x8 @RPE8 | W7: 5x8 @RPE9 | W8: Test',
                },
                {
                  exerciseId: 'pull-up',
                  scheme: { sets: 3, reps: '6-8', restSeconds: 120 },
                  notes: 'W1: 3x8 @RPE7 | W2: 3x8 @RPE7 | W3: 4x6 @RPE8 | W4: Deload 2x8 @RPE6 | W5: 4x6 @RPE8 | W6: 4x5 @RPE8 | W7: 5x4 @RPE9 | W8: Test',
                },
                {
                  exerciseId: 'cable-crunch',
                  scheme: { sets: 3, reps: '12-15', restSeconds: 60 },
                  notes: 'W1: 3x15 @RPE7 | W2: 3x15 @RPE7 | W3: 4x12 @RPE8 | W4: Deload 2x15 @RPE6 | W5: 4x12 @RPE8 | W6: 4x10 @RPE8 | W7: 5x10 @RPE9 | W8: Test',
                },
              ],
            },
          ],
          weeklyProgressionNotes: [
            'Week 1: Build baseline',
            'Week 2: Add reps',
            'Week 3: Add load',
            'Week 4: Deload and recover',
            'Week 5: Rebuild volume',
            'Week 6: Push intensity',
            'Week 7: Peak performance',
            'Week 8: Test and reset',
          ],
          tags: ['hypertrophy', 'full-body'],
        }),
      }],
    });

    const { default: generateProgram } = await import('./generate-program.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await generateProgram(createReq({ ...baseProfile, programStyle: 'upper-lower' }), res);

    expect(getStatusCode()).toBe(200);
    const body = getBody() as { program?: { name?: string; schedule?: Array<{ type: string }> } };
    // normalizeProgramCandidate now enforces the expected split pattern on every day before
    // integrity validation. Claude's mislabelled 'full-body' days are corrected to
    // 'upper'/'lower', so the AI program passes integrity and is returned — not the fallback.
    const types = body.program?.schedule?.map(d => d.type);
    expect(types).toEqual(['upper', 'lower', 'upper', 'lower']);
  });
});
