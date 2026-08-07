# CLAUDE.md — Becas Colombia (raíz del monorepo)

Plataforma web para centralizar becas (nacionales/internacionales), universidades
y guías de procesos de admisión para jóvenes en Colombia.

## Arquitectura
Monorepo con tres subproyectos independientes:

- `/backend`  → NestJS + Prisma + PostgreSQL + Redis. API REST y CMS.
- `/scraper`  → Python (Scrapy + Playwright). Microservicio de ingesta de datos.
- `/frontend` → Next.js 14 (App Router) + TypeScript + Tailwind. Público + panel admin.

## Stack
- Node 22, npm 10
- Python 3.12 (Poetry)
- PostgreSQL 16, Redis 7
- Docker Compose para infraestructura local (postgres, redis, pgadmin)

## Reglas inquebrantables
- **NO hard coding.** Toda credencial/llave va en `.env` (ver `.env.example`).
- `.env` está en `.gitignore`. Solo se commitea `.env.example` sin valores reales.
- El scraper se comunica con el backend vía `POST /ingest` autenticado con `x-api-key` (SCRAPER_API_KEY).
- Becas scrapeadas entran con `needs_review=true`; se publican manualmente desde el CMS.
- Scraping respeta robots.txt y términos de cada portal. Para fuentes gubernamentales, priorizar API/dataset oficial sobre scraping.

## Convenciones
- Naming BD: snake_case en tablas, camelCase en código.
- Enums nativos de Prisma.
- Requisitos de beca: tabla `Requirement` + valor en `jsonb` para filtros tipados.
- Slugs únicos en `Scholarship` para URLs SEO.

## Comandos clave
```bash
# Infra
docker compose up -d
docker compose down

# Backend (desde /backend)
npm run start:dev
npx prisma migrate dev
npx prisma db seed

# Scraper (desde /scraper)
poetry install
poetry run scrapy crawl <spider>

# Frontend (desde /frontend)
npm run dev
```

## Estado del proyecto
- [x] Fase 0 — Scaffold del monorepo
- [ ] Fase 1 — Modelado de datos (schema.prisma)
- [ ] Fase 2 — Motor e ingesta
- [ ] Fase 3 — API REST con filtros
- [ ] Fase 4 — Panel admin (CMS)
- [ ] Fase 5 — Frontend público
- [ ] Fase 6 — Despliegue
