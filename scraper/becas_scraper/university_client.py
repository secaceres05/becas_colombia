"""
Cliente para obtener la lista de universidades desde el backend.
Fase A del plan: única fuente de verdad, no hay CSV local.

GET {BACKEND_URL}/universities?limit=300&sort=name
"""

from __future__ import annotations

import logging
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:3000")
REQUEST_TIMEOUT = 30


def fetch_all_universities() -> list[dict]:
    """
    Devuelve TODAS las universidades registradas en el backend.

    Cada elemento tiene al menos:
      id, name, city, website, department.daneCode, type

    Raises:
        httpx.HTTPError: Si el backend no responde.
        ValueError: Si la respuesta no tiene el formato esperado.
    """
    url = f"{BACKEND_URL}/universities"
    universities: list[dict] = []
    page = 1
    total_pages = 1  # se actualiza tras la primera respuesta

    with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
        while page <= total_pages:
            params = {"page": page, "limit": 100, "sort": "name"}
            resp = client.get(url, params=params)
            resp.raise_for_status()
            payload = resp.json()

            # Validar estructura esperada
            if "data" not in payload or "meta" not in payload:
                raise ValueError(
                    f"Respuesta inesperada de /universities: {list(payload.keys())}"
                )

            universities.extend(payload["data"])
            total_pages = payload["meta"]["totalPages"]
            logger.debug(
                "[Universities] Página %d/%d — %d universidades acumuladas",
                page,
                total_pages,
                len(universities),
            )
            page += 1

    logger.info("[Universities] Total cargadas: %d", len(universities))
    return universities


def filter_universities_with_website(universities: list[dict]) -> list[dict]:
    """
    Filtra y devuelve solo las universidades que tienen website configurado.
    Las que no tienen website se loguean como advertencia.
    """
    with_site = []
    without_site = []

    for u in universities:
        if u.get("website"):
            with_site.append(u)
        else:
            without_site.append(u)

    if without_site:
        logger.warning(
            "[Universities] %d sin website (se omiten del scraping): %s",
            len(without_site),
            [u["name"] for u in without_site[:5]],
        )

    return with_site
