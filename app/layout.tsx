import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://control-os-demo-040926.rebagliati-marketing.chatgpt.site'),
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'CONTROL OS',
    description: 'Tu negocio en control · Demo funcional',
    images: [{ url: '/og.png', width: 1536, height: 1024 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CONTROL OS',
    description: 'Tu negocio en control · Demo funcional',
    images: ['/og.png'],
  },
  title: 'CONTROL OS · Tu negocio en control',
  description:
    'Demostración de ejecución, evidencias e indicadores de CONTROL OS.',
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
