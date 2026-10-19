# Dockerfile — T2.1: portal container (multi-stage, non-root, Node 22-alpine)
# Build (context = repository root):
#   docker build -t simal-portal:rc -f apps/portal/Dockerfile .
# Run:    see infra/docker/compose.yml (portal + PostgreSQL + nginx edge)
# Credentials enter ONLY via environment (-e / --env-file) — never baked in.
#
# deploy-audit:
#  - the portal process also runs the SSG worker, which builds apps/site with npm + Astro on
#    every CMS publish. The image held apps/portal only, so every publish in a container
#    failed. It now carries apps/site and the workspace dependencies (root lockfile).
#  - it listened on the config defaults (127.0.0.1:3000) while EXPOSE and HEALTHCHECK used
#    8090: unreachable and always unhealthy. HOST/PORT are set.
#  - it COPYed data/watchlist.csv, git-ignored, so a build from a clean checkout failed. The
#    sanctions/PEP list is operator data: mount it at /app/data/watchlist.csv.
#  - Dockerfile.dockerignore (next to this file) whitelists the build context: no .env, no
#    data, no node_modules from the host.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/portal/package.json apps/portal/
COPY apps/site/package.json apps/site/
RUN npm ci --omit=dev --no-audit --no-fund
COPY packages/shared packages/shared
COPY apps/portal/src apps/portal/src
COPY apps/portal/public apps/portal/public
COPY apps/site apps/site
RUN mkdir -p /app/data /srv/site && chown -R node:node /app /srv/site

FROM node:22-alpine
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8090 \
    DATA_DIR=/app/data \
    WATCHLIST_CSV=/app/data/watchlist.csv \
    SITE_DIR=/app/apps/site \
    DEPLOY_DIR=/srv/site \
    ASTRO_TELEMETRY_DISABLED=1
# non-root runtime user (node, uid 1000 — present in the base image)
USER node
COPY --from=build --chown=node:node /app /app
COPY --from=build --chown=node:node /srv/site /srv/site
WORKDIR /app/apps/portal
# writable state: portal data, and the docroot the SSG worker publishes to (shared with nginx)
VOLUME ["/app/data", "/srv/site"]
EXPOSE 8090
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8090/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
