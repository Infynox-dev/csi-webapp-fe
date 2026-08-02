# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-csi-fe,target=/pnpm/store \
    pnpm install --frozen-lockfile
COPY . .

ARG VITE_API_BASE_URL
ARG VITE_SENTRY_DSN
ARG VITE_FARO_URL
ARG VITE_FARO_APP_NAME=csi-webapp-staging
ARG VITE_ENVIRONMENT=staging
ARG VITE_RELEASE
# Sourcemap upload (optional — skip when token unset)
ARG SENTRY_URL=https://bugtracker.infynox.net
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG=urgentry-org
ARG SENTRY_PROJECT=csi-fe-staging

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_FARO_URL=$VITE_FARO_URL \
    VITE_FARO_APP_NAME=$VITE_FARO_APP_NAME \
    VITE_ENVIRONMENT=$VITE_ENVIRONMENT \
    VITE_RELEASE=$VITE_RELEASE

RUN pnpm run build \
 && if [ -n "$SENTRY_AUTH_TOKEN" ] && [ -n "$VITE_SENTRY_DSN" ]; then \
      RELEASE="${VITE_RELEASE:-csi-fe@unknown}"; \
      npx sentry-cli --url "$SENTRY_URL" sourcemaps upload \
        --org "$SENTRY_ORG" \
        --project "$SENTRY_PROJECT" \
        --release "$RELEASE" \
        --auth-token "$SENTRY_AUTH_TOKEN" \
        ./dist \
      && find ./dist -name '*.map' -delete; \
    else \
      echo "Skipping sourcemap upload (SENTRY_AUTH_TOKEN unset)"; \
      find ./dist -name '*.map' -delete; \
    fi

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
