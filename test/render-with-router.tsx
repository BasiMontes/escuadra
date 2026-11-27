import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export function renderWithRouter(ui: ReactNode) {
  const visited: string[] = [];
  const router = {
    bfcacheId: 'test',
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => {},
    push: (href: string) => void visited.push(href),
    replace: (href: string) => void visited.push(href),
  };
  const view = render(<AppRouterContext value={router}>{ui}</AppRouterContext>);

  return Object.assign(view, { visited });
}
