# StreamFlix

A full-stack streaming platform similar to Netflix/Disney+. Users can browse movies and series, watch content with a built-in video player, manage favorites, track watch history, rate and comment on content, and search the catalog. Admins have a dedicated dashboard for content/user management.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/streamflix run dev` — run the frontend (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Clerk auth middleware
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite, Wouter routing, TanStack Query, Tailwind CSS, shadcn/ui
- Auth: Clerk (Replit-managed)
- File uploads: Object Storage (GCS-backed)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — all DB tables (users, categories, content, seasons, episodes, favorites, watch_history, ratings, comments)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all endpoints)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/streamflix/src/pages/` — all frontend pages
- `artifacts/streamflix/src/components/` — shared UI components

## Architecture decisions

- Contract-first API: OpenAPI spec drives all codegen (React Query hooks + Zod schemas)
- Clerk proxy middleware on the API server routes Clerk auth requests through `/clerk`
- No FK from content to categories at DB level (avoids circular issues); join is done in app code using `inArray()`
- `averageRating` is stored as `numeric` in DB and recalculated on each rating submission
- Object storage uses GCS-backed Replit Object Storage; presigned URLs for direct upload
- All routes use `getAuth(req)` from `@clerk/express` for auth; user sync happens on sign-in via `/api/auth/sync`

## Product

- **Landing page**: Hero + feature highlights for signed-out users
- **Browse page**: Featured hero banner + trending content grid with movie posters
- **Content detail**: Full page with backdrop, metadata, season/episode list, favorites toggle, comments, ratings
- **Video player**: Custom HTML5 player with progress tracking, volume/fullscreen controls
- **Search**: Debounced real-time search across title and description
- **Favorites**: Grid of user's saved content
- **Watch history**: History with progress tracking and resume
- **Admin dashboard**: Stats overview, content management, category management, user role management

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing route files, always restart the API server workflow (it builds on start)
- Run `pnpm run typecheck:libs` after changing `lib/*` packages before checking leaf artifacts
- `inArray()` from drizzle-orm must be used instead of raw `ANY($n::int[])` SQL for array IN queries
- The generated `useSearchContent` returns `Content[]` directly (not `{ items: Content[] }`)
- `useRef<NodeJS.Timeout>()` needs an argument in strict TS — use `useRef<NodeJS.Timeout | null>(null)`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for auth setup details
- See the `object-storage` skill for file upload details
