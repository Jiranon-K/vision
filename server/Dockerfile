# Mirrors the frontend's Dockerfile deliberately: separate dependency, build and
# runtime stages, a frozen lockfile install, and a non-root user in the final
# image. Consistency between the two deployables is worth more here than
# optimising each independently.

# ============================================================
# Stage 1: Install dependencies (including dev, for the build)
# ============================================================
FROM oven/bun:1 AS deps

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

# ============================================================
# Stage 2: Compile TypeScript
# ============================================================
FROM oven/bun:1 AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bun run build

# ============================================================
# Stage 3: Production dependencies only
# ============================================================
FROM oven/bun:1 AS prod-deps

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile --production

# ============================================================
# Stage 4: Production runner (minimal image)
# ============================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 api

COPY --from=prod-deps --chown=api:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=api:nodejs /app/dist ./dist
COPY --chown=api:nodejs package.json ./

USER api

EXPOSE 3001

ENV PORT=3001

# Readiness, not liveness: the container is only useful once the database is
# connected, and the liveness check answers "ok" while it is not.
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/health/ready',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/index.js"]
