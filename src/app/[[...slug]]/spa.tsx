'use client';

import dynamic from 'next/dynamic';

// Client only: React Router needs the browser.
const App = dynamic(async () => import('../../spa/App'), { ssr: false });

export function Spa() {
  return <App />;
}
