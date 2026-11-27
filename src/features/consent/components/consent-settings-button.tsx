'use client';

import { Button } from '@/platform/ui/button';
import { useConsent } from './consent-context';

export function ConsentSettingsButton() {
  const { required, ask } = useConsent();
  if (!required) { return null; }

  return <Button type="button" variant="link" size="sm" onClick={ask}>Cookie settings</Button>;
}
