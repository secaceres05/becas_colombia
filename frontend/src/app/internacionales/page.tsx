import { getScholarships } from '@/lib/api';
import InternacionalesClient from './InternacionalesClient';

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
  const { data: becas } = await getScholarships({ type: 'INTERNACIONAL', limit: '50' }).catch(() => ({ data: [] }));

  return <InternacionalesClient becas={becas ?? []} />;
}
