import { getScholarships } from '@/lib/api';
import BecasClient from './BecasClient';

export const dynamic = 'force-dynamic';

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
  // Fetch all pages to show all scholarships (client-side filtering needs full dataset)
  let allBecas: any[] = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const response = await getScholarships({ limit: limit.toString(), page: page.toString() }).catch(() => ({ data: [], meta: { totalPages: 0 } }));
    if (!response.data || response.data.length === 0) break;
    allBecas = [...allBecas, ...response.data];
    if (page >= (response.meta?.totalPages ?? 1)) break;
    page++;
  }

  return <BecasClient becas={allBecas} />;
}
