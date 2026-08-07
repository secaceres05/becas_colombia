export type ContinentKey = 'América' | 'Europa' | 'Asia' | 'África' | 'Oceanía';

export const CONTINENTS: { key: ContinentKey; label: string; icon: string }[] = [
  { key: 'América', label: 'América', icon: '🌎' },
  { key: 'Europa', label: 'Europa', icon: '🇪🇺' },
  { key: 'Asia', label: 'Asia', icon: '🌏' },
  { key: 'África', label: 'África', icon: '🌍' },
  { key: 'Oceanía', label: 'Oceanía', icon: '🌊' },
];

// Proveedores conocidos de becas internacionales → continente. Fallback cuando la
// API no trae un campo de continente ni departamentos/país asociados a la beca.
const PROVIDER_TO_CONTINENT: Record<string, ContinentKey> = {
  'fulbright': 'América', 'vanier': 'América', 'becas santander': 'Europa',
  'organización de estados americanos': 'América', 'oea': 'América',
  'chevening': 'Europa', 'daad': 'Europa', 'erasmus': 'Europa', 'erasmus+': 'Europa',
  'erasmus mundus': 'Europa', 'eiffel': 'Europa', 'swiss government excellence scholarships': 'Europa',
  'becas mae aecid': 'Europa', 'aecid': 'Europa', 'instituto de crédito oficial': 'Europa',
  'mext': 'Asia', 'monbukagakusho': 'Asia', 'china scholarship council': 'Asia', 'csc': 'Asia',
  'global korea scholarship': 'Asia', 'kgsp': 'Asia', 'türkiye scholarships': 'Asia',
  'turkiye scholarships': 'Asia', 'king abdulaziz university': 'Asia',
  'australia awards': 'Oceanía', 'endeavour': 'Oceanía', 'new zealand scholarships': 'Oceanía',
  'nrf south africa': 'África', 'mandela rhodes foundation': 'África', 'mastercard foundation': 'África',
  'mineducacion': 'América',
};

const COUNTRY_TO_CONTINENT: Record<string, ContinentKey> = {
  'estados unidos': 'América', 'canadá': 'América', 'canada': 'América',
  'méxico': 'América', 'mexico': 'América', 'brasil': 'América',
  'argentina': 'América', 'chile': 'América', 'perú': 'América', 'peru': 'América',
  'colombia': 'América', 'ecuador': 'América', 'uruguay': 'América', 'paraguay': 'América',
  'bolivia': 'América', 'costa rica': 'América', 'panamá': 'América', 'panama': 'América',

  'españa': 'Europa', 'espana': 'Europa', 'francia': 'Europa', 'alemania': 'Europa',
  'italia': 'Europa', 'reino unido': 'Europa', 'inglaterra': 'Europa', 'portugal': 'Europa',
  'países bajos': 'Europa', 'holanda': 'Europa', 'suiza': 'Europa', 'suecia': 'Europa',
  'noruega': 'Europa', 'finlandia': 'Europa', 'dinamarca': 'Europa', 'polonia': 'Europa',
  'bélgica': 'Europa', 'belgica': 'Europa', 'austria': 'Europa', 'irlanda': 'Europa', 'grecia': 'Europa',

  'china': 'Asia', 'japón': 'Asia', 'japon': 'Asia', 'corea del sur': 'Asia',
  'india': 'Asia', 'singapur': 'Asia', 'israel': 'Asia', 'emiratos árabes unidos': 'Asia',
  'emiratos arabes unidos': 'Asia', 'turquía': 'Asia', 'turquia': 'Asia', 'tailandia': 'Asia',
  'malasia': 'Asia', 'taiwán': 'Asia', 'taiwan': 'Asia',

  'sudáfrica': 'África', 'sudafrica': 'África', 'egipto': 'África', 'marruecos': 'África',
  'nigeria': 'África', 'kenia': 'África', 'ghana': 'África', 'túnez': 'África', 'tunez': 'África',

  'australia': 'Oceanía', 'nueva zelanda': 'Oceanía', 'fiyi': 'Oceanía',
};

export function scholarshipCountry(beca: any): string | null {
  const depts: any[] = beca.departments ?? [];
  const names = depts
    .map((d: any) => d.name ?? d.department?.name)
    .filter((n: string | undefined): n is string => n != null && n.toLowerCase() !== 'todos');
  if (names.length > 0) return names.join(', ');
  return beca.provider?.country ?? beca.provider?.name ?? null;
}

export function scholarshipContinent(beca: any): ContinentKey | null {
  // 1. Campo de continente directo, si la API llega a incluirlo.
  if (beca.continent && CONTINENTS.some(c => c.key === beca.continent)) return beca.continent;

  // 2. Proveedor conocido → continente (lista hardcodeada).
  const providerName: string | undefined = beca.provider?.name;
  if (providerName) {
    const match = PROVIDER_TO_CONTINENT[providerName.toLowerCase().trim()];
    if (match) return match;
  }

  // 3. País (de departments o provider.country) → continente.
  const country = scholarshipCountry(beca);
  if (!country) return null;
  return COUNTRY_TO_CONTINENT[country.toLowerCase().trim()] ?? null;
}
