import { Alert, AlertDescription } from '@/platform/ui/alert';

export function ErrorMessage({ children }: { children: string | undefined }) {
  if (!children) { return null; }
  return (
    <Alert variant="destructive">
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

export function Notice({ children }: { children: string }) {
  return (
    <Alert role="status">
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
