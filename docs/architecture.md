# Architecture

Two deployables that share nothing but an HTTP contract.

- **Frontend** — a Next.js App Router app. Marketing pages and the blog render on
  the server and fetch the API directly; the Smart Creator Hub under `/dashboard`
  is client-rendered and fetches with credentials.
- **Backend** — an Express API over MongoDB, in `server/`. It owns Posts,
  Creators, sessions and the analytics documents.

Sessions are httpOnly cookies. `middleware.ts` gates `/dashboard/*` on cookie
presence for the redirect, and `hooks/useAuth.ts` confirms with `GET /api/auth/me`
once the page mounts — the cookie check is a fast path, not the authorization.

The vocabulary the code is written in — Post, Creator, Draft, Published, View,
Category — is defined in [CONTEXT.md](../CONTEXT.md). Read it before naming
anything new.

## Tech stack

### Frontend

| Layer     | Technology                                        |
| --------- | ------------------------------------------------- |
| Framework | Next.js 16 (App Router, standalone output)        |
| UI        | React 19 + TypeScript 5                           |
| Styling   | Tailwind CSS 4                                    |
| Animation | Anime.js 4, via a shared `AnimationProvider`      |
| Markdown  | react-markdown, remark-gfm, rehype-slug/highlight |
| Toasts    | sonner                                            |
| Fonts     | Space Grotesk, Geist Mono (`next/font/google`)    |
| E2E       | Playwright                                        |

### Backend (`server/`)

| Layer      | Technology                              |
| ---------- | --------------------------------------- |
| Runtime    | Node.js / Bun                           |
| Framework  | Express 5                               |
| Database   | MongoDB + Mongoose 8                    |
| Auth       | JWT (`jsonwebtoken`) + bcryptjs         |
| Validation | Zod                                     |
| Email      | Resend + react-email                    |
| Security   | express-rate-limit, CORS, cookie-parser |
| Tests      | Vitest + mongodb-memory-server          |

## Repository layout

```text
vision/
├── app/                 # Next.js App Router — marketing, blog, auth, dashboard
├── components/          # Feature-co-located React components (+ ui/ primitives)
├── hooks/               # useAuth, useDashboardData, useAutosaveDraft, …
├── lib/                 # Shared utilities, the Post wire contract, constants
├── types/               # Shared TypeScript interfaces
├── middleware.ts        # Cookie gate for /dashboard/*
├── public/              # Static assets
├── server/src/          # Express API: routes, controllers, models, schemas, emails
├── e2e/                 # Playwright suite, fixtures and screenshot specs
├── harness/             # Agent harness (own package.json and tests)
├── docs/                # This documentation, ADRs, tickets, images
└── Dockerfile           # Multi-stage production build for the frontend
```

## Screenshots

The four images in the README are generated, not hand-captured:

```bash
bun run screenshots
```

`e2e/readme-shots.spec.ts` seeds its own demo Creator and Posts into the isolated
E2E database, then writes `docs/images/*.png`. It runs in its own Playwright
project so `test:e2e` and CI never rewrite the committed PNGs.

Regenerate them deliberately, when the UI has actually changed — every run
produces new binaries that live in Git history forever.
