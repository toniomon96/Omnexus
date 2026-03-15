import { describe, expect, it } from 'vitest';
import { generateProgram } from './workoutEngine';
import { buildConditioningDay, deriveConditioningProfile } from './conditioningEngine';
import { EXERCISE_LIBRARY } from '../data/exercises';
import type { UserTrainingProfile } from '../types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseProfile: UserTrainingProfile = {
  goals: ['hypertrophy'],
  trainingAgeYears: 2,
  daysPerWeek: 4,
  sessionDurationMinutes: 60,
  equipment: ['barbell', 'dumbbell', 'cable'],
  injuries: [],
  aiSummary: '',
};

// ─── generateProgram ─────────────────────────────────────────────────────────

describe('generateProgram', () => {
  it('returns a program with the expected shape', () => {
    const program = generateProgram(baseProfile);
    expect(program).toMatchObject({
      name: expect.any(String),
      goal: 'hypertrophy',
      experienceLevel: expect.stringMatching(/beginner|intermediate|advanced/),
      daysPerWeek: 4,
      estimatedDurationWeeks: 8,
      schedule: expect.any(Array),
      tags: expect.any(Array),
      weeklyProgressionNotes: expect.any(Array),
    });
  });

  it('schedule length matches daysPerWeek', () => {
    for (const days of [2, 3, 4, 5, 6]) {
      const p = generateProgram({ ...baseProfile, daysPerWeek: days });
      expect(p.schedule.length).toBe(days);
    }
  });

  it('every exercise in every day has a valid exerciseId', () => {
    const validIds = new Set(EXERCISE_LIBRARY.map((e) => e.id));
    const program = generateProgram(baseProfile);
    for (const day of program.schedule) {
      for (const ex of day.exercises) {
        expect(validIds.has(ex.exerciseId)).toBe(true);
      }
    }
  });

  it('includes progression notes for each exercise', () => {
    const program = generateProgram(baseProfile);
    for (const day of program.schedule) {
      for (const ex of day.exercises) {
        expect(ex.notes).toMatch(/W1:/);
        expect(ex.notes).toMatch(/W4:.*[Dd]eload/);
        expect(ex.notes).toMatch(/W8:/);
      }
    }
  });

  it('always has exactly 8 weekly progression notes', () => {
    const program = generateProgram(baseProfile);
    expect(program.weeklyProgressionNotes).toHaveLength(8);
  });

  it('beginner profile uses beginner experience level', () => {
    const program = generateProgram({ ...baseProfile, trainingAgeYears: 0 });
    expect(program.experienceLevel).toBe('beginner');
  });

  it('generates a full-body program for 3 days per week', () => {
    const program = generateProgram({ ...baseProfile, daysPerWeek: 3 });
    const types = program.schedule.map((d) => d.type);
    expect(types.every((t) => t === 'full-body')).toBe(true);
  });

  it('generates a push-pull-legs program for 6 days per week', () => {
    const program = generateProgram({ ...baseProfile, daysPerWeek: 6 });
    const types = program.schedule.map((d) => d.type);
    expect(types.includes('push') || types.includes('pull') || types.includes('legs')).toBe(true);
  });

  it('adds a conditioning day when includeCardio is true', () => {
    const program = generateProgram({ ...baseProfile, daysPerWeek: 4, includeCardio: true });
    const cardioDay = program.schedule.find((d) => d.type === 'cardio');
    expect(cardioDay).toBeDefined();
  });

  it('excludes conditioning day when includeCardio is false', () => {
    const program = generateProgram({ ...baseProfile, daysPerWeek: 4, includeCardio: false });
    const cardioDay = program.schedule.find((d) => d.type === 'cardio');
    expect(cardioDay).toBeUndefined();
  });

  it('fat-loss goal produces a fat-loss program', () => {
    const program = generateProgram({ ...baseProfile, goals: ['fat-loss'] });
    expect(program.goal).toBe('fat-loss');
  });

  it('marks program as not AI-generated', () => {
    const program = generateProgram(baseProfile);
    expect(program.isAiGenerated).toBe(false);
  });
});

// ─── deriveConditioningProfile ────────────────────────────────────────────────

describe('deriveConditioningProfile', () => {
  it('chooses liss for beginners', () => {
    const cp = deriveConditioningProfile({ ...baseProfile, trainingAgeYears: 0 });
    expect(cp.modality).toBe('liss');
    expect(cp.intensityLevel).toBe('low');
  });

  it('chooses hiit for fat-loss goal', () => {
    const cp = deriveConditioningProfile({ ...baseProfile, goals: ['fat-loss'], trainingAgeYears: 2 });
    expect(cp.modality).toBe('hiit');
    expect(cp.intensityLevel).toBe('high');
  });

  it('chooses circuit for general fitness', () => {
    const cp = deriveConditioningProfile({ ...baseProfile, goals: ['general-fitness'], trainingAgeYears: 2 });
    expect(cp.modality).toBe('circuit');
    expect(cp.intensityLevel).toBe('moderate');
  });
});

// ─── buildConditioningDay ─────────────────────────────────────────────────────

describe('buildConditioningDay', () => {
  it('returns a cardio day with exercises', () => {
    const day = buildConditioningDay(baseProfile, 4);
    expect(day.type).toBe('cardio');
    expect(day.exercises.length).toBeGreaterThan(0);
  });

  it('labels the day correctly', () => {
    const day = buildConditioningDay(baseProfile, 3);
    expect(day.label).toContain('Day 3');
    expect(day.label).toContain('Conditioning');
  });

  it('all exercises have W1 and W4 in their notes', () => {
    const day = buildConditioningDay(baseProfile, 1);
    for (const ex of day.exercises) {
      expect(ex.notes).toMatch(/W1/);
      expect(ex.notes).toMatch(/W4/);
    }
  });
});
