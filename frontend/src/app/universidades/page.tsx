import { getUniversities } from '@/lib/api';
import UniversidadesClient from './UniversidadesClient';

export const metadata = {
  title: 'Directorio de Universidades Colombia | Becas Colombia',
  description: 'Directorio completo de universidades colombianas: públicas, privadas, acreditadas. Programas académicos, ciudades y procesos de admisión.',
  openGraph: {
    title: 'Universidades de Colombia — Directorio Completo',
    description: '207 universidades colombianas con programas, acreditación y procesos de admisión.',
    url: 'https://becascolombia.com/universidades',
    siteName: 'Becas Colombia',
    locale: 'es_CO',
    type: 'website',
  },
};

// Evita prerenderizar en el build (el backend no existe en ese momento); el fetch sigue cacheado 5 min.
export const dynamic = 'force-dynamic';

export default async function UniversidadesPage() {
  const { data: universities } = await getUniversities().catch(() => ({ data: [] }));

  return <UniversidadesClient universities={universities ?? []} />;
}
