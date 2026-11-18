# Despliegue propio — Becas Colombia

Arquitectura: un VPS con Docker. Solo **Caddy** publica puertos (80/443) y saca el certificado SSL solo.
Detrás van el frontend (Next), el backend (NestJS) y Postgres, todos internos.
El backend no es accesible desde internet: el panel admin entra por `/admin` del frontend.

Cambios respecto al plan anterior:
- **Caddy en vez de Nginx + certbot**: mismo resultado (HTTPS con Let's Encrypt) sin el problema de arrancar Nginx antes de tener certificado.
- **Sin Redis**: `REDIS_URL` no se usa en ningún archivo de `backend/src`, así que no se despliega.

## 1. Subir estos archivos al repo (PowerShell, en tu PC)

```powershell
cd C:\Users\Sebastian\Documents\becas-colombia\becas-colombia
if (Test-Path backend\prisma.config.ts) { Move-Item backend\prisma.config.ts backend\prisma.config.ts.bak }
git pull
Expand-Archive -Path $HOME\Downloads\deploy-pack.zip -DestinationPath . -Force
git apply predeploy.patch
Remove-Item predeploy.patch
git status -s
```

El `Move-Item` aparta tu `prisma.config.ts` local sin commitear: Juan ya subió el suyo y `git pull` se negaría a sobrescribir el tuyo. Cuando termines puedes borrar el `.bak`.

`git status` debe mostrar Dockerfiles, `docker-compose.prod.yml`, `Caddyfile`, `.env.production.example` y 4 archivos modificados. **No** debe aparecer ningún `.env`.

```powershell
git add -A
git commit -m "chore: despliegue con Docker + Caddy; JWT sin fallback; limites throttle por env"
git push
```

Si `git apply` falla, tu copia local difiere de GitHub: pásame el error.

Qué hace `predeploy.patch`:
- `jwt.strategy.ts`: el backend ya no arranca sin `JWT_SECRET` (antes usaba `'fallback_secret'`).
- `app.module.ts`: los límites globales de rate limiting leen variables de entorno. Con el valor por defecto (10/min por IP) todo el sitio se bloquearía, porque todo el tráfico llega al backend desde el contenedor del frontend, es decir, desde una sola IP. Login, refresh e ingest conservan sus límites estrictos.
- `page.tsx` y `universidades/page.tsx`: `force-dynamic`. Sin esto, el build de Docker (sin backend) deja la home en 0 becas y el directorio vacío durante minutos.

## 2. Preparar el VPS (Ubuntu 24.04)

```bash
ssh root@IP_DEL_VPS
adduser deploy
usermod -aG sudo deploy
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw enable
exit
```

Entra como `deploy` (`ssh deploy@IP_DEL_VPS`) para el resto.

## 3. Dominio

En el DNS de tu registrador crea un registro **A**: `becascolombia.com` → IP del VPS (y otro para `www`).
Comprueba que propagó: `dig +short becascolombia.com` debe devolver la IP.

Para probar antes de tener dominio pon `DOMAIN=:80` en el `.env` del paso 4 y abre `http://IP_DEL_VPS` (sin SSL). Ojo: en ese modo el login de `/admin` no funciona desde el navegador, porque las cookies de sesión son `Secure` y el navegador las descarta sobre HTTP (salvo en `localhost`). El sitio público sí se puede revisar.

## 4. Configurar

```bash
git clone https://github.com/secaceres05/becas-colombia.git
cd becas-colombia
cp .env.production.example .env
echo "COMPOSE_FILE=docker-compose.prod.yml" >> .env
for i in 1 2 3 4; do openssl rand -hex 32; done
nano .env
```

Pega un valor distinto en cada uno de: `POSTGRES_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SCRAPER_API_KEY`. Rellena `DOMAIN`, `ADMIN_SEED_EMAIL` y `ADMIN_SEED_PASSWORD` (larga y única).

## 5. Levantar

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

Al arrancar, el backend ejecuta `prisma migrate deploy` solo (crea las tablas y aplica las migraciones pendientes) y después levanta la API. El backend debe quedar `healthy`. Si falla al arrancar, revisa `docker compose logs backend`: casi siempre falta una variable del `.env` o falló una migración.

## 6. Base de datos

La migración `20261118000000_seed_public_catalog` (commit de Juan del 17 de noviembre) ya incluye las **310 becas** del catálogo público (304 vigentes y 6 cerradas), con sus entidades, fuentes, requisitos y departamentos. No hace falta el dump.

Las migraciones ya se aplicaron al arrancar el backend. Solo falta el seed:

```bash
docker compose exec backend npx prisma db seed
```

- `migrate deploy` (automático al arrancar) crea las tablas y carga las becas. Puedes correrlo a mano con `docker compose exec backend npx prisma migrate deploy`; si no hay nada pendiente, no hace nada.
- `db seed` carga los departamentos, las universidades y el primer admin (con `ADMIN_SEED_EMAIL` y `ADMIN_SEED_PASSWORD`).

Ambos pasos son idempotentes: puedes repetirlos sin duplicar datos. Probé las cuatro migraciones en orden sobre un Postgres vacío: quedan 310 becas, 0 admins y 0 universidades hasta que corre el seed.

## 7. Verificar

```bash
curl -I https://becascolombia.com
docker compose exec postgres psql -U becas -d becas -c "select count(*) from scholarships where needs_review = false;"   # debe dar 310
```

Entra a `https://becascolombia.com/admin/login` con el correo y la contraseña del `.env`. Revisa la home (conteo de becas), `/becas`, `/universidades` y `/admisiones`.

## Operación

Actualizar:

```bash
cd ~/becas-colombia && git pull && docker compose up -d --build
```

Backup diario de la BD (crontab del usuario `deploy`, `crontab -e`):

```
0 3 * * * cd ~/becas-colombia && docker compose exec -T postgres pg_dump -U becas -Fc becas > ~/backups/becas_$(date +\%F).dump
```

Crea antes la carpeta: `mkdir -p ~/backups`. Copia esos backups fuera del VPS de vez en cuando.

Notas:
- `/ingest` del backend no es accesible desde fuera. El scraper corre en tu PC contra tu BD local, y los datos nuevos llegan al VPS por dump/restore o desde el panel admin.
- Pendientes que este paquete no cubre: hashear el `refreshToken` con Argon2 (SEC-006) y comparar la API key con `timingSafeEqual` (SEC-016).
- Probado en local (17 de noviembre) con `DOMAIN=:80`: el stack levanta desde una BD vacía aplicando las migraciones al arrancar; el seed crea 33 departamentos, 40 universidades y el admin; quedan 310 becas publicadas; `/`, `/becas`, `/universidades`, `/admisiones` y `/admin/login` responden 200; el login de admin funciona; el backend no publica puertos al host; y sin `JWT_SECRET` ni compose ni el backend arrancan.
