# Deployment

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
