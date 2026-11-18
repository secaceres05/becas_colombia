# ---------- build ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json tsconfig.build.json nest-cli.json ./
# generate no conecta a la BD; la URL es solo para que la config cargue
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npx prisma generate

COPY src ./src
RUN npm run build

# ---------- runtime ----------
FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production

# node_modules completo a propósito: la misma imagen corre `prisma migrate deploy` y el seed (ts-node)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json tsconfig.json prisma.config.ts ./
COPY prisma ./prisma

USER node
EXPOSE 3000

# Aplica las migraciones pendientes antes de arrancar (idempotente). Sin esto, en una BD vacía
# el healthcheck nunca pasa y frontend/caddy no arrancan. Si la migración falla, el contenedor no arranca.
# nest build deja main.js en dist/ o en dist/src/ según el rootDir inferido.
CMD ["sh", "-c", "npx prisma migrate deploy && if [ -f dist/main.js ]; then exec node dist/main.js; else exec node dist/src/main.js; fi"]
