import { useSyncExternalStore } from 'react';

/** True in the browser after hydration; false on the server (avoids recharts SSR sizing issues). */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
