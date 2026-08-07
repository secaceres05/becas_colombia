# CLAUDE.md — /backend

NestJS + Prisma + PostgreSQL + Redis. API REST y CMS de Becas Colombia.

## Estructura
```
src/
  prisma/         PrismaModule (global) + PrismaService
  app.module.ts   Root: ConfigModule global + PrismaModule
  main.ts         ValidationPipe global, CORS, Swagger en /docs
prisma/
  schema.prisma   Modelos (definidos en Fase 1)
.env.example      Plantilla de variables (copiar a .env)
```

## Setup local
```bash
cp .env.example .env          # rellenar credenciales
npm install
npx prisma generate           # requiere acceso a binaries.prisma.sh
npx prisma migrate dev        # crea/aplica migraciones
npx prisma db seed            # carga departamentos + admin (Fase 1)
npm run start:dev             # http://localhost:3000  |  docs en /docs
```

## Reglas
- ValidationPipe con whitelist + forbidNonWhitelisted activo: todo DTO se valida.
- Sin hard coding: leer config siempre vía ConfigService / process.env.
- PrismaModule es @Global → no re-importar PrismaService en cada módulo.

## Pendiente por fase
- Fase 1: completar schema.prisma + migración + seed.ts (argon2, 32 departamentos DANE).
- Fase 2: endpoint POST /ingest protegido con x-api-key (SCRAPER_API_KEY).
- Fase 3: módulo scholarships con filtros jsonb + cache Redis + Swagger.
- Fase 4: AuthModule (JWT access 15m / refresh 7d, argon2, RolesGuard) + CRUD admin.
