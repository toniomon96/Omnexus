import { ApiError } from '../services/claudeService';

export type AiSurface = 'ask' | 'insights' | 'program_generation';

export interface NormalizedAiError {
  message: string;
  kind: 'auth' | 'upgrade' | 'network' | 'rate_limit' | 'server' | 'unknown';
}

interface NormalizeAiErrorOptions {
  surface: AiSurface;
}

function isLikelyNetworkFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const message = err.message.toLowerCase();
  return message.includes('failed to fetch') || message.includes('networkerror') || message.includes('load failed');
}

function defaultMessageForSurface(surface: AiSurface): string {
  if (surface === 'insights') {
    return 'We could not generate insights right now. Please try again.';
  }
  if (surface === 'program_generation') {
    return 'We could not generate a new AI program right now. Please try again.';
  }
  return 'We could not complete your AI request right now. Please try again.';
}

export function normalizeAiError(err: unknown, options: NormalizeAiErrorOptions): NormalizedAiError {
  const { surface } = options;

  if (err instanceof ApiError) {
    if (surface === 'ask' && err.status === 403) {
      return {
        kind: 'upgrade',
        message: 'Daily limit reached. Upgrade to Premium for unlimited Ask access.',
      };
    }

    if (err.status === 401 || err.status === 403) {
      if (surface === 'insights') {
        return {
          kind: 'auth',
          message: 'Insights require an account because they analyze your workout history.',
        };
      }
      return {
        kind: 'auth',
        message: 'This AI feature requires a signed-in account.',
      };
    }

    if (err.status === 429) {
      return {
        kind: 'rate_limit',
        message: 'AI requests are busy right now. Please wait a moment and try again.',
      };
    }

    if (err.status >= 500) {
      return {
        kind: 'server',
        message: 'The AI service is temporarily unavailable. Please try again shortly.',
      };
    }
  }

  if (isLikelyNetworkFailure(err)) {
    return {
      kind: 'network',
      message: 'We could not reach the AI service right now. Check your connection and try again.',
    };
  }

  if (err instanceof Error) {
    return {
      kind: 'unknown',
      message: err.message || defaultMessageForSurface(surface),
    };
  }

  return {
    kind: 'unknown',
    message: defaultMessageForSurface(surface),
  };
}
