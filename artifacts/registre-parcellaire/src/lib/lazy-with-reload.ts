import { lazy, type ComponentType } from 'react';

/**
 * Drop-in replacement for React.lazy that is resilient to stale chunks after a
 * deployment.
 *
 * When the app is redeployed, Vite emits new hashed chunk filenames and the old
 * ones stop existing. A browser tab still running the previous build will try to
 * lazy-import an old chunk (e.g. assets/modele-OLDHASH.js) and get a 404, which
 * surfaces as "error loading dynamically imported module" / a MIME error and a
 * blank page.
 *
 * Here we catch that failed dynamic import and reload the page ONCE so the
 * browser fetches the fresh index.html (which points at the current chunks).
 * A sessionStorage guard prevents an infinite reload loop if the failure is not
 * actually caused by a stale chunk (e.g. the user is offline).
 */
export function lazyWithReload<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      if (isChunkLoadError(error) && shouldReloadOnce()) {
        // Force a full reload to pick up the new build. Don't resolve: the page
        // is about to navigate away.
        window.location.reload();
        // Keep the promise pending so React shows the Suspense fallback until
        // the reload happens.
        return await new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}

const RELOAD_FLAG = 'parcella:chunk-reload';

/**
 * Returns true at most once per (recent) failure, so a genuinely broken import
 * cannot trigger an endless reload loop. The flag is cleared on a successful
 * load elsewhere via markChunkLoadSuccess().
 */
function shouldReloadOnce(): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) return false;
    sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
    return true;
  } catch {
    // sessionStorage unavailable (private mode quota, etc.): reload anyway once
    // is better than a blank page, but we cannot guard a loop — so don't reload.
    return false;
  }
}

/** Clear the reload guard once the app has successfully mounted. */
export function markChunkLoadSuccess(): void {
  try {
    sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    /* ignore */
  }
}

function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  return (
    /dynamically imported module/i.test(message) ||
    /failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /importing a module script failed/i.test(message) ||
    /Loading chunk .* failed/i.test(message) ||
    /MIME type/i.test(message)
  );
}
