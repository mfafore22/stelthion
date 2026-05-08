# Multi-stage Dockerfile for ShopperMind service.
# Produces a single image with two entrypoints: HTTP and worker.

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

FROM base AS deps
COPY package.json package-lock.json .npmrc ./
COPY services/shoppermind/package.json ./services/shoppermind/
COPY packages/shoppermind-client-types/package.json ./packages/shoppermind-client-types/
COPY packages/shoppermind-client/package.json ./packages/shoppermind-client/
RUN npm ci --workspace=@stelthion/shoppermind --include-workspace-root=false --legacy-peer-deps

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/shoppermind/node_modules ./services/shoppermind/node_modules
COPY services/shoppermind ./services/shoppermind
WORKDIR /app/services/shoppermind
# DATABASE_URL is required by prisma.config.ts at load time; a dummy value is
# sufficient for `prisma generate`, which only emits the client.
RUN DATABASE_URL="postgres://build:build@localhost:5432/build" npx prisma generate
RUN npm run build
# tsc doesn't copy non-TS assets; mirror JSON sidecars the runtime loads at import.meta.url
RUN mkdir -p dist/engine/registry && cp src/engine/registry/seed-markets.json dist/engine/registry/

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/shoppermind/node_modules ./services/shoppermind/node_modules
COPY --from=builder /app/services/shoppermind/dist ./services/shoppermind/dist
COPY --from=builder /app/services/shoppermind/prisma ./services/shoppermind/prisma
COPY --from=builder /app/services/shoppermind/package.json ./services/shoppermind/package.json
WORKDIR /app/services/shoppermind
EXPOSE 4000
CMD ["node", "dist/http/server.js"]
