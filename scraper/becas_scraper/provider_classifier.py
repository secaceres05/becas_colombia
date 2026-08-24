"""
Heurística determinística para clasificar el tipo de entidad proveedora
a partir de su nombre.

Lógica espejo con el backend (TS): see backend/src/ingest/provider-classifier.ts
Mantener ambas versiones sincronizadas.

Orden de precedencia (importante para no mal clasificar):
1. IES / universidades — atrapa "Fundación Universitaria X", "Corporación
   Universitaria X", "Institución Universitaria", "Colegio Mayor",
   "Politécnico", "Colegio de Estudios Superiores". En Colombia estas son
   categorías de institución de educación superior (IES).
2. Gobierno — ICETEX, ministerio, alcaldía, gobernación, Sapiencia.
3. Organización internacional — Alianza del Pacífico.
4. Fundación / Corporación (sin "Universitaria") — fundaciones y corporaciones
   sin fines de lucro que otorgan becas.
5. Default: PRIVADA.
"""
from __future__ import annotations

IES_KEYWORDS = (
    "universidad",
    "universitaria",
    "universitario",
    "colegio mayor",
    "colegio de estudios superiores",
    "politécnico",
    "politecnico",
)

GOBIERNO_KEYWORDS = (
    "icetex",
    "gobierno",
    "ministerio",
    "alcaldía",
    "alcaldia",
    "gobernación",
    "gobernacion",
    "sapiencia",
)

ORG_INTL_KEYWORDS = (
    "alianza del pacífico",
    "alianza del pacifico",
)

FUNDACION_KEYWORDS = (
    "fundación",
    "fundacion",
    "corporación",
    "corporacion",
)


def classify_provider_type(name: str | None) -> str:
    """Devuelve uno de: UNIVERSIDAD | GOBIERNO | ORG_INTL | FUNDACION | PRIVADA."""
    if not name:
        return "PRIVADA"
    n = name.lower()
    if any(k in n for k in IES_KEYWORDS):
        return "UNIVERSIDAD"
    if any(k in n for k in GOBIERNO_KEYWORDS):
        return "GOBIERNO"
    if any(k in n for k in ORG_INTL_KEYWORDS):
        return "ORG_INTL"
    if any(k in n for k in FUNDACION_KEYWORDS):
        return "FUNDACION"
    return "PRIVADA"
