# Becas Colombia

Plataforma web para centralizar becas (nacionales e internacionales), universidades
y guías de procesos de admisión para jóvenes en Colombia.

## Monorepo

| Carpeta     | Stack                                   | Rol                         |
|-------------|-----------------------------------------|-----------------------------|
| `/backend`  | NestJS + Prisma + PostgreSQL + Redis    | API REST + CMS              |
| `/scraper`  | Python (Scrapy + Playwright)            | Microservicio de ingesta    |
| `/frontend` | Next.js (App Router) + TS + Tailwind    | Sitio público + panel admin |

## Arranque local

Requiere Docker con Compose y Node.js 22.12 o posterior en una versión LTS compatible con Prisma. Desde la raíz:

```bash
cp .env.example .env
docker compose up -d --wait postgres redis
```

En una terminal para el backend:

```bash
cd backend
cp .env.example .env
npm ci
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

Ajusta `DATABASE_URL` en `backend/.env` si cambiaste los valores de PostgreSQL en el `.env` raíz. Los valores de ejemplo usan el puerto 5433. La API escucha en `http://localhost:3000`.

En otra terminal, desde la raíz del repo:

```bash
cd frontend
cat > .env.local <<'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3000
API_INTERNAL_URL=http://localhost:3000
EOF
npm ci
npm run dev -- -p 9001
```

Abre [el catálogo](http://localhost:9001/becas). La migración incluye las 310 becas del catálogo público del 17 de noviembre de 2026, con requisitos, entidades y departamentos asociados. Una base vacía queda lista para mostrar el catálogo. Si ya hay una beca con el mismo slug, la migración conserva ese registro.

## Despliegue

Desde `backend`, configura `DATABASE_URL` con la conexión de PostgreSQL del entorno y ejecuta `npx prisma migrate deploy` antes de arrancar la API. Genera el cliente con `npx prisma generate`, compila con `npm run build` y arranca con `npm run start:prod`. Configura `NEXT_PUBLIC_API_URL` con la URL de la API antes de compilar el frontend. El catálogo versionado se instala con las migraciones. El scraper y el seed del administrador son opcionales para consultar las becas.

## Scraper (opcional)

Desde la raíz del repo:

```bash
cd scraper
poetry install
poetry run playwright install chromium
cp .env.example .env
```

## Seguridad

- Configura credenciales mediante variables de entorno.
- Solo versiona archivos de ejemplo sin credenciales reales.

## Roadmap

Fase 0 Scaffold · Fase 1 Modelado · Fase 2 Ingesta · Fase 3 API y filtros ·
Fase 4 CMS admin · Fase 5 Frontend público · Fase 6 Despliegue.
