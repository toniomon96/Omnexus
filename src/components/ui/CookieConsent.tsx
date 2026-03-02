import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';

const CONSENT_KEY = 'omnexus_cookie_consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4 pb-safe pointer-events-none">
      <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 pointer-events-auto">
        <div className="flex gap-3">
          <Cookie size={20} className="text-brand-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              We use cookies &amp; local storage
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Omnexus uses cookies and local storage to keep you signed in and save
              your preferences.{' '}
              <Link to="/privacy" className="text-brand-400 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-3 justify-end">
          <button
            onClick={decline}
            className="px-4 py-1.5 text-xs font-medium rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
