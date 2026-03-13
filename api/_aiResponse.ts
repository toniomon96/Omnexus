const ASK_MEDICAL_DISCLAIMER =
  '⚠️ This is educational information only, not medical advice. Please consult a qualified healthcare professional for personal health concerns.';

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function cleanAiText(raw: string): string {
  return String(raw ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/^```(?:markdown|md|text)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .replace(/^\s*(assistant|ai|omnexus\s*ai)\s*:\s*/i, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function cleanAskAnswer(raw: string): string {
  let text = cleanAiText(raw);

  const disclaimerRegex = new RegExp(escapeRegExp(ASK_MEDICAL_DISCLAIMER), 'g');
  const disclaimerMatches = text.match(disclaimerRegex);
  if ((disclaimerMatches?.length ?? 0) > 1) {
    text = text.replace(disclaimerRegex, '').trim();
  }

  if (!text.endsWith(ASK_MEDICAL_DISCLAIMER)) {
    text = text.length > 0
      ? `${text}\n\n${ASK_MEDICAL_DISCLAIMER}`
      : ASK_MEDICAL_DISCLAIMER;
  }

  return text;
}
