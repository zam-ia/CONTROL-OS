import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      { source: '/app/inicio', destination: '/?page=inicio', permanent: false },
      { source: '/app/ruta', destination: '/?page=ruta', permanent: false },
      { source: '/app/ruta/:weekId', destination: '/?page=semana&week=:weekId', permanent: false },
      { source: '/app/empresa', destination: '/business', permanent: false },
      { source: '/app/empresa/:path*', destination: '/business?view=:path*', permanent: false },
      { source: '/app/biblioteca', destination: '/?page=biblioteca', permanent: false },
      { source: '/admin/portafolio', destination: '/?mode=admin&page=portafolio', permanent: false },
      { source: '/admin/programa', destination: '/?mode=admin&page=metodologia', permanent: false },
      { source: '/admin/rentabilidad', destination: '/?mode=admin&page=finanzas', permanent: false },
      { source: '/admin/configuracion', destination: '/?mode=admin&page=configuracion', permanent: false },
    ];
  },
};

export default nextConfig;
