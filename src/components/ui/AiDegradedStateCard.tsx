import { AlertCircle } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

interface AiDegradedStateCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  retryDisabled?: boolean;
  className?: string;
  testId?: string;
}

export function AiDegradedStateCard({
  title = 'AI service issue',
  message,
  onRetry,
  retryLabel = 'Retry',
  retryDisabled = false,
  className = '',
  testId,
}: AiDegradedStateCardProps) {
  return (
    <Card
      className={[
        'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20',
        className,
      ].join(' ')}
      data-testid={testId}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
          <AlertCircle size={16} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{title}</p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{message}</p>
          {onRetry && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onRetry}
              disabled={retryDisabled}
              className="mt-3"
              data-testid={testId ? `${testId}-retry` : undefined}
            >
              {retryLabel}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
