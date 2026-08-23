import { getScholarships } from '@/lib/api';
import InternacionalesClient from './InternacionalesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Becas Internacionales 2025 | Becas Colombia',
  description: 'Becas internacionales para colombianos: Fulbright, DAAD, Chevening, OEA, Colfuturo y más. Filtra por continente y país destino.',
  openGraph: {
    title: 'Becas Internacionales para Colombianos 2025',
    description: 'Fulbright, DAAD, Chevening, OEA y más becas internacionales para jóvenes colombianos.',
    url: 'https://becascolombia.com/internacionales',
    siteName: 'Becas Colombia',
    locale: 'es_CO',
    type: 'website',
  },
};

export default async function InternacionalesPage() {
  let allBecas: any[] = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const response = await getScholarships({ type: 'INTERNACIONAL', limit: limit.toString(), page: page.toString() }).catch(() => ({ data: [], meta: { totalPages: 0 } }));
    if (!response.data || response.data.length === 0) break;
    allBecas = [...allBecas, ...response.data];
    if (page >= (response.meta?.totalPages ?? 1)) break;
    page++;
  }

  return <InternacionalesClient becas={allBecas} />;
}
