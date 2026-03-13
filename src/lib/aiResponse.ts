const TRAILING_CODE_FENCE = /\n?```\s*$/i;
const LEADING_CODE_FENCE = /^```(?:markdown|md|text)?\s*\n?/i;

function stripControlChars(input: string): string {
  let out = '';
  for (const ch of input) {
    const code = ch.charCodeAt(0);
    if ((code >= 0 && code <= 8) || (code >= 11 && code <= 12) || (code >= 14 && code <= 31) || code === 127) {
      continue;
    }
    out += ch;
  }
  return out;
}

export function cleanAiResponseText(raw: string): string {
  const normalized = stripControlChars(String(raw ?? '').replace(/\r\n?/g, '\n'));

  return normalized
    .replace(LEADING_CODE_FENCE, '')
    .replace(TRAILING_CODE_FENCE, '')
    .replace(/^\s*(assistant|ai|omnexus\s*ai)\s*:\s*/i, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
