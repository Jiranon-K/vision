<div align="center">

# Vision

**Refracting ideas into digital reality.**

A modern landing page, blog, and dashboard built with Next.js 16, React 19, and a dedicated Express + MongoDB API.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Bun](https://img.shields.io/badge/Bun-1.x-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

</div>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Marketing pages** — Home, Pricing (with billing toggle), and Services
- **Blog engine** — Markdown rendering with `react-markdown`, featured posts, newsletter CTA
- **Dashboard** — Analytics overview, post management (CRUD), filterable posts table
- **Markdown editor** — Split-pane editor with live preview and toolbar
- **Animation system** — Anime.js 4 via a shared `AnimationProvider` context
- **Auth-ready API** — JWT auth, bcrypt password hashing, rate limiting, Zod validation
- **Production-ready** — Standalone Next.js output, multi-stage Docker build, non-root runtime

## Tech Stack

### Frontend

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16.1.6 (App Router) |
| UI | React 19.2.3 + TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Animation | Anime.js 4 |
| Markdown | react-markdown |
| Toasts | sonner |
| Fonts | Space Grotesk, Geist Mono (`next/font/google`) |
| Package Manager | Bun |

### Backend (`server/`)

| Layer | Technology |
| --- | --- |
| Runtime | Node.js / Bun |
| Framework | Express 5 |
| Database | MongoDB + Mongoose 8 |
| Auth | JWT (`jsonwebtoken`) + bcryptjs |
| Validation | Zod |
| Security | express-rate-limit, CORS, cookie-parser |
| Dev Runner | tsx (watch mode) |

## Project Structure

```text
vision/
├── app/                    # Next.js App Router (pages, layouts)
│   ├── blog/               # Blog listing
│   ├── dashboard/          # Dashboard + posts management
│   ├── pricing/            # Pricing page
│   ├── services/           # Services page
│   ├── layout.tsx          # Root layout (fonts, AnimationProvider)
│   └── page.tsx            # Home page
├── components/             # React components (feature-co-located)
│   ├── Home/               # Header, CTA, Services sections
│   ├── blog/               # BlogCard, FeaturedCard, NewsletterCta
│   ├── dashboard/          # Stats, charts, posts table, editor
│   ├── pricing/            # Hero with billing toggle
│   ├── services/           # Hero, Process, Specialization
│   ├── ui/                 # Reusable primitives (button, card, input)
│   ├── data/               # Static data per feature
│   └── AnimationProvider.tsx
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and schemas
├── types/types.ts          # Shared TypeScript interfaces
├── public/                 # Static assets
├── middleware.ts           # Next.js middleware
├── server/                 # Express + MongoDB API
│   └── src/
│       ├── config/db.ts    # MongoDB connection
│       ├── models/         # Mongoose models (Post, User, Analytics)
│       ├── routes/         # auth, posts, analytics, settings
│       ├── controllers/    # Route controllers
│       ├── middleware/     # JWT auth middleware
│       └── index.ts        # Express entry
└── Dockerfile              # Multi-stage production build
```

## Prerequisites

- [**Bun**](https://bun.sh/) `1.x` (frontend + backend package manager)
- [**Node.js**](https://nodejs.org/) `22.x` (runtime for the production Docker image)
- [**MongoDB**](https://www.mongodb.com/) `6.x+` (local instance or Atlas cluster)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/vision.git
cd vision
```

### 2. Install dependencies

```bash
# Frontend
bun install

# Backend
cd server && bun install && cd ..
```

### 3. Configure environment variables

Create `.env.local` (frontend) and `server/.env` (backend). See [Environment Variables](#environment-variables) below.

### 4. Run the development servers

In two terminals:

```bash
# Terminal 1 — frontend (http://localhost:3000)
bun dev

# Terminal 2 — backend (http://localhost:3001)
cd server && bun dev
```

## Environment Variables

### Frontend — `.env.local`

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | yes | Base URL of the backend API (e.g. `http://localhost:3001`) |

### Backend — `server/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | no | API port (default `3001`) |
| `MONGODB_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | no | Token TTL (default `7d`) |
| `CORS_ORIGIN` | yes | Allowed origin for CORS (e.g. `http://localhost:3000`) |
| `NODE_ENV` | no | `development` \| `production` |

> Never commit `.env` or `.env.local`. Both are gitignored.

## Available Scripts

### Frontend

| Command | Description |
| --- | --- |
| `bun dev` | Start the Next.js dev server on `:3000` |
| `bun build` | Production build (standalone output) |
| `bun start` | Start the production server |
| `bun lint` | Run ESLint |
| `bun run cleanup` | Strip comments from source files (`scripts/remove-comments.mjs`) |

### Backend (`server/`)

| Command | Description |
| --- | --- |
| `bun dev` | Start the API with `tsx watch` on `:3001` |
| `bun build` | Compile TypeScript to `dist/` |
| `bun start` | Run the compiled production build |

## API Reference

Base URL: `http://localhost:3001`. Protected routes require an `Authorization: Bearer <token>` header.

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/register` | — | Register a new user |
| POST | `/login` | — | Authenticate and receive a JWT |
| POST | `/logout` | — | Log out |
| GET | `/me` | JWT | Return the current user |

### Posts — `/api/posts`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/` | — | List posts (`category`, `status`, `search` filters) |
| GET | `/:id` | — | Get a single post |
| POST | `/` | JWT | Create a post |
| PUT | `/:id` | JWT | Update a post |
| DELETE | `/:id` | JWT | Delete a post |

### Analytics — `/api/analytics`

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | Aggregate stats (views, posts, subscribers, engagement) |
| GET | `/views` | Weekly view counts |

### Settings — `/api/settings`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/profile` | JWT | Get user profile |
| PUT | `/profile` | JWT | Update user profile |
| PUT | `/password` | JWT | Change password |
| GET | `/notifications` | JWT | Get notification preferences |
| PUT | `/notifications` | JWT | Update notification preferences |

## Deployment

### Docker (frontend)

The provided `Dockerfile` is a three-stage build (Bun deps → Bun build → Node 22 Alpine runtime) that produces a minimal, non-root image using Next.js standalone output.

```bash
# Build the image
docker build -t vision:latest .

# Run the container (exposes port 6421)
docker run --rm -p 6421:6421 \
  -e NEXT_PUBLIC_API_URL=https://api.example.com \
  vision:latest
```

### Manual deployment

```bash
bun install --frozen-lockfile
bun run build
bun start
```

The backend can be deployed similarly from `server/` after `bun run build`.

## Contributing

1. Fork the repository and create a feature branch: `git checkout -b feat/your-feature`
2. Follow the existing code style and run `bun lint` before committing
3. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
4. Open a pull request describing the change, motivation, and testing notes

## License

Released under the [MIT License](LICENSE).

<div align="right">
<sub>Vision — v0.1.0</sub>
</div>
