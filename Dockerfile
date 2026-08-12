# Shared image for every service.
#
# One image rather than one per service, because they share a workspace and
# almost all of their dependencies. Railway then runs the same artifact with a
# different start command, which means the API and the worker in an environment
# are provably the same build — a class of "works in one service, fails in the
# other" bug that simply cannot occur.

# --- build ------------------------------------------------------------------
FROM node:22-slim AS build

WORKDIR /app

# Manifests first, so a dependency install is only redone when a manifest
# changes rather than on every source edit.
COPY package.json package-lock.json ./
COPY packages/shared/package.json    packages/shared/
COPY packages/vault/package.json     packages/vault/
COPY packages/db/package.json        packages/db/
COPY packages/adapters/package.json  packages/adapters/
COPY packages/scheduler/package.json packages/scheduler/
COPY apps/api/package.json           apps/api/

RUN npm ci --no-audit --no-fund

COPY tsconfig.base.json tsconfig.json ./
COPY packages/ packages/
COPY apps/ apps/

RUN npx tsc --build

# Drop dev dependencies from the tree that ships. TypeScript alone is most of
# the installed weight and nothing needs it at runtime.
RUN npm prune --omit=dev

# --- runtime ----------------------------------------------------------------
FROM node:22-slim AS runtime

# Fail fast and loudly rather than degrading quietly.
ENV NODE_ENV=production
# Keeps V8's heap under the container limit; without it Node sizes the heap from
# the host's memory and is OOM-killed on a small instance with no useful error.
ENV NODE_OPTIONS=--max-old-space-size=384

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps ./apps

# The node image ships a non-root `node` user. Running as root in a container
# that talks to the public internet buys nothing and costs a great deal if a
# dependency is compromised.
USER node

EXPOSE 3000

# Overridden per service in railway.json.
CMD ["node", "apps/api/dist/main.js"]
