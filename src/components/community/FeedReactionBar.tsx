import type { FeedReaction, ReactionEmoji } from '../../types';

const EMOJIS: ReactionEmoji[] = ['💪', '🔥', '👏', '🎉', '⭐'];

interface FeedReactionBarProps {
  sessionId: string;
  reactions: FeedReaction[];
  currentUserId: string;
  onReact: (emoji: ReactionEmoji) => void;
  onUnreact: () => void;
}

export function FeedReactionBar({
  reactions,
  currentUserId,
  onReact,
  onUnreact,
}: FeedReactionBarProps) {
  // Count per emoji
  const counts: Record<string, number> = {};
  for (const r of reactions) {
    counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
  }

  const myReaction = reactions.find((r) => r.userId === currentUserId)?.emoji ?? null;

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
      {EMOJIS.map((emoji) => {
        const count = counts[emoji] ?? 0;
        const isActive = myReaction === emoji;
        return (
          <button
            key={emoji}
            onClick={() => isActive ? onUnreact() : onReact(emoji)}
            className={[
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all',
              isActive
                ? 'bg-brand-500/15 border border-brand-500/50 text-brand-300'
                : count > 0
                  ? 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
              count === 0 && !isActive ? 'border border-transparent' : 'border',
            ].join(' ')}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
