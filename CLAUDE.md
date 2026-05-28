# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vision is a Next.js 16.1.6 landing page and dashboard application with React 19. It serves as a frontend for a service platform featuring blog, dashboard (with post management), pricing, and services pages.

## Tech Stack

### Frontend

- **Framework**: Next.js 16.1.6 (App Router)
- **React**: 19.2.3
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Package Manager**: Bun (bun.lock)
- **Animation**: Anime.js with AnimationProvider wrapper
- **Markdown**: react-markdown for rendering
- **Fonts**: Space Grotesk and Geist Mono via next/font/google

### Backend (server/)

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Language**: TypeScript

## Commands

### Frontend

```bash
bun dev          # Start development server (http://localhost:3000)
bun build        # Production build
bun start        # Start production server
bun lint         # Run ESLint
```

### Backend (server/)

```bash
cd server
bun install      # Install dependencies
bun dev          # Start API server (http://localhost:3001)
bun build        # Build for production
```

## Architecture

### Directory Structure

```
app/                    # Next.js App Router pages
  blog/                 # Blog listing page
  dashboard/            # Dashboard (posts management, analytics)
    posts/              # Posts list page
      new/              # New post editor page
  pricing/              # Pricing page
  services/             # Services landing page
  layout.tsx            # Root layout with fonts and AnimationProvider
  page.tsx              # Home page

components/             # React components
  Home/                 # Home page sections (Header, Ctablock, Services)
  blog/                 # Blog components (BlogCard, FeaturedCard, NewsletterCta)
  dashboard/            # Dashboard components
    editor/             # Markdown editor components (MarkdownEditor, Preview, Toolbar)
    posts/              # Post management components (FilterBar, PostsTable, PostRow)
  pricing/              # Pricing page components (Hero with billing toggle)
  services/              # Services page components (Hero, Process, Specialization)
  ui/                    # Reusable UI primitives (button, card, input)
  data/                  # Static data files for each feature
  AnimationProvider.tsx  # Anime.js context provider

types/
  types.ts               # Shared TypeScript interfaces (BlogPost, DashboardStat, etc.)

server/                  # Express.js Backend API
  src/
    config/db.ts         # MongoDB connection
    models/              # Mongoose models (Post, User, Analytics)
    routes/              # API routes (auth, posts, analytics, settings)
    controllers/         # Route controllers
    middleware/auth.ts    # JWT authentication middleware
    index.ts             # Express app entry point
  package.json
  tsconfig.json
```

### Path Aliases

`@/*` maps to the project root, enabling imports like `@/components/dashboard`.

### Key Patterns

- **Components**: Feature-specific components are co-located in their feature folder under `components/`
- **Data**: Static data lives in `components/data/*.ts` files, co-located with their components
- **Dashboard**: Uses a sidebar layout with stats, charts, and posts management
- **Markdown**: Blog posts and editor use react-markdown for rendering

## API Endpoints

Backend API runs on port 3001. All protected routes require `Authorization: Bearer <token>` header.

### Authentication (`/api/auth`)

| Method | Endpoint             | Description                  |
| ------ | -------------------- | ---------------------------- |
| POST   | `/api/auth/register` | Register new user            |
| POST   | `/api/auth/login`    | Login, returns JWT           |
| POST   | `/api/auth/logout`   | Logout                       |
| GET    | `/api/auth/me`       | Get current user (protected) |

### Posts (`/api/posts`)

| Method | Endpoint         | Auth | Description                                         |
| ------ | ---------------- | ---- | --------------------------------------------------- |
| GET    | `/api/posts`     | -    | List posts (with filters: category, status, search) |
| GET    | `/api/posts/:id` | -    | Get single post                                     |
| POST   | `/api/posts`     | JWT  | Create post                                         |
| PUT    | `/api/posts/:id` | JWT  | Update post                                         |
| DELETE | `/api/posts/:id` | JWT  | Delete post                                         |

### Analytics (`/api/analytics`)

| Method | Endpoint               | Description                                       |
| ------ | ---------------------- | ------------------------------------------------- |
| GET    | `/api/analytics`       | Get stats (views, posts, subscribers, engagement) |
| GET    | `/api/analytics/views` | Get weekly views data                             |

### Settings (`/api/settings`)

| Method | Endpoint                      | Auth | Description               |
| ------ | ----------------------------- | ---- | ------------------------- |
| GET    | `/api/settings/profile`       | JWT  | Get user profile          |
| PUT    | `/api/settings/profile`       | JWT  | Update profile            |
| PUT    | `/api/settings/password`      | JWT  | Change password           |
| GET    | `/api/settings/notifications` | JWT  | Get notification prefs    |
| PUT    | `/api/settings/notifications` | JWT  | Update notification prefs |

## Deployment

- **Docker**: Multi-stage build using Bun for dependencies/build, Node 22 Alpine for runtime
- **Output**: Standalone Next.js output
- **Port**: Exposes port 6421 (configured in Dockerfile)
- **Environment**: `NODE_ENV=production`, `NEXT_TELEMETRY_DISABLED=1`

## Installed Skills

The following skills are available for this project:

| Skill                         | Purpose                                  |
| ----------------------------- | ---------------------------------------- |
| `vercel-react-best-practices` | React/Next.js best practices from Vercel |
| `tailwind-design-system`      | Tailwind CSS design system patterns      |
| `multi-stage-dockerfile`      | Multi-stage Dockerfile best practices    |
| `webapp-testing`              | Web app testing patterns                 |

Invoke with: `/vercel-react-best-practices`, `/tailwind-design-system`, `/multi-stage-dockerfile`, `/webapp-testing`

## Git Workflow

Trunk-based development. `main` = source of truth. All changes via short-lived feature branches + PR. See [CONTRIBUTING.md](./CONTRIBUTING.md) for full reference.

### Branching

- `feat/<topic>` — new feature
- `fix/<bug>` — bug fix
- `chore/<task>` — tooling/config
- `docs/<topic>` — docs only
- `refactor/<area>` — refactor
- kebab-case, target merge within 3 days, delete after merge

### Commits

- Conventional Commits format: `<type>(<scope>): <subject>`
- Use `/commit` slash command to generate message from staged diff
- Subject imperative, lowercase, no period, max 72 chars

### Pull Requests

- Use `.github/pull_request_template.md`
- Self-review with `/code-review` before requesting merge
- Squash merge to `main` (linear history)
- Never push to `main` directly

### Pre-commit Hook

- `husky` runs `lint-staged`: `eslint --fix` + `tsc --noEmit` on staged TS/TSX files
- `prettier --write` on JSON/MD/YAML
- Never use `--no-verify` to skip unless emergency (document reason in commit body)

### Useful Commands

- `/commit` — AI-generated Conventional Commit
- `/commit-push-pr` — full flow in one shot
- `/code-review` — review current diff
- `/clean_gone` — cleanup stale local branches
