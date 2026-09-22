import type { Metadata } from 'next';
import './business.css';

export const metadata: Metadata = {
  title: 'Mi Empresa | CENTRA',
  description: 'Gestión financiera y operativa integrada en CENTRA.',
};

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
