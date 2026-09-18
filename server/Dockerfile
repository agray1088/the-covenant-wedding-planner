# Production image for the Covenant sync API (Node + Express).
# Pair with managed Postgres (Railway/Fly/Render) via DATABASE_URL.
# Local Docker Desktop still uses docker-compose.yml (dev trust auth) — not this file.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8787 \
    HOST=0.0.0.0 \
    COVENANT_SYNC_DOCKER=1
RUN apk add --no-cache wget \
  && addgroup -S covenant && adduser -S covenant -G covenant
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY index.js ./
COPY lib ./lib
COPY routes ./routes
COPY schema.sql ./
COPY scripts ./scripts
USER covenant
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8787/health || exit 1
CMD ["node", "index.js"]
