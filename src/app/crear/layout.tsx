'use client';

import type { ReactNode } from 'react';
import { CrearProvider } from '@/spa/screens/crear/CrearContext';

export default function Layout({ children }: { children: ReactNode }) {
  return <CrearProvider>{children}</CrearProvider>;
}
