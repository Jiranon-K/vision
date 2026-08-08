# Configuration

## Prerequisites

- [**Bun**](https://bun.sh/) `1.x` — package manager and dev runner for both the frontend and `server/`
- [**Node.js**](https://nodejs.org/) `22.x` — runtime for the production Docker image
- [**MongoDB**](https://www.mongodb.com/) `6.x+` — a local instance or an Atlas cluster
- [**Playwright browsers**](https://playwright.dev/) — only for the E2E suite: `bunx playwright install chromium`

## Environment variables

Copy the examples and fill them in. Both files are gitignored; never commit them.

```bash
cp .env.example .env.local
cp server/.env.example server/.env
```

### Frontend — `.env.local`

| Variable               | Required | Description                                                                                                                                                                    |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`  | yes      | Base URL of the API the frontend fetches from, e.g. `http://localhost:3001`                                                                                                    |
| `NEXT_PUBLIC_SITE_URL` | yes      | Public site origin. Used for canonical URLs, Open Graph tags, `sitemap.xml` and `robots.txt` — **must** be the real domain in production, or every SEO tag points at localhost |
| `NEXT_DIST_DIR`        | no       | Build directory (default `.next`). `next dev` takes an exclusive lock on it, which is why the E2E run sets `.next-e2e`                                                         |

### Backend — `server/.env`

| Variable                       | Required | Description                                                                                                                |
| ------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`                  | yes      | MongoDB connection string                                                                                                  |
| `JWT_SECRET`                   | yes      | Secret used to sign JWTs — 32+ random characters                                                                           |
| `JWT_ACCESS_EXPIRES_IN`        | no       | Access token TTL (default `15m`)                                                                                           |
| `JWT_REFRESH_EXPIRES_IN`       | no       | Refresh token TTL (default `7d`)                                                                                           |
| `JWT_REMEMBER_ME_EXPIRES_IN`   | no       | Refresh token TTL when the Creator ticked "remember me" (default `30d`)                                                    |
| `PORT`                         | no       | API port (default `3001`)                                                                                                  |
| `NODE_ENV`                     | no       | `development` \| `production` \| `test`. Rate limiters are skipped under `test`                                            |
| `FRONTEND_URL`                 | yes      | The allowed CORS origin, and the base of every link the API puts in an email                                               |
| `RESEND_API_KEY`               | yes      | [Resend](https://resend.com) API key — verification and password-reset email                                               |
| `EMAIL_FROM`                   | yes      | Sender address for outgoing email                                                                                          |
| `EMAIL_FROM_NAME`              | no       | Sender display name                                                                                                        |
| `ADMIN_EMAILS`                 | no       | Comma-separated addresses promoted to `admin` on register, self-healed on login                                            |
| `GOOGLE_GENERATIVE_AI_API_KEY` | no       | Google AI Studio API key. When set, Excerpt Suggestions are backed by Gemini                                               |
| `AI_EXCERPT_MODEL`             | no       | Overrides the Gemini model used for Excerpt Suggestions (default `gemini-3.1-flash-lite`)                                  |
| `AI_PROVIDER`                  | no       | Set to `stub` to force a deterministic fake provider for Excerpt Suggestions — Playwright/local use only, never production |
| `AI_SUGGESTION_TIMEOUT_MS`     | no       | How long to wait on a provider before falling back to the derived Excerpt (default `8000`)                                 |

## Scripts

### Root

| Command                                          | Description                                                                                                    |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `bun run dev:all`                                | Frontend on `:3000` and the API on `:3001`, together                                                           |
| `bun dev`                                        | Frontend only                                                                                                  |
| `bun run build`                                  | Production build (standalone output)                                                                           |
| `bun start`                                      | Serve the production build                                                                                     |
| `bun lint`                                       | ESLint                                                                                                         |
| `bun run typecheck`                              | Typecheck the frontend and E2E suite                                                                           |
| `bun run typecheck:server` / `typecheck:harness` | Typecheck `server/` / `harness/`                                                                               |
| `bun run test:server` / `test:harness`           | Unit tests for `server/` / `harness/`                                                                          |
| `bun run test:e2e`                               | Playwright regression suite (`e2e` project)                                                                    |
| `bun run screenshots`                            | Regenerate the README images and the auth evidence stills — see [architecture.md](architecture.md#screenshots) |
| `bun run agent`                                  | Run the agent harness                                                                                          |
| `bun run verify:fast`                            | Typechecks, lint, unit tests                                                                                   |
| `bun run verify:full`                            | `verify:fast` plus the production build and the E2E suite                                                      |

### `server/`

| Command                                          | Description                                                                                                                              |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `bun dev`                                        | API with `tsx watch` on `:3001`                                                                                                          |
| `bun run build` / `bun start`                    | Compile to `dist/` / run the compiled build                                                                                              |
| `bun run test`                                   | Vitest, against `mongodb-memory-server`                                                                                                  |
| `bun run promote-admin <email>`                  | Promote an existing Creator to `admin`                                                                                                   |
| `bun run backfill-owner`                         | Assign `owner` to legacy Posts (needs an admin)                                                                                          |
| `bun run excerpt-suggestion-metrics [--days=30]` | Report the Excerpt Suggestion adoption and kept-unedited thresholds — see [excerpt-suggestion-metrics.md](excerpt-suggestion-metrics.md) |

### `harness/`

| Command             | Description           |
| ------------------- | --------------------- |
| `bun run start`     | Run the harness       |
| `bun run test`      | Harness unit tests    |
| `bun run typecheck` | Typecheck the harness |
