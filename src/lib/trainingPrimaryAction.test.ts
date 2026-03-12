import { describe, expect, it } from 'vitest';
import {
  getTrainingPrimaryActionLabel,
  getTrainingPrimaryActionTarget,
  QUICK_SESSION_LABEL,
  resolveTrainingPrimaryActionState,
} from './trainingPrimaryAction';

describe('trainingPrimaryAction', () => {
  it('prefers active session over every other state', () => {
    expect(resolveTrainingPrimaryActionState({
      hasActiveSession: true,
      hasProgramWorkout: true,
      canChooseProgram: true,
    })).toBe('active_session');
  });

  it('uses program workout when no active session exists', () => {
    expect(resolveTrainingPrimaryActionState({
      hasActiveSession: false,
      hasProgramWorkout: true,
      canChooseProgram: true,
    })).toBe('program_ready');
  });

  it('falls back to no-program when browsing is the remaining option', () => {
    expect(resolveTrainingPrimaryActionState({
      hasActiveSession: false,
      hasProgramWorkout: false,
      canChooseProgram: true,
    })).toBe('no_program');
  });

  it('returns null when no primary action is currently available', () => {
    expect(resolveTrainingPrimaryActionState({
      hasActiveSession: false,
      hasProgramWorkout: false,
      canChooseProgram: false,
    })).toBeNull();
  });

  it('maps states to stable analytics targets', () => {
    expect(getTrainingPrimaryActionTarget('active_session')).toBe('resume_workout');
    expect(getTrainingPrimaryActionTarget('program_ready')).toBe('start_workout');
    expect(getTrainingPrimaryActionTarget('no_program')).toBe('browse_programs');
  });

  it('uses consistent CTA labels across surfaces', () => {
    expect(getTrainingPrimaryActionLabel('resume_workout')).toBe('Resume Workout');
    expect(getTrainingPrimaryActionLabel('start_workout')).toBe('Start Workout');
    expect(getTrainingPrimaryActionLabel('browse_programs')).toBe('Browse Programs');
    expect(QUICK_SESSION_LABEL).toBe('Quick Session');
  });
});