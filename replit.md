# Real Estate Auction Hub

A professional-grade auction intelligence platform for discovering, tracking, and analyzing tax-lien real estate auctions. Crawls bid4assets.com, downloads county spreadsheets, tracks excess proceeds, and provides live auction monitoring.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/auction-hub run dev` — run the frontend (managed by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TanStack Query, Wouter, shadcn/ui, Tailwind CSS
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — DB tables: auctions, properties, spreadsheets, excess_proceeds, monitoring
- `artifacts/api-server/src/routes/` — Express route handlers (auth, auctions, properties, spreadsheets, spider, monitoring, excess-proceeds)
- `artifacts/api-server/src/lib/spider.ts` — Web crawler state machine (pre/live/post modes)
- `artifacts/api-server/src/lib/auth.ts` — bid4assets.com login logic
- `artifacts/auction-hub/src/pages/` — React pages (dashboard, auctions, properties, excess-proceeds, spreadsheets, spider, settings)

## Architecture decisions

- **In-memory spider state**: The spider runs in a background async loop with an AbortController. State is kept in-memory (not DB) — fast to query but resets on server restart. A future revision could persist spider runs to a DB table.
- **Numeric columns stored as TEXT in Postgres via Drizzle**: Drizzle `numeric()` returns strings from PG; all route handlers parse them with `parseFloat()` before sending JSON.
- **bid4assets scraping**: Uses native `fetch` with graceful fallback to a simulated crawl mode when the site is unreachable (sandbox/offline). Real production use should add rotating user agents and respect rate limits.
- **Spreadsheet import**: Download + import is async (202 response); status polling via GET /api/spreadsheets/:id. Full xlsx parsing stub ready to extend.
- **Auth is session-scoped**: Login state lives in-memory on the server. Credentials are not stored in the DB.

## Product

- **Dashboard** — Mission Control overview: live auction counts by tier, unclaimed excess proceeds totals, spider status, active auction feed
- **Auction Search** — Equalizer-board filter UI with rotary knobs for bid ranges, days remaining, state/type selectors. Grid of auction cards with live bid data.
- **Auction Detail** — Full property info, live countdown, bid history, start/stop monitoring, outbid alerts
- **Properties Database** — Searchable table of all imported spreadsheet records (pre and post auction)
- **Excess Proceeds Tracker** — Post-auction records with unclaimed amounts highlighted, sortable by county/state/amount
- **Spreadsheet Manager** — Download and track pre/post-auction county spreadsheets by month
- **Spider Control** — Three-panel control for pre-auction, live, and post-auction crawlers with radar animation
- **Settings** — bid4assets.com login form

## User preferences

_Populate as you build._

## Gotchas

- After any `lib/*` schema change, run `pnpm run typecheck:libs` before checking artifact packages or the API server typecheck will fail with "no exported member" errors (stale declarations).
- After any OpenAPI spec change, re-run `pnpm --filter @workspace/api-spec run codegen` before modifying routes or the frontend.
- Spider operates in "demo simulation mode" when bid4assets.com is unreachable — pages scanned and auctions found are simulated.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
