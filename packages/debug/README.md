# twitter-api-safe-debug

Debug UI for Twitter/X web API requests captured through `twitter-api-safe-request`.

```sh
twitter-api-safe-debug
```

Reads settings from `../settings.json` relative to the working directory.

The debug command starts the `twitter-api-safe-proxy` `createApp` server, attaches the `/api/events` SSE endpoint to the same Hono app, and the UI replays captured GraphQL requests by hitting `/i/api/graphql/:queryId/:operationName` directly.

Run the debug API and Vite UI together:

```sh
pnpm --filter twitter-api-safe-debug dev
```

Open `http://localhost:3000`.

In dev mode, the UI runs on port `3000` and proxies `/api/events` plus `/i/api/graphql/*` to the debug API on port `3001`.
