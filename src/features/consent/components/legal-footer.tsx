import Link from 'next/link';
import { buttonVariants } from '@/platform/ui/button';
import { ConsentSettingsButton } from './consent-settings-button';

export function LegalFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-center gap-2 p-4">
      <Link className={buttonVariants({ variant: 'link', size: 'sm' })} href="/privacy">Privacy</Link>
      <Link className={buttonVariants({ variant: 'link', size: 'sm' })} href="/cookies">Cookies</Link>
      <ConsentSettingsButton />
    </footer>
  );
}
