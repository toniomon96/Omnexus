const STRICT_DECIMAL_RE = /^\d+(\.\d+)?$/;

export function isStrictDecimal(value: string): boolean {
  return STRICT_DECIMAL_RE.test(value);
}

export function sanitizeDecimalInput(raw: string): string {
  if (!raw) return '';

  const filtered = raw.replace(/[^\d.]/g, '');
  if (!filtered) return '';

  const [whole, ...rest] = filtered.split('.');
  if (!whole) return '';

  if (rest.length === 0) return whole;
  return `${whole}.${rest.join('')}`;
}

export function parseStrictDecimal(value: string): number | null {
  if (!isStrictDecimal(value)) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}