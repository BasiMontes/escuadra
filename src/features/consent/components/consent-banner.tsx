'use client';

import Link from 'next/link';
import { Button } from '@/platform/ui/button';
import { useConsent } from './consent-context';

export function ConsentBanner() {
  const { asking, decision, decide } = useConsent();
  if (!asking) { return null; }

  // Sticky, not fixed: it keeps its own room, so it never hides the end of a page.
  return (
    <div role="region" aria-label="Cookie consent" className="sticky bottom-0 z-50 border-t bg-card p-4 text-card-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          We use the cookies needed to keep you signed in. With your permission we also collect usage analytics and error reports.
          {decision && ` You ${decision} them.`}
          {' '}
          <Link className="underline" href="/cookies">Cookie policy</Link>
        </p>
        {/* Same variant and size on purpose: neither answer may look like the expected one. */}
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => decide('rejected')}>Reject</Button>
          <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => decide('accepted')}>Accept</Button>
        </div>
      </div>
    </div>
  );
}
