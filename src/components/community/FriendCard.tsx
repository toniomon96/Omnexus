import { UserCircle, Check, X, UserMinus } from 'lucide-react';
import type { FriendshipWithProfile } from '../../types';
import { Button } from '../ui/Button';

interface FriendCardProps {
  friendship: FriendshipWithProfile;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export function FriendCard({ friendship, onAccept, onDecline, onRemove }: FriendCardProps) {
  const { id, status, direction, friend } = friendship;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
        <UserCircle size={22} className="text-slate-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {friend.name}
        </p>
        {status === 'pending' && direction === 'sent' && (
          <p className="text-xs text-slate-400">Request sent</p>
        )}
        {status === 'pending' && direction === 'received' && (
          <p className="text-xs text-brand-400">Wants to connect</p>
        )}
        {status === 'accepted' && (
          <p className="text-xs text-green-400">Friend</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {status === 'pending' && direction === 'received' && (
          <>
            <Button size="sm" onClick={() => onAccept?.(id)}>
              <Check size={14} />
              Accept
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDecline?.(id)}>
              <X size={14} />
            </Button>
          </>
        )}
        {status === 'pending' && direction === 'sent' && (
          <Button size="sm" variant="ghost" onClick={() => onRemove?.(id)}>
            <X size={14} />
            Cancel
          </Button>
        )}
        {status === 'accepted' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove?.(id)}
            className="text-red-400 hover:bg-red-900/20"
          >
            <UserMinus size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
