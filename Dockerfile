# syntax=docker/dockerfile:1.10
# Pollramp production image: SvelteKit (adapter-node) server + offline PWA assets.

ARG NODE_VERSION=22

# Dependencies and the build are platform-independent JavaScript, so they run once on the
# build machine's native platform; only the small runtime stage is per-architecture.
FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=true
RUN corepack enable
WORKDIR /app

# ---- dependencies (cached unless the lockfile changes) ---------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ---- build -------------------------------------------------------------------------
FROM deps AS build
COPY . .
ARG BUILD_NUMBER=dev
ARG GIT_SHA=unknown
ARG SOURCE_DATE_EPOCH
ENV BUILD_NUMBER=${BUILD_NUMBER} GITHUB_SHA=${GIT_SHA} SOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH}
RUN pnpm checklists:validate && pnpm build \
	&& pnpm prune --prod --ignore-scripts

# ---- runtime -----------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runtime
ARG VERSION=dev
ARG BUILD_NUMBER=dev
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.title="Pollramp" \
	org.opencontainers.image.description="Offline-first polling place accessibility surveys" \
	org.opencontainers.image.source="https://github.com/lobojoel2003/Pollramp" \
	org.opencontainers.image.licenses="AGPL-3.0-or-later" \
	org.opencontainers.image.version="${VERSION}" \
	org.opencontainers.image.revision="${GIT_SHA}" \
	io.pollramp.build-number="${BUILD_NUMBER}"

ENV NODE_ENV=production \
	PORT=3000 \
	HOST=0.0.0.0 \
	BODY_SIZE_LIMIT=8M
WORKDIR /app
RUN addgroup -S pollramp && adduser -S -G pollramp pollramp
COPY --from=build --chown=pollramp:pollramp /app/package.json ./
COPY --from=build --chown=pollramp:pollramp /app/node_modules ./node_modules
COPY --from=build --chown=pollramp:pollramp /app/build ./build
COPY --from=build --chown=pollramp:pollramp /app/migrations ./migrations
COPY --from=build --chown=pollramp:pollramp /app/scripts/migrate.js /app/scripts/create-user.js ./scripts/
USER pollramp
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null || exit 1
CMD ["node", "build"]
