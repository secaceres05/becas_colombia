"""
Spider principal de Becas Colombia.
Orquesta las Fases B → C → D → E → F → G del plan.

Uso:
    scrapy crawl becas_spider                   # procesa todas las pendientes
    scrapy crawl becas_spider -a ids=1,2,3      # procesa solo esas IDs
    scrapy crawl becas_spider -a limit=10       # procesa solo las primeras N pendientes

Requisitos en .env:
    BACKEND_URL, SCRAPER_API_KEY, LLM_PROVIDER, GEMINI_API_KEY (o equivalente)
"""

from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Any, Generator

import scrapy
from scrapy import Spider
from scrapy.http import Response, Request
from scrapy_playwright.page import PageMethod

from becas_scraper.checkpoint import CheckpointDB
from becas_scraper.extractor import (
    BECAS_STRONG_KEYWORDS,
    extract_text_from_html,
    extract_links_from_html,
    find_becas_links,
    find_becas_urls_in_sitemap,
    is_pdf_url,
    extract_text_from_pdf,
    truncate_text,
)
from becas_scraper.llm_client import extract_scholarships
from becas_scraper.pipeline import validate_and_prepare, send_to_ingest
from becas_scraper.university_client import fetch_all_universities, filter_universities_with_website

logger = logging.getLogger(__name__)

# Ruta del checkpoint relativa a la raíz del scraper
CHECKPOINT_PATH = Path(__file__).parent.parent.parent / "scraper_checkpoint.db"

# Tiempo máximo de espera para páginas JS (segundos)
PLAYWRIGHT_TIMEOUT = 60_000  # ms


def _normalize_url(url: str) -> str:
    """Asegura que la URL tenga esquema; devuelve '' si no es válida."""
    if not url or not url.strip():
        return ""
    u = url.strip()
    if not u.startswith(("http://", "https://")):
        u = "https://" + u.lstrip("/")
    return u


def _with_www(url: str) -> str:
    """Devuelve la URL con el subdominio www. antepuesto si aún no lo tiene.

    Útil para sitios que solo responden en www (ej. colmayor.edu.co → www.colmayor.edu.co).
    Devuelve '' si la URL no es utilizable.
    """
    u = _normalize_url(url)
    if not u:
        return ""
    host = u.split("/")[2] if "://" in u else u
    if host.startswith("www."):
        return ""
    parts = u.split("://", 1)
    return f"{parts[0]}://www.{parts[1]}"


class BecasSpider(Spider):
    name = "becas_spider"
    custom_settings = {
        # Playwright
        "DOWNLOAD_HANDLERS": {
            "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
            "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
        },
        "TWISTED_REACTOR": "twisted.internet.asyncioreactor.AsyncioSelectorReactor",
        "PLAYWRIGHT_BROWSER_TYPE": "chromium",
        "PLAYWRIGHT_LAUNCH_OPTIONS": {"headless": True},
        "PLAYWRIGHT_DEFAULT_NAVIGATION_TIMEOUT": PLAYWRIGHT_TIMEOUT,
        # Rate limiting conservador (plan §4)
        "AUTOTHROTTLE_ENABLED": True,
        "AUTOTHROTTLE_START_DELAY": 2.0,
        "AUTOTHROTTLE_MAX_DELAY": 30.0,
        "AUTOTHROTTLE_TARGET_CONCURRENCY": 1.5,
        "CONCURRENT_REQUESTS_PER_DOMAIN": 1,
        "DOWNLOAD_DELAY": 2,
        # Robot.txt
        "ROBOTSTXT_OBEY": True,
        # Identificación honesta (plan §4)
        "USER_AGENT": "BecasColombiaBot/1.0 (+https://becascolombia.co/bot)",
        # Timeout razonable
        "DOWNLOAD_TIMEOUT": 30,
        # Reintentos
        "RETRY_ENABLED": True,
        "RETRY_TIMES": 3,
        "RETRY_HTTP_CODES": [500, 502, 503, 504, 408, 429],
        # Logs
        "LOG_LEVEL": "INFO",
        # No pipeline de items de Scrapy (usamos nuestro propio pipeline httpx)
        "ITEM_PIPELINES": {},
    }

    def __init__(
        self,
        ids: str = "",
        limit: str = "",
        *args: Any,
        **kwargs: Any,
    ) -> None:
        super().__init__(*args, **kwargs)
        self.checkpoint = CheckpointDB(CHECKPOINT_PATH)
        self._ids_filter: list[int] = [int(i) for i in ids.split(",") if i.strip()] if ids else []
        self._limit: int = int(limit) if limit else 0

    def start_requests(self) -> Generator[Request, None, None]:
        """Carga universidades desde backend, registra en checkpoint, emite requests."""
        logger.info("[Spider] Cargando universidades desde el backend...")
        all_universities = fetch_all_universities()
        universities = filter_universities_with_website(all_universities)

        # Registrar en checkpoint (no sobreescribe existentes)
        self.checkpoint.register_universities(universities)

        # Filtrar según argumentos del spider
        if self._ids_filter:
            universities = [u for u in universities if u["id"] in self._ids_filter]
            logger.info("[Spider] Modo IDs: procesando %d universidades", len(universities))
        else:
            # Solo pendientes (y errores reintentables)
            pending_ids = {r["university_id"] for r in self.checkpoint.get_pending()}
            universities = [u for u in universities if u["id"] in pending_ids]
            if self._limit:
                universities = universities[: self._limit]
            logger.info("[Spider] Pendientes a procesar: %d", len(universities))

        if not universities:
            logger.info("[Spider] No hay universidades pendientes. Proceso completado.")
            return

        for university in universities:
            website = _normalize_url(university["website"])
            if not website:
                logger.warning(
                    "[Spider] %s sin website válido → sin_url_becas",
                    university["name"],
                )
                self.checkpoint.update_status(
                    university["id"],
                    "sin_url_becas",
                    error_msg="Website vacío o inválido",
                )
                continue
            logger.info("[Spider] → %s | %s", university["name"], website)
            yield self._make_playwright_request(
                url=website,
                callback=self.parse_home,
                meta={"university": university, "playwright_phase": "home"},
                errback=self.handle_error,
            )

    # ------------------------------------------------------------------
    # Fase B: descubrimiento de la URL de becas (home de la universidad)
    # ------------------------------------------------------------------

    def parse_home(self, response: Response) -> Generator[Request, None, None]:
        university = response.meta["university"]
        logger.info("[Fase B] Analizando home: %s", response.url)

        # Descubrimiento de enlaces: HTML crudo (conserva nav/header/footer),
        # donde los sitios suelen poner el enlace "Becas".
        links = extract_links_from_html(response.text, base_url=response.url)

        # Buscar enlaces candidatos a página de becas
        becas_links = find_becas_links(links)

        # Filtrar enlaces que apuntan a dominios externos (ej. icetex.gov.co,
        # datos.gov.co). Muchas universidades enlazan al portal ICETEX como
        # su "página de becas", pero ese contenido es interinstitucional y
        # su DNS suele fallar localmente. Solo seguimos enlaces del mismo
        # dominio (o subdominios) de la universidad.
        from urllib.parse import urlparse

        base_host = urlparse(response.url).hostname or ""
        # Quitar www. para comparar subdominios (www.unal.edu.co == unal.edu.co)
        base_root = base_host.removeprefix("www.")

        def _same_domain(url: str) -> bool:
            host = urlparse(url).hostname or ""
            root = host.removeprefix("www.")
            if not root:
                return True  # path relativo → mismo dominio
            return root == base_root or root.endswith("." + base_root)

        external = []
        internal_becas = []
        for u in becas_links:
            if _same_domain(u):
                internal_becas.append(u)
            else:
                external.append(u)

        if external:
            logger.info(
                "[Fase B] %d enlaces externos descartados para %s: %s",
                len(external),
                university["name"],
                [urlparse(u).hostname for u in external[:5]],
            )

        if not internal_becas:
            # Sin enlace interno de beas → respaldo sitemap
            from urllib.parse import urljoin

            sitemap_url = urljoin(response.url, "/sitemap.xml")
            logger.info(
                "[Fase B] Sin enlace de becas interno en home de %s. Probando sitemap: %s",
                university["name"],
                sitemap_url,
            )
            yield scrapy.Request(
                url=sitemap_url,
                callback=self.parse_sitemap,
                meta={
                    "university": university,
                    "sitemap_source": "direct",
                    "base_url": response.url,
                },
                errback=self.handle_sitemap_error,
                dont_filter=True,
            )
            return

        # Tomar el primer candidato interno (mayor relevancia)
        becas_url = internal_becas[0]
        logger.info("[Fase B] URL de becas encontrada: %s", becas_url)

        # Verificar si es PDF directamente
        if is_pdf_url(becas_url):
            yield scrapy.Request(
                url=becas_url,
                callback=self.parse_pdf,
                meta={
                    "university": university,
                    "becas_url": becas_url,
                    "metodo_descubrimiento": "home",
                },
                errback=self.handle_error,
            )
            return

        # Fase C: rastrear la página de becas con Playwright
        yield self._make_playwright_request(
            url=becas_url,
            callback=self.parse_becas_page,
            meta={
                "university": university,
                "becas_url": becas_url,
                "metodo_descubrimiento": "home",
            },
            errback=self.handle_error,
        )

    # ------------------------------------------------------------------
    # Fase B-respaldo: descubrimiento vía sitemap.xml / robots.txt
    # ------------------------------------------------------------------

    def parse_sitemap(
        self, response: Response
    ) -> Generator[Request, None, None]:
        """
        Parsea un sitemap.xml. Si encuentra URLs de becas, avanza a Fase C.
        Si es un sitemapindex, sigue los sub-sitemaps relevantes.
        Si no hay nada útil y venía de la ruta directa, prueba robots.txt.
        """
        university = response.meta["university"]
        source = response.meta.get("sitemap_source", "direct")
        base_url = response.meta.get("base_url", response.url)

        logger.info("[Fase B/Sitemap] Analizando sitemap: %s", response.url)

        # ¿Es XML de sitemap?
        body = response.text
        if response.status != 200 or not body.strip().startswith("<?xml"):
            # No es sitemap válido. Si venía directo, probar robots.txt.
            if source == "direct":
                from urllib.parse import urljoin

                robots_url = urljoin(base_url, "/robots.txt")
                logger.info(
                    "[Fase B/Sitemap] %s no es sitemap válido. Probando robots.txt: %s",
                    response.url,
                    robots_url,
                )
                yield scrapy.Request(
                    url=robots_url,
                    callback=self.parse_robots_for_sitemap,
                    meta={
                        "university": university,
                        "base_url": base_url,
                        "sitemap_source": "robots",
                    },
                    errback=self.handle_sitemap_error,
                    dont_filter=True,
                )
                return
            # Ya venía de robots.txt y no sirvió → sin_url_becas
            self._mark_sin_url_becas(university, "sitemap inválido o vacío")
            return

        # ¿Es sitemapindex (sub-sitemaps) o urlset (URLs finales)?
        # Profundidad máx 1: si este request viene de un sub-sitemap (source=="sub")
        # y resulta ser OTRO índice, no seguir más profundo → marcar sin_url_becas.
        is_index = "<sitemapindex" in body[:500].lower() or "<sitemapindex" in body.lower()
        if is_index and source == "sub":
            logger.warning(
                "[Fase B/Sitemap] Sub-sitemap %s es otro índice (profundidad>1). "
                "No se sigue más profundo.",
                response.url,
            )
            self._mark_sin_url_becas(university, "sub-sitemap es índice (profundidad>1)")
            return

        if is_index:
            # Index: seguir sub-sitemaps relevantes. Filtrar por keywords en la URL
            # del sub-sitemap (beca/financ/estudiante/admision/page/main) — nunca
            # seguir todos sin filtrar. Límite de 5 sub-sitemaps.
            # Profundidad máx 1: los sub-sitemaps se marcan source="sub" y si alguno
            # resulta ser otro índice, NO se sigue más profundo.
            import re

            sub_locs = re.findall(r"<loc>(.*?)</loc>", body, re.IGNORECASE)
            logger.info(
                "[Fase B/Sitemap] Index con %d sub-sitemaps en %s",
                len(sub_locs),
                response.url,
            )
            keyword_filter = re.compile(
                r"beca|financ|estudiante|admision|page|main", re.IGNORECASE
            )
            sub_locs_filtered = [u for u in sub_locs if keyword_filter.search(u)][:5]
            if not sub_locs_filtered:
                # Si ninguno matchea keywords, tomar los primeros 3 como fallback
                sub_locs_filtered = sub_locs[:3]

            followed = 0
            for sub_url in sub_locs_filtered:
                yield scrapy.Request(
                    url=sub_url.strip(),
                    callback=self.parse_sitemap,
                    meta={
                        "university": university,
                        "sitemap_source": "sub",
                        "base_url": base_url,
                    },
                    errback=self.handle_sitemap_error,
                    dont_filter=True,
                )
                followed += 1
            if followed == 0:
                self._mark_sin_url_becas(university, "sitemap index sin sub-sitemaps")
            return

        # urlset: buscar URLs de becas
        becas_urls = find_becas_urls_in_sitemap(body)
        logger.info(
            "[Fase B/Sitemap] %d URLs candidatas en %s", len(becas_urls), response.url
        )

        if becas_urls:
            becas_url = becas_urls[0]
            logger.info(
                "[Fase B/Sitemap] URL de becas encontrada vía sitemap: %s", becas_url
            )
            # El método de descubrimiento depende de la fuente de este request
            if source == "robots":
                metodo = "sitemap_robots"
            else:
                metodo = "sitemap_directo"
            if is_pdf_url(becas_url):
                yield scrapy.Request(
                    url=becas_url,
                    callback=self.parse_pdf,
                    meta={
                        "university": university,
                        "becas_url": becas_url,
                        "metodo_descubrimiento": metodo,
                    },
                    errback=self.handle_error,
                )
                return
            yield self._make_playwright_request(
                url=becas_url,
                callback=self.parse_becas_page,
                meta={
                    "university": university,
                    "becas_url": becas_url,
                    "metodo_descubrimiento": metodo,
                },
                errback=self.handle_error,
            )
            return

        # No encontró nada en este sitemap. Si venía directo, probar robots.txt.
        if source == "direct":
            from urllib.parse import urljoin

            robots_url = urljoin(base_url, "/robots.txt")
            logger.info(
                "[Fase B/Sitemap] Sin becas en sitemap directo. Probando robots.txt: %s",
                robots_url,
            )
            yield scrapy.Request(
                url=robots_url,
                callback=self.parse_robots_for_sitemap,
                meta={
                    "university": university,
                    "base_url": base_url,
                    "sitemap_source": "robots",
                },
                errback=self.handle_sitemap_error,
                dont_filter=True,
            )
            return

        self._mark_sin_url_becas(university, "sin URL de becas en sitemap")

    def parse_robots_for_sitemap(
        self, response: Response
    ) -> Generator[Request, None, None]:
        """Lee robots.txt y sigue las líneas `Sitemap:` declaradas."""
        import re

        university = response.meta["university"]
        base_url = response.meta.get("base_url", response.url)

        logger.info("[Fase B/Robots] Analizando robots.txt: %s", response.url)

        if response.status != 200:
            self._mark_sin_url_becas(university, "robots.txt inaccesible")
            return

        sitemap_lines = re.findall(
            r"(?im)^\s*sitemap:\s*(https?://\S+)", response.text
        )
        logger.info(
            "[Fase B/Robots] %d sitemaps declarados en robots.txt", len(sitemap_lines)
        )

        if not sitemap_lines:
            self._mark_sin_url_becas(university, "sin Sitemap: en robots.txt")
            return

        for sm_url in sitemap_lines[:3]:  # limitar a 3 sitemaps
            yield scrapy.Request(
                url=sm_url.strip(),
                callback=self.parse_sitemap,
                meta={
                    "university": university,
                    "sitemap_source": "robots",
                    "base_url": base_url,
                },
                errback=self.handle_sitemap_error,
                dont_filter=True,
            )

    def handle_sitemap_error(self, failure: Any) -> Any:
        """Errback para sitemap/robots. Si falla el sitemap directo, prueba robots."""
        university = failure.request.meta.get("university")
        base_url = failure.request.meta.get("base_url", "")
        source = failure.request.meta.get("sitemap_source", "direct")

        logger.warning(
            "[Fase B/Sitemap] Error en sitemap (%s) para %s: %s",
            source,
            university.get("name", "?") if university else "?",
            str(failure.value)[:120],
        )

        # Si falló el sitemap directo, intentar robots.txt como último recurso
        if source == "direct" and base_url:
            from urllib.parse import urljoin

            robots_url = urljoin(base_url, "/robots.txt")
            yield scrapy.Request(
                url=robots_url,
                callback=self.parse_robots_for_sitemap,
                meta={
                    "university": university,
                    "base_url": base_url,
                    "sitemap_source": "robots",
                },
                errback=self.handle_sitemap_error,
                dont_filter=True,
            )
            return

        self._mark_sin_url_becas(
            university, f"error sitemap/robots: {str(failure.value)[:80]}"
        )

    def _mark_sin_url_becas(self, university: dict, reason: str) -> None:
        """Centraliza el marcado sin_url_becas para el flujo de sitemap."""
        logger.warning(
            "[Fase B] Marcando sin_url_becas para %s: %s",
            university.get("name", "?"),
            reason,
        )
        self.checkpoint.update_status(
            university["id"],
            "sin_url_becas",
            error_msg=f"No se encontró enlace de becas (home + sitemap): {reason}",
        )

    # ------------------------------------------------------------------
    # Fase C: rastreo de la página de becas
    # ------------------------------------------------------------------

    def parse_becas_page(self, response: Response) -> Generator[Request, None, None]:
        university = response.meta["university"]
        becas_url = response.meta.get("becas_url", response.url)
        metodo = response.meta.get("metodo_descubrimiento")

        logger.info("[Fase C] Rastreando becas: %s", response.url)

        # ¿Es un PDF?
        content_type = response.headers.get("Content-Type", b"").decode().lower()
        if "pdf" in content_type or is_pdf_url(response.url):
            yield scrapy.Request(
                url=response.url,
                callback=self.parse_pdf,
                meta={
                    "university": university,
                    "becas_url": becas_url,
                    "metodo_descubrimiento": metodo,
                },
                errback=self.handle_error,
            )
            return

        text, _ = extract_text_from_html(response.text, base_url=response.url)

        # ¿Es un índice? Si hay sub-links de becas individuales, seguir 1 nivel
        # Descubrimiento sobre HTML crudo (conserva nav/header/footer).
        raw_links = extract_links_from_html(response.text, base_url=response.url)
        sub_becas_links = find_becas_links(raw_links)

        # Fix de descubrimiento: los hubs (financiación/bienestar) suelen tener
        # texto largo pero enlazan la subpágina real de becas en un submenú.
        # Se baja al sub-enlace "beca" literal si:
        #   - la página actual tiene texto corto (índice/hub escueto), O
        #   - la URL actual NO contiene "beca" (es un hub de financiación;
        #     no depender solo del umbral de 500 caracteres).
        # Si la URL ya contiene "beca" y el texto es largo, es un índice real
        # de becas: NO se baja a una beca individual (evita perder el listado).
        current_has_beca = bool(BECAS_STRONG_KEYWORDS.search(becas_url))
        is_hub = len(text.strip()) < 500 or not current_has_beca
        beca_sublinks = [
            u
            for u in sub_becas_links
            if u != becas_url and BECAS_STRONG_KEYWORDS.search(u)
        ]
        if is_hub and beca_sublinks:
            sub_url = beca_sublinks[0]
            logger.info("[Fase C] Hub con sub-enlace 'beca', siguiendo: %s", sub_url)
            yield self._make_playwright_request(
                url=sub_url,
                callback=self.parse_becas_page,
                meta={
                    "university": university,
                    "becas_url": sub_url,
                    "metodo_descubrimiento": metodo,
                },
                errback=self.handle_error,
            )
            return

        if sub_becas_links and len(text.strip()) < 500:
            # Parece un índice con poco texto, seguir el primer sub-link
            sub_url = sub_becas_links[0]
            if sub_url != becas_url:  # evitar loop
                logger.info("[Fase C] Índice detectado, siguiendo: %s", sub_url)
                yield self._make_playwright_request(
                    url=sub_url,
                    callback=self.parse_becas_page,
                    meta={
                        "university": university,
                        "becas_url": sub_url,
                        "metodo_descubrimiento": metodo,
                    },
                    errback=self.handle_error,
                )
                return

        # Tiene texto suficiente → pasar a extracción LLM
        yield from self._extract_and_send(university, becas_url, text, metodo)

    # ------------------------------------------------------------------
    # Fase C alternativa: PDF
    # ------------------------------------------------------------------

    def parse_pdf(self, response: Response) -> Generator[None, None, None]:
        university = response.meta["university"]
        becas_url = response.meta.get("becas_url", response.url)
        metodo = response.meta.get("metodo_descubrimiento")

        logger.info("[Fase C/PDF] Extrayendo texto del PDF: %s", response.url)
        text = extract_text_from_pdf(response.body)

        if not text.strip():
            logger.warning("[Fase C/PDF] PDF vacío o no parseable: %s", response.url)
            self.checkpoint.update_status(
                university["id"],
                "error_pdf",
                error_msg=f"PDF sin texto extraíble: {response.url}",
            )
            return

        yield from self._extract_and_send(university, becas_url, text, metodo)

    # ------------------------------------------------------------------
    # Fases D → E → F → G: LLM + validación + checkpoint + ingest
    # ------------------------------------------------------------------

    def _extract_and_send(
        self,
        university: dict,
        source_url: str,
        text: str,
        metodo_descubrimiento: str | None = None,
    ) -> Generator[None, None, None]:
        """Aplica LLM, valida, actualiza checkpoint y envía al backend."""
        text = truncate_text(text)
        dept = university.get("department", {})
        dept_code = dept.get("daneCode") if dept else None

        # Fase D: extracción LLM
        try:
            raw_becas = extract_scholarships(
                text=text,
                university_name=university["name"],
                city=university.get("city", ""),
                source_url=source_url,
            )
        except Exception as exc:
            logger.error(
                "[Fase D] Error LLM para %s: %s", university["name"], exc
            )
            self.checkpoint.update_status(
                university["id"],
                "error_llm",
                error_msg=f"Error LLM: {exc}",
            )
            return

        if not raw_becas:
            logger.info("[Fase D] Sin becas para: %s", university["name"])
            self.checkpoint.update_status(
                university["id"],
                "sin_becas",
                becas_url=source_url,
                metodo_descubrimiento=metodo_descubrimiento,
            )
            return

        # Fase E: validación Pydantic
        source_name = university["name"]
        valid_dtos = validate_and_prepare(raw_becas, source_name, dept_code)

        if not valid_dtos:
            logger.warning(
                "[Fase E] Todas las becas de %s fallaron validación → baja_confianza",
                university["name"],
            )
            self.checkpoint.update_status(
                university["id"],
                "baja_confianza",
                becas_url=source_url,
                error_msg="Todas las becas fallaron validación Pydantic",
                metodo_descubrimiento=metodo_descubrimiento,
            )
            return

        # Fase G: envío al backend
        try:
            results = send_to_ingest(valid_dtos)
            logger.info(
                "[Fase G] ✔ %d becas enviadas para %s",
                len(results),
                university["name"],
            )
            # Fase F: actualizar checkpoint como ok
            self.checkpoint.update_status(
                university["id"],
                "ok",
                becas_enviadas=len(results),
                becas_url=source_url,
                metodo_descubrimiento=metodo_descubrimiento,
            )
        except Exception as exc:
            logger.error(
                "[Fase G] Error enviando a /ingest para %s: %s",
                university["name"],
                exc,
            )
            self.checkpoint.update_status(
                university["id"],
                "error_playwright",
                error_msg=f"Error /ingest: {exc}",
            )

        return
        yield  # hace que sea un generator (compatibilidad con Scrapy)

    # ------------------------------------------------------------------
    # Manejo de errores de red (Nivel 1 del plan)
    # ------------------------------------------------------------------

    def handle_error(self, failure: Any) -> Any:
        """Maneja errores de red. Nivel 1: se loguea y se marca en checkpoint.

        Si el fallo es de red y la URL no tiene www., devuelve un Request
        reintentando con www. para que Scrapy lo reprograme automáticamente.
        """
        request = failure.request
        university = request.meta.get("university", {})
        uid = university.get("id")
        name = university.get("name", "desconocida")

        error_msg = str(failure.value)
        logger.warning("[Spider] Error de red para %s: %s", name, error_msg)

        if uid:
            # Detectar si es un error de login/paywall (403/401 explícito)
            if "403" in error_msg or "401" in error_msg:
                self.checkpoint.update_status(
                    uid,
                    "login_requerido",
                    error_msg=error_msg[:500],
                )
                return

            # Anti-bot: Scrapy/Playwright "Ignoring non-200 response" — el sitio
            # responde un no-200 (típicamente 403 del WAF) que no es login sino
            # bloqueo de bot identificado honestamente. Etiquetar como
            # bloqueo_antibot para revisión grupal posterior (no error_permanente).
            if "Ignoring non-200 response" in error_msg:
                self.checkpoint.update_status(
                    uid,
                    "error_playwright",
                    error_msg=f"[BLOQUEO_ANTIBOT] {error_msg[:480]}",
                )
                return

            # Fallback www.: cuando el host sin-www no es útil pero el sitio
            # podría servir con www. Causas válidas:
            #   - ERR_NAME_NOT_RESOLVED: host sin-www no resuelve DNS.
            #   - ERR_CERT_COMMON_NAME_INVALID: el sitio responde pero el cert
            #     no cubre el hostname sin-www (típicamente *.dominio.edu.co);
            #     el sitio suele servir bien en www. (caso 78, 85).
            # NO se dispara ante timeouts, SSL global, non-200 (antibot) etc.,
            # porque ahí el www probablemente tampoco sirve y enmascara la causa.
            url = request.url
            fallback_triggers = (
                "ERR_NAME_NOT_RESOLVED",
                "ERR_CERT_COMMON_NAME_INVALID",
            )
            triggers_fallback = any(t in error_msg for t in fallback_triggers)
            www_url = _with_www(url)
            if triggers_fallback and www_url and not request.meta.get("tried_www"):
                logger.info(
                    "[Spider] Reintentando %s → %s (fallback www por %s)",
                    name,
                    www_url,
                    "DNS" if "ERR_NAME_NOT_RESOLVED" in error_msg else "cert SSL",
                )
                new_meta = dict(request.meta)
                new_meta["tried_www"] = True
                new_meta.setdefault("_original_url", url)
                return request.replace(url=www_url, meta=new_meta)

            # Guardar el error original (no el del intento www, que enmascara)
            original_url = request.meta.get("_original_url", url)
            stored_msg = error_msg[:500]
            if request.meta.get("tried_www"):
                stored_msg = f"[fallback www falló] original={original_url} | {error_msg[:300]}"

            self.checkpoint.update_status(
                uid,
                "error_playwright",
                error_msg=stored_msg,
            )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _make_playwright_request(
        self,
        url: str,
        callback: Any,
        meta: dict,
        errback: Any,
    ) -> Request:
        """Construye un Request configurado para scrapy-playwright."""
        playwright_meta = {
            "playwright": True,
            "playwright_include_page": False,
            "playwright_page_methods": [
                PageMethod("wait_for_load_state", "domcontentloaded", timeout=PLAYWRIGHT_TIMEOUT),
            ],
            **meta,
        }
        return scrapy.Request(
            url=url,
            callback=callback,
            meta=playwright_meta,
            errback=errback,
            dont_filter=False,
        )

    def closed(self, reason: str) -> None:
        """Al cerrar el spider, imprime el resumen del checkpoint."""
        summary = self.checkpoint.get_summary()
        logger.info("=" * 60)
        logger.info("[Spider] RESUMEN FINAL — razón de cierre: %s", reason)
        for status, count in sorted(summary.items()):
            logger.info("  %-20s %d", status, count)
        logger.info("=" * 60)
