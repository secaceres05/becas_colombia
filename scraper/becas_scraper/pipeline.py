"""
Pipeline de Scrapy: valida y envía becas extraídas al backend.

Fases E (validación con Pydantic) y G (POST /ingest) del plan.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import date
from typing import Any

import httpx
from dotenv import load_dotenv

from becas_scraper.schemas import ScholarshipItem, ScholarshipType, Coverage
from becas_scraper.provider_classifier import classify_provider_type

load_dotenv()

logger = logging.getLogger(__name__)

BACKEND_INGEST_URL = os.environ.get("BACKEND_INGEST_URL", "http://localhost:3000/ingest")
SCRAPER_API_KEY = os.environ.get("SCRAPER_API_KEY", "")
REQUEST_TIMEOUT = 30


def _parse_date(value: Any) -> str | None:
    """
    Convierte un valor de fecha (texto libre del LLM) a formato ISO 8601
    si es parseable. Si no, devuelve None.
    El backend espera strings tipo "2025-03-15" (IsDateString).
    """
    if not value:
        return None
    if isinstance(value, date):
        return value.isoformat()

    # Intentar parsear texto libre del LLM
    import re
    from datetime import datetime

    text = str(value).strip()

    # Formato ya ISO
    if re.match(r"^\d{4}-\d{2}-\d{2}$", text):
        return text

    # Formato "15 de marzo de 2025" (español)
    meses = {
        "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
        "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
        "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
    }
    m = re.search(
        r"(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})", text, re.IGNORECASE
    )
    if m:
        day = int(m.group(1))
        month = meses.get(m.group(2).lower())
        year = int(m.group(3))
        if month:
            try:
                return datetime(year, month, day).date().isoformat()
            except ValueError:
                pass

    # No parseable — devolvemos None en vez de inventar
    logger.debug("[Pipeline] Fecha no parseable, se omite: %r", text)
    return None


def validate_and_prepare(
    raw_becas: list[dict],
    source_name: str,
    department_dane_code: str | None = None,
) -> list[dict]:
    """
    Valida cada beca extraída por el LLM con el modelo Pydantic ScholarshipItem.
    Devuelve solo las que son válidas, en el formato que espera IngestScholarshipDto.

    Args:
        raw_becas: Lista cruda del LLM.
        source_name: Nombre de la fuente (requerido por el contrato).
        department_dane_code: Código DANE del departamento de la universidad,
                              para agregar a department_codes si es beca NACIONAL.
    """
    valid: list[dict] = []
    invalid_count = 0

    for raw in raw_becas:
        # Asegurar source_name
        raw["source_name"] = raw.get("source_name") or source_name

        # Normalizar fechas (texto del LLM → ISO 8601 o None)
        raw["opening_date"] = _parse_date(raw.get("opening_date"))
        raw["closing_date"] = _parse_date(raw.get("closing_date"))

        # Normalizar official_url: Pydantic HttpUrl puede venir como objeto
        for field in ("official_url", "application_url"):
            val = raw.get(field)
            if val and not isinstance(val, str):
                raw[field] = str(val)

        # Normalizar requirements: el LLM a veces devuelve value como string plano,
        # pero el schema exige dict. Envolver en {"text": ...} sin perder el dato.
        for req in raw.get("requirements") or []:
            if isinstance(req, dict) and not isinstance(req.get("value"), dict):
                value = req.get("value")
                req["value"] = {"text": value} if value is not None else {}

        try:
            item = ScholarshipItem(**raw)
        except Exception as exc:
            logger.warning("[Pipeline] Beca inválida descartada: %s | error: %s", raw.get("title"), exc)
            invalid_count += 1
            continue

        # Construir el DTO para /ingest (snake_case como lo espera el backend)
        dto: dict[str, Any] = {
            "title": item.title,
            "type": item.type.value,
            "coverage": item.coverage.value,
            "official_url": str(item.official_url),
            "source_name": item.source_name,
        }
        if item.description:
            dto["description"] = item.description
        if item.application_url:
            dto["application_url"] = str(item.application_url)
        if item.opening_date:
            dto["opening_date"] = item.opening_date.isoformat()
        if item.closing_date:
            dto["closing_date"] = item.closing_date.isoformat()
        if item.provider_name:
            dto["provider_name"] = item.provider_name
            dto["provider_type"] = classify_provider_type(item.provider_name)
        if item.requirements:
            dto["requirements"] = [r.model_dump() for r in item.requirements]

        # Agregar código DANE del departamento para becas NACIONAL
        if item.type == ScholarshipType.NACIONAL and department_dane_code:
            dto["department_codes"] = [department_dane_code]

        valid.append(dto)

    if invalid_count:
        logger.warning("[Pipeline] %d becas descartadas por validación Pydantic", invalid_count)

    return valid


def send_to_ingest(dtos: list[dict]) -> list[dict]:
    """
    Envía cada beca validada al endpoint POST /ingest del backend.

    Returns:
        Lista de respuestas del backend: [{id, slug, action}]

    Raises:
        httpx.HTTPError: Si el backend responde con error (para manejo en el spider).
    """
    if not SCRAPER_API_KEY:
        raise ValueError("SCRAPER_API_KEY no está configurada en .env")

    headers = {
        "x-api-key": SCRAPER_API_KEY,
        "Content-Type": "application/json",
    }
    results: list[dict] = []

    with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
        for dto in dtos:
            try:
                resp = client.post(BACKEND_INGEST_URL, json=dto, headers=headers)
                resp.raise_for_status()
                results.append(resp.json())
                logger.info("[Ingest] ✔ Beca enviada: %s → %s", dto.get("title"), resp.json())
            except httpx.HTTPStatusError as exc:
                logger.error(
                    "[Ingest] ✗ Error HTTP %s enviando '%s': %s",
                    exc.response.status_code,
                    dto.get("title"),
                    exc.response.text[:300],
                )
                raise
            except Exception as exc:
                logger.error("[Ingest] ✗ Error inesperado: %s", exc)
                raise

    return results
