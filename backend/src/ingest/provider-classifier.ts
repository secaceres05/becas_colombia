/**
 * Heurística determinística para clasificar el tipo de entidad proveedora
 * a partir de su nombre.
 *
 * Lógica espejo con el scraper (Python): ver scraper/becas_scraper/provider_classifier.py
 * Mantener ambas versiones sincronizadas.
 *
 * Orden de precedencia (importante para no mal clasificar):
 * 1. IES / universidades — "Fundación Universitaria X", "Corporación Universitaria X",
 *    "Institución Universitaria", "Colegio Mayor", "Politécnico", "Colegio de
 *    Estudios Superiores". En Colombia son categorías de IES.
 * 2. Gobierno — ICETEX, ministerio, alcaldía, gobernación, Sapiencia.
 * 3. Organización internacional — Alianza del Pacífico.
 * 4. Fundación / Corporación (sin "Universitaria") — nonprofits que otorgan becas.
 * 5. Default: PRIVADA.
 */

const IES_KEYWORDS = [
  'universidad',
  'universitaria',
  'universitario',
  'colegio mayor',
  'colegio de estudios superiores',
  'politécnico',
  'politecnico',
];

const GOBIERNO_KEYWORDS = [
  'icetex',
  'gobierno',
  'ministerio',
  'alcaldía',
  'alcaldia',
  'gobernación',
  'gobernacion',
  'sapiencia',
];

const ORG_INTL_KEYWORDS = ['alianza del pacífico', 'alianza del pacifico'];

const FUNDACION_KEYWORDS = [
  'fundación',
  'fundacion',
  'corporación',
  'corporacion',
];

export function classifyProviderType(name?: string | null): string {
  if (!name) return 'PRIVADA';
  const n = name.toLowerCase();
  if (IES_KEYWORDS.some((k) => n.includes(k))) return 'UNIVERSIDAD';
  if (GOBIERNO_KEYWORDS.some((k) => n.includes(k))) return 'GOBIERNO';
  if (ORG_INTL_KEYWORDS.some((k) => n.includes(k))) return 'ORG_INTL';
  if (FUNDACION_KEYWORDS.some((k) => n.includes(k))) return 'FUNDACION';
  return 'PRIVADA';
}
