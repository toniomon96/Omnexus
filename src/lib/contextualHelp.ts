function cleanContextTitle(title?: string): string {
  if (!title) return 'this part of the app';
  const cleaned = title
    .replace(/\bterms\s+explained\b/gi, '')
    .replace(/[?!.]+$/g, '')
    .trim();
  return cleaned.length > 0 ? cleaned : 'this part of the app';
}

export function buildTermHelpAskPrefill(params: {
  termLabel: string;
  termDescription: string;
  contextTitle?: string;
}): string {
  const context = cleanContextTitle(params.contextTitle);
  const term = params.termLabel.trim();
  const description = params.termDescription.trim();

  return [
    `In ${context}, explain ${term} in simple terms.`,
    description ? `Use this app context: ${description}` : '',
    'Then give me one practical way to apply it in my next week of training.',
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
}
