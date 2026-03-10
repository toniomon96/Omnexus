import { Dumbbell, Clock } from 'lucide-react';
import type { FeedSession, FeedReaction, ReactionEmoji } from '../../types';
import { FeedReactionBar } from './FeedReactionBar';
import { useWeightUnit } from '../../hooks/useWeightUnit';
import { formatMass } from '../../utils/weightUnits';

interface ActivityItemProps {
  item: FeedSession;
  reactions?: FeedReaction[];
  currentUserId?: string;
  onReact?: (sessionId: string, emoji: ReactionEmoji) => void;
  onUnreact?: (sessionId: string) => void;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ActivityItem({ item, reactions, currentUserId, onReact, onUnreact }: ActivityItemProps) {
  const weightUnit = useWeightUnit();
  return (
    <div className="flex gap-3 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0 mt-0.5">
        <Dumbbell size={16} className="text-brand-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {item.userName}
          </p>
          <span className="text-xs text-slate-400 shrink-0">
            {timeAgo(item.completedAt ?? item.startedAt)}
          </span>
        </div>

        <p className="text-xs text-slate-400 mt-0.5">Completed a workout</p>

        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Dumbbell size={11} />
            {formatMass(item.totalVolumeKg, weightUnit)} total
          </span>
          {item.durationSeconds && (
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Clock size={11} />
              {formatDuration(item.durationSeconds)}
            </span>
          )}
        </div>

        {/* Reactions */}
        {reactions && currentUserId && onReact && onUnreact && (
          <FeedReactionBar
            sessionId={item.sessionId}
            reactions={reactions}
            currentUserId={currentUserId}
            onReact={(emoji) => onReact(item.sessionId, emoji)}
            onUnreact={() => onUnreact(item.sessionId)}
          />
        )}
      </div>
    </div>
  );
}
