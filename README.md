# Becas Colombia

Plataforma web para centralizar becas (nacionales e internacionales), universidades
y guías de procesos de admisión para jóvenes en Colombia.

## Monorepo
| Carpeta     | Stack                                   | Rol                         |
|-------------|-----------------------------------------|-----------------------------|
| `/backend`  | NestJS + Prisma + PostgreSQL + Redis    | API REST + CMS              |
| `/scraper`  | Python (Scrapy + Playwright)            | Microservicio de ingesta    |
| `/frontend` | Next.js (App Router) + TS + Tailwind    | Sitio público + panel admin |

## Quickstart
```bash
# 1. Infraestructura
cp .env.example .env            # rellenar credenciales
docker compose up -d            # postgres:5432, redis:6379, pgadmin:5050

# 2. Backend
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev               # http://localhost:3000  | docs en /docs

# 3. Scraper
cd ../scraper
poetry install
poetry run playwright install chromium
cp .env.example .env

# 4. Frontend
cd ../frontend
cp .env.example .env.local
npm install
npm run dev -- -p 3001          # http://localhost:3001
```

## Seguridad
- Cero hard coding. Credenciales solo en `.env` (en `.gitignore`).
- Solo se versiona `.env.example` sin valores reales.

## Roadmap
Fase 0 Scaffold (hecho) · Fase 1 Modelado · Fase 2 Ingesta · Fase 3 API+filtros ·
Fase 4 CMS admin · Fase 5 Frontend público · Fase 6 Despliegue.
