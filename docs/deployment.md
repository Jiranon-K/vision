# Deployment

## The whole platform — Docker Compose

`docker-compose.yml` brings up MongoDB, Redis, the API and the frontend, wired
together, with the API waiting for the database to report healthy.

```bash
docker compose up --build
```

The frontend comes up on `http://localhost:6421` and the API on
`http://localhost:3001`.

This is for development and evaluation, **not a production topology**. It runs
the database and the rate limit store as containers and carries development-only
secrets. A production deploy is expected to use managed services for both and to
supply every value below at run time.

## Backend — Docker

`server/Dockerfile` mirrors the frontend's: Bun deps → Bun build → production
dependencies only → Node 22 Alpine runtime, non-root, listening on `3001`. Its
health check reads `/api/health/ready`, which reports healthy only once the
database is connected.

```bash
docker build -t vision-api:latest ./server
```

```bash
docker run --rm -p 3001:3001 \
  -e MONGODB_URI=mongodb://mongo.example.com:27017/vision \
  -e RATE_LIMIT_REDIS_URL=redis://redis.example.com:6379 \
  -e JWT_SECRET=... \
  -e JWT_REFRESH_SECRET=... \
  -e FRONTEND_URL=https://example.com \
  vision-api:latest
```

`RATE_LIMIT_REDIS_URL` is **required** when `NODE_ENV=production`: without it
every rate limit is per process, so the configured limit is multiplied by the
instance count and reset by every deploy. The server refuses to start rather
than warn.

`JWT_REFRESH_SECRET` is required and must differ from `JWT_SECRET`.

## Frontend — Docker

The `Dockerfile` is a three-stage build (Bun deps → Bun build → Node 22 Alpine
runtime) producing a minimal, non-root image from Next.js standalone output. It
listens on `6421`.

```bash
docker build -t vision:latest .
```

```bash
docker run --rm -p 6421:6421 \
  -e NEXT_PUBLIC_API_URL=https://api.example.com \
  -e NEXT_PUBLIC_SITE_URL=https://example.com \
  vision:latest
```

`NEXT_PUBLIC_SITE_URL` must be the real domain — every canonical URL, Open Graph
tag, `sitemap.xml` entry and `robots.txt` line is built from it.

## Frontend — manual

```bash
bun install --frozen-lockfile
bun run build
bun start
```

## Backend

```bash
cd server
bun install --frozen-lockfile
bun run build
bun start
```

Set `FRONTEND_URL` to the deployed frontend origin: it is both the allowed CORS
origin and the base of every link the API puts in an email. See
[configuration.md](configuration.md#backend--serverenv) for the full variable list.
