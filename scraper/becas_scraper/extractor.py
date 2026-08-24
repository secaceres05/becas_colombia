"""
Módulo de extracción de texto de páginas web y PDFs.
Fases B y C del plan: descubrimiento de URL de becas + rastreo.

- Fase B: busca enlaces con variantes de "becas", "financiación", etc.
- Fase C: extrae texto de esa URL (HTML o PDF).

Usa scrapy-playwright para páginas con JS.
"""

from __future__ import annotations

import io
import logging
import re
from urllib.parse import urljoin, urlparse

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Palabras clave para descubrir la página de becas (Fase B)
#
# Dos niveles de peso (fix de descubrimiento):
#   - FUERTE: la palabra "beca" (literal). Indica una página real de becas.
#   - DÉBIL: financiación/bienestar/crédito/etc. Esas páginas suelen ser hubs
#     de tarifas, crédito bancario o bienestar general que NO contienen becas
#     (Rosario /financiacion, UCC tarifas-y-financiacion, UAO hub...). Solo
#     sirven de respaldo si no existe ningún enlace con "beca" literal.
# ---------------------------------------------------------------------------
BECAS_STRONG_KEYWORDS = re.compile(r"beca", re.IGNORECASE)

BECAS_WEAK_KEYWORDS = re.compile(
    r"financiaci[oó]n|apoyo.{0,10}econ[oó]mico|bienestar.{0,15}universi"
    r"|subsidio|estipendio|auxilios|fondo.{0,10}apoyo|cr[eé]dito.{0,10}educativo"
    r"|icetex|descuento.{0,10}matr[ií]cula|exenci[oó]n",
    re.IGNORECASE,
)

# Compatibilidad: combinación de ambas (logs y pruebas)
BECAS_KEYWORDS = re.compile(
    r"beca|financiaci[oó]n|apoyo.{0,10}econ[oó]mico|bienestar.{0,15}universi"
    r"|subsidio|estipendio|auxilios|fondo.{0,10}apoyo|cr[eé]dito.{0,10}educativo"
    r"|icetex|descuento.{0,10}matr[ií]cula|exenci[oó]n",
    re.IGNORECASE,
)

# URLs que claramente no son páginas de becas (evitar ruido)
EXCLUDE_PATTERNS = re.compile(
    r"facebook|twitter|instagram|youtube|linkedin|mailto:|javascript:|#$|\.pdf$|\.jpg|\.png|elementor",
    re.IGNORECASE,
)


def find_becas_links(links: list[dict]) -> list[str]:
    """
    Filtra una lista de {href, text} y devuelve las URLs que parecen
    páginas de becas, ordenadas por relevancia.

    Args:
        links: Lista de dicts con 'href' (URL absoluta) y 'text' (texto del enlace).

    Returns:
        Lista de URLs candidatas, de mayor a menor relevancia.
    """
    candidates: list[tuple[int, str]] = []

    for link in links:
        href = link.get("href", "") or ""
        text = link.get("text", "") or ""

        if not href or EXCLUDE_PATTERNS.search(href):
            continue

        # Puntuación en 2 niveles (fix de descubrimiento):
        #   "beca" literal en texto: +3 (página real de becas)
        #   "beca" literal en href:  +2 (preferencia explícita de URL)
        #   keyword débil (financ/bienestar/crédito): +1 (respaldo)
        score = 0
        if BECAS_STRONG_KEYWORDS.search(text):
            score += 3
        if BECAS_STRONG_KEYWORDS.search(href):
            score += 2
        if BECAS_WEAK_KEYWORDS.search(text):
            score += 1
        if BECAS_WEAK_KEYWORDS.search(href):
            score += 1

        if score > 0:
            candidates.append((score, href))

    # Ordenar por score descendente, eliminar duplicados manteniendo orden
    seen: set[str] = set()
    result: list[str] = []
    for _, url in sorted(candidates, key=lambda x: x[0], reverse=True):
        if url not in seen:
            seen.add(url)
            result.append(url)

    return result


def extract_links_from_html(html: str, base_url: str = "") -> list[dict]:
    """
    Extrae TODOS los enlaces de un HTML, SIN eliminar nav/header/footer/aside.

    Uso: descubrimiento de enlaces de becas (Fase B y C). Los menús de
    navegación (<nav>, <header>, <footer>) son justo donde los sitios
    universitarios suelen poner el enlace "Becas", así que aquí NO se
    aplica stripping — se conservan todos los <a href>.

    Returns:
        Lista de dicts {"href": url_absoluta, "text": texto_ancla}.
    """
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        logger.warning("beautifulsoup4 no instalado — extracción de links degradada")
        return []

    soup = BeautifulSoup(html, "html.parser")
    # Solo descartar scripts/styles (no contienen links navegables reales)
    for tag in soup(["script", "style"]):
        tag.decompose()

    links: list[dict] = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if base_url and not href.startswith(("http://", "https://")):
            href = urljoin(base_url, href)
        links.append({"href": href, "text": (a.get_text(strip=True) or "")[:200]})

    return links


def extract_text_from_html(html: str, base_url: str = "") -> tuple[str, list[dict]]:
    """
    Extrae texto LIMPIO (sin nav/header/footer/aside) y enlaces depurados.

    Uso: contenido que se envía al LLM en la Fase D. El stripping de
    nav/header/footer/aside evita ruido de menús repetitivos en el texto
    pasado al modelo. Para descubrimiento de enlaces usar
    extract_links_from_html (que conserva los menús).

    Returns:
        (texto_limpio, lista_de_links)
        Cada link: {"href": url_absoluta, "text": texto_ancla}
    """
    # Importación local para no requerir beautifulsoup si no está disponible
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        logger.warning("beautifulsoup4 no instalado — extracción HTML degradada")
        return html, []

    soup = BeautifulSoup(html, "html.parser")

    # Eliminar elementos no textuales
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    # Texto limpio
    text = " ".join(soup.get_text(separator=" ").split())

    # Extraer enlaces
    links: list[dict] = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if base_url and not href.startswith(("http://", "https://")):
            href = urljoin(base_url, href)
        links.append({"href": href, "text": (a.get_text(strip=True) or "")[:200]})

    return text, links


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extrae texto de un PDF.
    Requiere pypdf (instalado vía poetry).

    Returns:
        Texto extraído, o string vacío si falla.
    """
    try:
        import pypdf  # type: ignore

        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        pages_text = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                pages_text.append(t)
        return "\n".join(pages_text)
    except Exception as exc:
        logger.error("[PDF] Error extrayendo texto: %s", exc)
        return ""


def is_pdf_url(url: str) -> bool:
    """Detecta si una URL probablemente resuelve a un PDF."""
    path = urlparse(url).path.lower()
    return path.endswith(".pdf")


def find_becas_urls_in_sitemap(sitemap_xml: str) -> list[str]:
    """
    Extrae todas las <loc> de un XML de sitemap y devuelve aquellas que coincidan
    con BECAS_KEYWORDS en la URL, ordenadas por relevancia.

    Returns:
        Lista de URLs candidatas a página de becas.
    """
    if not sitemap_xml:
        return []

    # Extraer todo el contenido dentro de tags <loc>...</loc>
    locs = re.findall(r"<loc>(.*?)</loc>", sitemap_xml, re.IGNORECASE)

    candidates: list[tuple[int, str]] = []
    seen: set[str] = set()

    for raw_url in locs:
        url = raw_url.strip()
        if not url or url in seen or EXCLUDE_PATTERNS.search(url):
            continue
        seen.add(url)

        # Calcular score según coincidencias de keywords en la URL
        # (mismo 2 niveles que find_becas_links)
        score = 0
        if BECAS_STRONG_KEYWORDS.search(url):
            score += 3
            # Bonus si la URL contiene literalmente "beca"
            if re.search(r"beca", url, re.IGNORECASE):
                score += 1
        if BECAS_WEAK_KEYWORDS.search(url):
            score += 1

        if score > 0:
            candidates.append((score, url))

    # Ordenar por score descendente
    candidates.sort(key=lambda x: x[0], reverse=True)
    return [url for _, url in candidates]


def truncate_text(text: str, max_chars: int = 12000) -> str:
    """Limita el texto al máximo de caracteres para no superar contextos de LLM."""
    if len(text) <= max_chars:
        return text
    logger.debug("[Text] Texto truncado de %d a %d chars", len(text), max_chars)
    return text[:max_chars]
