# 08 — The whole platform ships as images, not just half of it

**Status:** ready-for-agent

## Problem Statement

The repository containerises the frontend carefully — multi-stage build,
lockfile install, standalone output, a non-root user — and does nothing at all
for the server. There is no image for the API, no composition that brings the
two up together, and no database in either.

So the two deployables have two entirely different stories. One is a reproducible
image; the other is "install a runtime, install dependencies, set some
environment variables, and hope the machine matches". The deployment
documentation describes the manual path because the manual path is all there is.

Getting started has the same asymmetry. A new contributor must install and run
MongoDB themselves at a specific address before anything works, which is a
prerequisite documented in the README rather than something the repository can
provide.

And the frontend image is built from a context that includes everything not
explicitly excluded, so build inputs are whatever happens to be in the working
directory.

## Solution

Both deployables ship as images, and the repository can bring the whole platform
up with one command.

- The server gets an image built the same way the frontend's is: dependencies
  installed from the committed lockfile, production dependencies only in the
  final stage, a non-root user, and a health configuration that uses the
  readiness endpoint.
- A composition brings up the database, the shared rate-limit store, the API and
  the frontend, wired together, with the API waiting for the database to be
  ready.
- The composition is the documented way to get a working environment, and the
  README's manual path remains for those who want it.
- Build contexts are trimmed so an image contains what it needs and nothing else.

## User Stories

1. As an operator, I want an image for the API, so that deploying it is the same kind of action as deploying the frontend.
2. As an operator, I want the API image to run as a non-root user, so that a compromise inside the container is not a compromise of the host.
3. As an operator, I want the API image to declare a health configuration using readiness, so that the platform knows when the container can serve.
4. As an operator, I want the API image to contain production dependencies only, so that development tooling is not shipped to production.
5. As an operator, I want images built from the committed lockfile with no resolution allowed, so that what runs is what the repository declares.
6. As an operator, I want the API to wait for the database before accepting traffic, so that a cold start does not produce a burst of failures.
7. As a developer, I want one command to bring up the database, the API and the frontend, so that a first run does not require installing a database by hand.
8. As a developer, I want the composition to include the shared rate-limit store, so that I can exercise the shared-store path locally without it becoming a prerequisite.
9. As a developer, I want the composition to seed no data and hold no secrets, so that it is safe to run and safe to commit.
10. As a developer, I want a documented way to point the composed frontend at the composed API, so that the two talk to each other without manual configuration.
11. As a developer, I want to keep running the two applications directly with the existing scripts, so that the composition is an option rather than a new requirement.
12. As an operator, I want image builds to exclude source control history, dependencies, build output and local environment files, so that build inputs are deliberate and images stay small.
13. As an operator, I want every configuration value supplied as an environment variable at run time, so that one image serves every environment.
14. As an operator, I want the deployment documentation to describe the container path, so that the documented path and the supported path are the same path.
15. As a maintainer, I want no secret baked into an image, so that an image is safe to store in a registry.

## Implementation Decisions

- **The server image mirrors the frontend image's structure**, because the
  frontend image is already right: separate dependency, build and runtime stages,
  a frozen lockfile install, and a non-root user in the final stage. Consistency
  here is worth more than optimising each independently.
- **The final stage installs production dependencies only.** The build stage may
  need development dependencies to compile; the runtime stage must not carry
  them.
- **The image's health configuration points at readiness**, not liveness and not
  a root path. This is the reason the observability ticket comes first: without a
  readiness endpoint the health configuration would be decorative.
- **Startup ordering is expressed as a dependency on the database being
  healthy**, not as a sleep. The server's own connect-then-listen behaviour makes
  this a belt-and-braces measure rather than the only thing holding it together.
- **The composition is for development and evaluation, not production.** It runs
  the database and the store as containers with a named volume for the database.
  A production deployment is expected to use managed services, and the deployment
  documentation says so rather than implying the composition is a production
  topology.
- **No secrets in the composition and no seeded data.** It reads from example
  environment files and generates development-only values. A composition that
  contains a working credential is a composition someone will copy into
  production.
- **Ports and service names are fixed and documented**, so the frontend's
  configured API address works without editing.
- **Each image gets its own build-context exclusions**, covering source control,
  installed dependencies, build output, local environment files, test output and
  documentation images.
- **Nothing about the existing development scripts changes.** Running the two
  applications directly stays the fast inner loop.

## Testing Decisions

Containers are verified by building and running them. Unit tests here would
assert the content of a build file, which is a restatement rather than a check.

- **Seam:** the running composition, probed over HTTP.
- **Prior art:** none in the repository — this is the first containerised
  verification. The pipeline ticket owns whether this runs in continuous
  integration; this ticket only requires it to be demonstrable.
- **Cases, demonstrated once during implementation and recorded in the
  documentation:**
  - The API image builds from a clean checkout.
  - The composition brings up every service and the API reports ready.
  - The composed frontend can reach the composed API: a Reader can load the blog
    and a Creator can register and sign in.
  - The API container runs as a non-root user.
  - The API container's health configuration reports healthy only once the
    database is connected.
  - Stopping the database makes the API report unready without the container
    exiting.
  - No image contains a source-control directory, installed development
    dependencies, or a local environment file.

## Out of Scope

- Choosing a hosting platform or writing deployment manifests for one.
- Continuous delivery, image publishing, tagging and registry configuration.
- Production database and store provisioning.
- Backups, restore procedure and disaster recovery.
- Horizontal scaling configuration.
- Any change to application code beyond what the images need.

## Further Notes

This ticket depends on the observability ticket for the readiness endpoint and
the connect-before-listen behaviour, and pairs with the rate-limit ticket by
providing the shared store locally. Implemented after both, it is mostly
assembly; implemented before, it needs placeholders that then get rewritten.

The frontend image's existing port and host configuration should be left alone
unless the composition genuinely conflicts with it. It is currently correct and
changing it would break whatever is already deployed from it.
