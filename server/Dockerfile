# Production image for the Covenant sync API (Node + Express).
# Pair with managed Postgres (Railway/Fly/Render) via DATABASE_URL.
# Local Docker Desktop still uses docker-compose.yml (dev trust auth) — not this file.
# Deploy checklist: docs/HOSTED_DEPLOY.md  |  Env template: .env.production.example
#
# Inject at runtime (Railway Variables / fly secrets set) — do not bake secrets into the image:
#   Required:  DATABASE_URL, DATABASE_SSL=1, PUBLIC_URL, CORS_ORIGIN, SESSION_SECRET, TRUST_PROXY=1
#   Recommended: CLIENT_APP_URL
#   Google:    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET [, GOOGLE_REDIRECT_URI]
#   SMTP:      SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM [, SMTP_SECURE]
#   Optional:  PHOTO_STORAGE=s3|r2 + S3_* or R2_* + public base URL
# Health: GET /health   Setup checklist: GET /setup/status
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
