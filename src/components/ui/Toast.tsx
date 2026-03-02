import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useToast, type ToastItem } from '../../contexts/ToastContext';

const VARIANT_STYLES: Record<ToastItem['variant'], string> = {
  success: 'bg-green-900/95 border-green-700/60 text-green-100',
  error:   'bg-red-900/95 border-red-700/60 text-red-100',
  info:    'bg-white/95 dark:bg-slate-800/95 border-slate-200 dark:border-slate-600/60 text-slate-900 dark:text-slate-100',
};

const VARIANT_ICONS: Record<ToastItem['variant'], React.FC<{ size: number; className?: string }>> = {
  success: CheckCircle,
  error:   XCircle,
  info:    Info,
};

function ToastNotification({ item }: { item: ToastItem }) {
  const { dismiss } = useToast();
  const Icon = VARIANT_ICONS[item.variant];

  return (
    <div
      className={[
        'flex items-start gap-3 w-full rounded-xl border px-4 py-3 shadow-xl',
        'backdrop-blur-md transition-all duration-300',
        VARIANT_STYLES[item.variant],
      ].join(' ')}
      role="alert"
    >
      <Icon size={16} className="shrink-0 mt-0.5 opacity-90" />
      <p className="flex-1 text-sm font-medium leading-snug">{item.message}</p>
      <button
        onClick={() => dismiss(item.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map((item) => (
        <div key={item.id} className="pointer-events-auto">
          <ToastNotification item={item} />
        </div>
      ))}
    </div>
  );
}
