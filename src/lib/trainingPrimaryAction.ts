export type TrainingPrimaryActionState = 'active_session' | 'program_ready' | 'no_program';

export type TrainingPrimaryActionTarget = 'resume_workout' | 'start_workout' | 'browse_programs';

export function resolveTrainingPrimaryActionState(input: {
  hasActiveSession: boolean;
  hasProgramWorkout: boolean;
  canChooseProgram: boolean;
}): TrainingPrimaryActionState | null {
  if (input.hasActiveSession) return 'active_session';
  if (input.hasProgramWorkout) return 'program_ready';
  if (input.canChooseProgram) return 'no_program';
  return null;
}

export function getTrainingPrimaryActionTarget(
  state: TrainingPrimaryActionState,
): TrainingPrimaryActionTarget {
  switch (state) {
    case 'active_session':
      return 'resume_workout';
    case 'program_ready':
      return 'start_workout';
    case 'no_program':
      return 'browse_programs';
  }
}