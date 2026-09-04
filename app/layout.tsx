import type { Metadata } from 'next';
import './globals.css';

const metadataOrigin = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'https://control-os-demo-040926.rebagliati-marketing.chatgpt.site';

export const metadata: Metadata = {
  metadataBase: new URL(metadataOrigin),
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'CONTROL OS',
    description: 'Escalamiento con control · Una plataforma de Crisdal Agency',
    images: [{ url: '/og.png', width: 1536, height: 1024 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CONTROL OS',
    description: 'Escalamiento con control · Una plataforma de Crisdal Agency',
    images: ['/og.png'],
  },
  title: 'CONTROL OS · Tu negocio en control',
  description: 'Ejecución, evidencias e indicadores para escalar con control.',
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
