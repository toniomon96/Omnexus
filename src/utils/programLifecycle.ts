import type { Program } from '../types';

export function applyAiProgramLifecycle(
  programs: Program[],
  nextActiveProgramId: string,
  previousActiveProgramId?: string,
): Program[] {
  return programs.map((program) => {
    if (!program.isAiGenerated) return program;

    if (program.id === nextActiveProgramId) {
      return { ...program, aiLifecycleStatus: 'active' };
    }

    if (
      program.id === previousActiveProgramId
      || program.aiLifecycleStatus === 'active'
    ) {
      return { ...program, aiLifecycleStatus: 'archived' };
    }

    return program;
  });
}