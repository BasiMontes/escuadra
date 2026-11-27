import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { connection } from 'next/server';
import '@fontsource/archivo-black/400.css';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/500.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';
import '../spa/styles/global.css';

export const metadata: Metadata = {
  title: 'Escuadra',
  description: 'Escuadra: un reto de fútbol al día. Responde en 20 segundos, mantén tu racha y escala en el ranking.',
  icons: { icon: '/logo.svg' },
};

export const viewport: Viewport = { themeColor: '#100E0E' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Renders every page per request, which the CSP nonce needs: a prerendered page would have its scripts blocked.
  await connection();

  return (
    <html lang="es">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
