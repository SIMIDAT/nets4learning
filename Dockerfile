# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22
ARG PNPM_VERSION=12.6.0
ARG NGINX_VERSION=1.27

# ---------- Stage 1: Builder ----------
FROM node:${NODE_VERSION}-alpine AS builder

ARG PNPM_VERSION
ENV CI=true

RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /app

# pnpm-workspace.yaml contiene las overrides: debe estar antes del install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN NODE_OPTIONS="--max-old-space-size=8192" pnpm run build

# ---------- Stage 2: Production ----------
FROM nginxinc/nginx-unprivileged:${NGINX_VERSION}-alpine AS production

COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html/n4l/
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/n4l/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]