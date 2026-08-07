# CLAUDE.md — /frontend

Next.js (App Router) + TypeScript + Tailwind. Sitio público + panel admin.

## Nota de versión
create-next-app instaló Next 16 (estable jun 2026). El plan original mencionaba
Next 14. Ambos usan App Router; el codigo del plan es compatible. Decidir si fijar
a 14 para paridad con Sigilo o mantener 16 (recomendado para proyecto nuevo).

## Setup local
    cp .env.example .env.local
    npm install
    npm run dev   # backend en 3000 -> correr frontend en 3001 (npm run dev -- -p 3001)

## Estructura (App Router)
    src/app/
      page.tsx           Home con buscador
      becas/             Listado con filtros + detalle [slug]
      universidades/     Directorio
      admin/             Panel protegido (Fase 4)

## Reglas
- Server Components para fetch de datos; Client Components solo para interaccion (filtros).
- Filtros sincronizados a searchParams (URL como fuente de estado).
- Tokens admin en cookie httpOnly (nunca localStorage).
- Cargar /mnt/skills/public/frontend-design/SKILL.md antes de definir direccion visual.

## Pendiente por fase
- Fase 4: /admin (login + dashboard + cola de revision).
- Fase 5: /becas (filtros), /becas/[slug] (SEO), /universidades, guias de admision.
