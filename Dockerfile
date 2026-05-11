FROM node:24-bookworm AS builder

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/debug/package.json packages/debug/package.json
COPY packages/request/package.json packages/request/package.json
COPY packages/server/package.json packages/server/package.json
COPY packages/test-utils/package.json packages/test-utils/package.json
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:24-bookworm AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/settings.json ./settings.json

RUN pnpm --filter twitter-api-safe-proxy exec playwright install --with-deps chromium

WORKDIR /app/packages/server

EXPOSE 3000

FROM runtime AS proxy

CMD ["node", "dist/server.js"]

FROM runtime AS debug

EXPOSE 3001

CMD ["node", "dist/dashboard/server.js"]
