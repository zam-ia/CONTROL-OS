import type { Metadata } from 'next';
import './business.css';

export const metadata: Metadata = {
  title: 'Mi Empresa | CONTROL Business OS',
  description: 'Gestión financiera y operativa integrada con CONTROL OS.',
};

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
