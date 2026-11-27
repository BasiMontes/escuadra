'use client';

import type { ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import { DataProvider } from '@/spa/data/DataProvider';
import { NavigationProvider } from '@/spa/router';

const never = () => () => {};

export function Providers({ children }: { children: ReactNode }) {
  // Client only: the screens depend on the clock and on browser APIs, so the server renders none of them.
  const inBrowser = useSyncExternalStore(never, () => true, () => false);
  if (!inBrowser) {
    return null;
  }

  return (
    <DataProvider>
      <NavigationProvider>{children}</NavigationProvider>
    </DataProvider>
  );
}
