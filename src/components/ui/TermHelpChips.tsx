import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { trackFeatureEntry } from '../../lib/analytics';
import { buildTermHelpAskPrefill } from '../../lib/contextualHelp';

export interface TermDefinition {
  key: string;
  label: string;
  description: string;
}

interface TermHelpChipsProps {
  title?: string;
  terms: TermDefinition[];
  askSource?: string;
}

export function TermHelpChips({
  title = 'Need a quick explanation?',
  terms,
  askSource = 'term_help_chip',
}: TermHelpChipsProps) {
  const [activeKey, setActiveKey] = useState<string | null>(terms[0]?.key ?? null);
  const navigate = useNavigate();
  const active = terms.find((term) => term.key === activeKey) ?? terms[0];

  if (terms.length === 0 || !active) return null;

  const askPrefill = buildTermHelpAskPrefill({
    termLabel: active.label,
    termDescription: active.description,
    contextTitle: title,
  });

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 px-3 py-3">
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {terms.map((term) => {
          const isActive = term.key === active.key;
          return (
            <button
              key={term.key}
              type="button"
              onClick={() => setActiveKey(term.key)}
              aria-pressed={isActive}
              className={[
                'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                isActive
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700',
              ].join(' ')}
            >
              {term.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{active.description}</p>
      <button
        type="button"
        onClick={() => {
          trackFeatureEntry({
            source: askSource,
            destination: '/ask',
            label: `term:${active.key}`,
          });
          navigate('/ask', { state: { prefill: askPrefill } });
        }}
        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-brand-300/60 bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-600 transition-colors hover:border-brand-400 hover:text-brand-500 dark:bg-slate-900 dark:border-brand-700/60 dark:text-brand-300"
      >
        <MessageCircle size={12} />
        Ask Omnexus about {active.label}
      </button>
    </div>
  );
}
