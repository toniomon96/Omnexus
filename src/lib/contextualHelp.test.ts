import { describe, expect, it } from 'vitest';
import { buildTermHelpAskPrefill } from './contextualHelp';

describe('buildTermHelpAskPrefill', () => {
  it('builds a contextual prompt from title + term details', () => {
    const prompt = buildTermHelpAskPrefill({
      contextTitle: 'Train terms explained',
      termLabel: 'RPE',
      termDescription: 'Effort score from 1-10.',
    });

    expect(prompt).toContain('In Train, explain RPE in simple terms.');
    expect(prompt).toContain('Use this app context: Effort score from 1-10.');
    expect(prompt).toContain('one practical way to apply it');
  });

  it('falls back when title is missing and handles empty description', () => {
    const prompt = buildTermHelpAskPrefill({
      termLabel: 'Volume',
      termDescription: '',
    });

    expect(prompt).toContain('In this part of the app, explain Volume in simple terms.');
    expect(prompt).not.toContain('Use this app context:');
  });
});
