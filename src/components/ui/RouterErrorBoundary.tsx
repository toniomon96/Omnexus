import { useEffect, useMemo } from 'react';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { Button } from './Button';

const CHUNK_RELOAD_KEY = 'omnexus:chunk-reload';

function isChunkLoadFailure(error: unknown): boolean {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : '';

  return (
    message.includes('Failed to fetch dynamically imported module')
    || message.includes('Importing a module script failed')
    || message.includes('ChunkLoadError')
  );
}

export function RouterErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  const title = useMemo(() => {
    if (isRouteErrorResponse(error)) {
      return `${error.status} ${error.statusText}`;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Something went wrong';
  }, [error]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isChunkLoadFailure(error)) return;

    const lastReload = window.sessionStorage.getItem(CHUNK_RELOAD_KEY);
    if (lastReload === window.location.pathname) return;

    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, window.location.pathname);
    window.location.reload();
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6 text-center dark:bg-slate-950">
      <div className="max-w-sm space-y-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
          {isChunkLoadFailure(error) ? 'App update detected' : 'Unexpected application error'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isChunkLoadFailure(error)
            ? 'A newer version of the app was deployed while this tab was open. Refresh to load the latest files.'
            : title}
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Button fullWidth onClick={() => window.location.reload()}>
            Refresh app
          </Button>
          <Button fullWidth variant="ghost" onClick={() => navigate('/', { replace: true })}>
            Go to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}