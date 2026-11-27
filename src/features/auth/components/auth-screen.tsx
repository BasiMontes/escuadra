import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/platform/ui/card';

interface AuthScreenProps {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthScreen({ title, description, children, footer }: AuthScreenProps) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center p-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1>{title}</h1>
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">{children}</CardContent>
        {footer ? <CardFooter className="flex flex-col items-start gap-2">{footer}</CardFooter> : null}
      </Card>
    </main>
  );
}
