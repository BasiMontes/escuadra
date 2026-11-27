import type { ReactNode } from 'react';
import { Alert, AlertDescription } from '@/platform/ui/alert';

export function LegalPage({ title, children }: { title: string, children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <Alert role="note">
        <AlertDescription>Placeholder text, not legal advice. Replace this page with your own text before publishing.</AlertDescription>
      </Alert>
      {children}
    </main>
  );
}
