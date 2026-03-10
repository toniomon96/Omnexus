export const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /reveal\s+(the\s+)?(system|developer)\s+prompt/i,
  /(show|print|leak)\s+(api\s*key|secret|token)/i,
  /you\s+are\s+now\s+(chatgpt|system|developer)/i,
  /bypass\s+(safety|guardrails|policy)/i,
  /jailbreak/i,
];

export function sanitizeFreeText(input: unknown, maxLength: number): string {
  if (typeof input !== 'string') return '';
  const withoutControlChars = Array.from(input)
    .map((char) => {
      const code = char.charCodeAt(0);
      return code < 32 || code === 127 ? ' ' : char;
    })
    .join('');
  const normalized = withoutControlChars.replace(/\s+/g, ' ').trim();
  return normalized.slice(0, maxLength);
}

export function hasPromptInjectionSignals(input: string): boolean {
  return PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

export function normalizeGoal(goal: unknown): 'hypertrophy' | 'fat-loss' | 'general-fitness' {
  if (goal === 'hypertrophy' || goal === 'fat-loss' || goal === 'general-fitness') return goal;
  return 'general-fitness';
}

export function normalizeExperience(level: unknown): 'beginner' | 'intermediate' | 'advanced' {
  if (level === 'beginner' || level === 'intermediate' || level === 'advanced') return level;
  return 'beginner';
}
