export type RegionKey = 'Caribe' | 'Andina' | 'Pacífica' | 'Orinoquía' | 'Amazonía';

export const REGIONS: { key: RegionKey; label: string; color: string }[] = [
  { key: 'Caribe', label: 'Caribe', color: '#00a8e8' },
  { key: 'Andina', label: 'Andina', color: '#27ae60' },
  { key: 'Pacífica', label: 'Pacífica', color: '#e67e22' },
  { key: 'Orinoquía', label: 'Orinoquía', color: '#f39c12' },
  { key: 'Amazonía', label: 'Amazonía', color: '#1b5e20' },
];

// DANE codes grouped by natural region, used to map a beca's departments to a region.
export const DANE_TO_REGION: Record<string, RegionKey> = {
  '08': 'Caribe', '13': 'Caribe', '20': 'Caribe', '23': 'Caribe',
  '44': 'Caribe', '47': 'Caribe', '70': 'Caribe', '88': 'Caribe',
  '05': 'Andina', '11': 'Andina', '15': 'Andina', '17': 'Andina',
  '25': 'Andina', '41': 'Andina', '54': 'Andina', '63': 'Andina',
  '66': 'Andina', '68': 'Andina', '73': 'Andina',
  '19': 'Pacífica', '27': 'Pacífica', '52': 'Pacífica', '76': 'Pacífica',
  '81': 'Orinoquía', '85': 'Orinoquía', '50': 'Orinoquía', '99': 'Orinoquía',
  '91': 'Amazonía', '18': 'Amazonía', '94': 'Amazonía', '95': 'Amazonía',
  '86': 'Amazonía', '97': 'Amazonía',
};

// Inverso de DANE_TO_REGION: códigos DANE agrupados por región, usado en el
// panel de administración para expandir "solo región X" a sus departamentos.
export const REGION_TO_DANE_CODES: Record<RegionKey, string[]> = Object.entries(DANE_TO_REGION)
  .reduce((acc, [code, region]) => {
    (acc[region] ??= []).push(code);
    return acc;
  }, {} as Record<RegionKey, string[]>);

export const CONTINENTS = ['América', 'Europa', 'Asia', 'África', 'Oceanía'] as const;

export function scholarshipRegions(beca: any): RegionKey[] {
  const depts: any[] = beca.departments ?? [];
  const codes = depts
    .map(d => d.daneCode ?? d.department?.daneCode)
    .filter(Boolean);
  const regions = new Set<RegionKey>();
  codes.forEach(code => {
    const region = DANE_TO_REGION[code];
    if (region) regions.add(region);
  });
  return Array.from(regions);
}
