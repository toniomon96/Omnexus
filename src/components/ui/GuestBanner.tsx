import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { CloudOff } from 'lucide-react';

export function GuestBanner() {
  const { state } = useApp();
  const navigate = useNavigate();

  if (!state.user?.isGuest) return null;

  return (
    <div data-testid="guest-banner" className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between gap-3 bg-amber-500 px-4 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <CloudOff size={14} className="text-amber-900 shrink-0" />
        <p className="text-xs font-medium text-amber-900 truncate">
          Guest mode — data saved on this device only
        </p>
      </div>
      <button
        onClick={() => navigate('/onboarding')}
        className="shrink-0 rounded-lg bg-amber-900/20 border border-amber-900/30 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-900/30 transition-colors whitespace-nowrap"
      >
        Save progress
      </button>
    </div>
  );
}
