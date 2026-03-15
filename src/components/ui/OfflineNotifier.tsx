import { useEffect, useRef } from 'react';
import { useToast } from '../../contexts/ToastContext';

/** How long the "you are offline" toast stays visible (ms). */
const OFFLINE_TOAST_DURATION_MS = 60_000;

/**
 * Listens to the browser's online/offline events and surfaces a toast
 * notification whenever the network connection changes.
 *
 * Renders nothing — purely a side-effect component.
 */
export function OfflineNotifier() {
  const { toast } = useToast();
  // Track whether we have already shown an "offline" toast so we can fire a
  // matching "back online" toast when connectivity is restored.
  const wasOffline = useRef(!navigator.onLine);

  useEffect(() => {
    function handleOffline() {
      wasOffline.current = true;
      toast('You are offline. Some features may be unavailable.', 'error', OFFLINE_TOAST_DURATION_MS);
    }

    function handleOnline() {
      if (wasOffline.current) {
        wasOffline.current = false;
        toast('Back online!', 'success', 3000);
      }
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [toast]);

  return null;
}
