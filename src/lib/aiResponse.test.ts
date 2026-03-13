import { describe, expect, it } from 'vitest';
import { cleanAiResponseText } from './aiResponse';

describe('cleanAiResponseText', () => {
  it('strips markdown fences and assistant labels', () => {
    const raw = '```markdown\nAssistant: **Hydration**\n\nDrink water.\n```';
    expect(cleanAiResponseText(raw)).toBe('**Hydration**\n\nDrink water.');
  });

  it('removes control chars and normalizes blank lines', () => {
    const raw = 'Line 1\u0000\n\n\n\nLine 2';
    expect(cleanAiResponseText(raw)).toBe('Line 1\n\nLine 2');
  });
});
