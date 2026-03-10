import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import type { UserTrainingProfile } from '../../types';
import { apiBase } from '../../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  userName: string;
  onComplete: (profile: UserTrainingProfile) => void;
}

// Parse [CHIPS: a|b|c] tag from AI reply
function parseChips(text: string): { clean: string; chips: string[] } {
  const match = text.match(/\[CHIPS:\s*([^\]]+)\]/);
  if (!match) return { clean: text, chips: [] };
  const chips = match[1].split('|').map((c) => c.trim()).filter(Boolean);
  const clean = text.replace(match[0], '').trim();
  return { clean, chips };
}

export function OnboardingChat({ userName, onComplete }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chips, setChips] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Kick off with the opening message on mount
  useEffect(() => {
    sendMessage([]);
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(history: Message[], userText?: string) {
    const updatedHistory: Message[] = userText
      ? [...history, { role: 'user' as const, content: userText }]
      : history;

    if (userText) {
      setMessages(updatedHistory);
      setInput('');
      setChips([]);
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiBase}/api/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedHistory, userName }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as {
        reply: string;
        profileComplete: boolean;
        profile?: UserTrainingProfile;
      };

      const { clean, chips: newChips } = parseChips(data.reply);
      const assistantMsg: Message = { role: 'assistant', content: clean };
      const finalHistory = [...updatedHistory, assistantMsg];
      setMessages(finalHistory);
      setChips(newChips);

      if (data.profileComplete && data.profile) {
        // Brief pause so user sees the final message before advancing
        setTimeout(() => onComplete(data.profile!), 1200);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    sendMessage(messages, text);
  }

  function handleChip(chip: string) {
    if (loading) return;
    sendMessage(messages, chip);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="mb-4 lg:mb-5">
        <h1 className="text-3xl font-bold text-white">Let's build your plan</h1>
        <p className="mt-2 text-slate-400">
          Answer a few quick questions in plain language. If you are unsure, you can say "not sure" and we will guide you.
        </p>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2 min-h-[320px] max-h-[440px] lg:max-h-[560px]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={['flex', msg.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}
          >
            <div
              className={[
                'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm',
              ].join(' ')}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick-reply chips */}
      {chips.length > 0 && !loading && (
        <div className="flex flex-wrap gap-2 mt-3">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChip(chip)}
              className="px-3 py-1.5 rounded-full border border-brand-500/50 bg-brand-500/10 text-brand-300 text-sm hover:bg-brand-500/20 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Input row */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer (or write: not sure)…"
          disabled={loading}
          className="flex-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
