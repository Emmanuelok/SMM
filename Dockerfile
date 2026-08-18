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

# Everything, then install.
#
# This deliberately does NOT hand-list each workspace's package.json to get a
# cacheable dependency layer. That list has to be edited every time a package is
# added, and when it is forgotten the build does not fail — npm still creates
# the workspace symlink from the lockfile, so the tree looks right and only a
# missing *external* dependency of the forgotten package shows up, much later
# and much less clearly. A build that is correct by construction beats one that
# is thirty seconds faster and silently wrong.
COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./
COPY packages/ packages/
COPY apps/ apps/

# The cache mount is what pays for the above: npm's download cache survives
# across builds even when this layer is invalidated by a source edit, so a
# rebuild re-links rather than re-downloads.
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

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
