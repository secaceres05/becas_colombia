import { getScholarships } from '@/lib/api';
import BecasClient from './BecasClient';

export const metadata = {
  title: 'Becas Nacionales 2025 | Becas Colombia',
  description: 'Encuentra becas nacionales en Colombia por región, entidad y cobertura. ICETEX, MinEducación, Generación E y más convocatorias vigentes.',
  openGraph: {
    title: 'Becas Nacionales Colombia 2025',
    description: 'Directorio de becas nacionales: filtra por región, cobertura y entidad aliada.',
    url: 'https://becascolombia.com/becas',
    siteName: 'Becas Colombia',
    locale: 'es_CO',
    type: 'website',
  },
};

export default async function BecasPage() {
  const { data: becas } = await getScholarships({ limit: '50' }).catch(() => ({ data: [] }));

  return <BecasClient becas={becas} />;
}
