# CLAUDE.md — /scraper

Microservicio Python de ingesta de becas colombianas. Scrapy + Playwright.

## Estructura
```
becas_scraper/
  schemas.py        Contrato Pydantic (ScholarshipItem) — fuente de verdad del formato
  spiders/          Un spider por fuente (icetex, fulbright, daad, ...)
pyproject.toml      Dependencias (Poetry)
.env.example        Plantilla de variables
```

## Setup local
```bash
poetry install
poetry run playwright install chromium
cp .env.example .env          # rellenar SCRAPER_API_KEY (igual que en backend)
poetry run scrapy crawl <spider>
```

## Flujo de datos
1. Spider extrae y normaliza al modelo `ScholarshipItem` (schemas.py).
2. Pipeline valida con Pydantic.
3. Se hace POST a BACKEND_INGEST_URL con header `x-api-key: SCRAPER_API_KEY`.
4. El backend deduplica (official_url + title) y marca needs_review=true.

## Reglas
- ROBOTSTXT_OBEY=True. Respetar términos de cada portal.
- Fuentes gubernamentales: preferir API/dataset oficial (datos.gov.co Socrata, SNIES CSV) sobre scraping.
- Páginas JS-rendered → scrapy-playwright.
- Rate limiting activo (AUTOTHROTTLE).

## Pendiente por fase
- Fase 2: spider ICETEX, cliente Socrata datos.gov.co, import_snies.py (carga masiva CSV), scheduler APScheduler.
