import { useState, useEffect } from 'react';
import {
  getGenerationState,
  subscribeToGeneration,
  type GenerationState,
  type GenerationStatus,
} from '../lib/programGeneration';

interface UseProgramGenerationResult {
  status: GenerationStatus | null;
  programId: string | null;
  generationState: GenerationState | null;
}

/**
 * Subscribe to program generation status within the current session.
 * Also reads the persisted localStorage state so it works across page refreshes.
 */
export function useProgramGeneration(): UseProgramGenerationResult {
  const [genState, setGenState] = useState<GenerationState | null>(getGenerationState);

  useEffect(() => {
    // Sync from localStorage in case another tab updated it
    setGenState(getGenerationState());
    const unsub = subscribeToGeneration(setGenState);

    function onStorage(event: StorageEvent) {
      if (event.key === 'omnexus_program_generation') {
        setGenState(getGenerationState());
      }
    }

    window.addEventListener('storage', onStorage);
    return () => {
      unsub();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return {
    status: genState?.status ?? null,
    // programId available once ready so the dashboard can activate and link to it
    programId: genState?.status === 'ready' ? genState.programId : null,
    generationState: genState,
  };
}
