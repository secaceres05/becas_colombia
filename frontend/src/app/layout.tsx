import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://becascolombia.com'),
  title: {
    default: 'Becas Colombia',
    template: '%s | Becas Colombia',
  },
  description: 'El directorio más completo de becas, universidades y admisiones para jóvenes colombianos.',
  keywords: ['becas colombia', 'becas universitarias colombia', 'universidades colombia', 'admisiones colombia', 'ICETEX', 'becas internacionales colombia'],
  authors: [{ name: 'Becas Colombia' }],
  creator: 'Becas Colombia',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    siteName: 'Becas Colombia',
    locale: 'es_CO',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
} 