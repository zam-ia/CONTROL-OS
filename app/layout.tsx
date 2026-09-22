import type { Metadata } from 'next';
import './globals.css';
import './responsive-critical.css';

const metadataOrigin = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'https://control-os-eosin.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(metadataOrigin),
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'CENTRA',
    description: 'Todo tu negocio en un solo lugar',
    images: [{ url: '/og.png', width: 1536, height: 1024 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CENTRA',
    description: 'Todo tu negocio en un solo lugar',
    images: ['/og.png'],
  },
  title: 'CENTRA · Todo tu negocio en un solo lugar',
  description: 'Finanzas, clientes, equipo y procesos conectados para decidir mejor.',
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
