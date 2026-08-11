# 06 — The server says what it is doing

**Status:** ready-for-agent

## Problem Statement

When something goes wrong in production, the only evidence is free-form text on
standard output. Lines are written by whoever felt like writing one, in whatever
format seemed reasonable at the time. Nothing correlates a line to a request, a
route, a Creator or a moment. Nothing can be filtered, counted or alerted on,
because nothing is a field — it is all prose.

The health check is worse than absent, because it is confidently wrong. It
answers that the server is healthy as long as the process is running, which is
exactly the situation where it is least informative. The database can be
unreachable, every request can be failing, and the health check will still say
the service is fine. An orchestrator reading it will keep routing traffic to a
server that cannot serve.

The startup order compounds this: the server begins accepting requests before it
attempts to connect to the database, so there is a window during which it is
listening and cannot answer. If the connection then fails, the process exits
immediately with no retry, so a database that is a few seconds late starting
takes the whole service down.

## Solution

The server produces logs that can be read by a machine, and a health check that
can be trusted by one.

- One structured logger, emitting JSON with a level, a timestamp and named
  fields.
- Every request logged once on completion with method, route, status, duration
  and a correlation identifier, and that identifier available to anything logging
  during the request.
- Secrets, tokens, passwords and cookies never appear in a log line.
- Liveness and readiness are separate questions with separate answers. Liveness
  says the process is running. Readiness says the database is connected and the
  server can actually serve.
- The server connects to the database before it accepts traffic, retries a
  failed connection with backoff instead of exiting, and reports itself unready
  while it is trying.

## User Stories

1. As an operator, I want every log line to be structured with named fields, so that I can filter and count rather than grep prose.
2. As an operator, I want every request logged once on completion, so that traffic and error rates are derivable from the log alone.
3. As an operator, I want a correlation identifier shared by a request's log lines and its failure response, so that a Creator's report leads directly to the exact request.
4. As an operator, I want request duration recorded, so that a slow route is visible before a Creator complains about it.
5. As an operator, I want log level configurable per environment, so that production is not drowned in debug output and development is not starved of it.
6. As a security reviewer, I want passwords, tokens, cookies and authorization headers redacted from logs, so that the log is not a credential store.
7. As an operator, I want a readiness check that reports unready when the database is unreachable, so that traffic is not routed to a server that cannot serve it.
8. As an operator, I want a liveness check that stays simple and separate, so that a database outage does not cause the orchestrator to restart healthy processes in a loop.
9. As an operator, I want the server to connect to the database before accepting requests, so that there is no window in which it is listening and useless.
10. As an operator, I want a failed database connection retried with backoff, so that a database that starts a few seconds late does not take the service down.
11. As an operator, I want the server to report the outcome of each connection attempt, so that a slow start is distinguishable from a wrong connection string.
12. As a Creator, I want a correlation identifier I can quote when I report a problem, so that support can find what happened to me specifically.
13. As a maintainer, I want the standard-output writes across the server replaced by the logger, so that there is one way to say something happened.
14. As a maintainer, I want logs to go to standard output as JSON rather than to files, so that the platform decides where they are stored.
15. As a maintainer, I want the health endpoints excluded from request logging, so that a probe every few seconds does not become the bulk of the log.

## Implementation Decisions

- **One logger, created once and passed to what needs it**, rather than imported
  ad hoc. Modules that log receive a logger; they do not reach for a global. That
  is what makes a test able to observe logging without capturing process output.
- **JSON to standard output, one line per event.** No file transport, no
  rotation, no shipping configured in the application. The runtime platform owns
  where logs go, and an application that writes files is harder to containerise,
  not easier.
- **Request logging is one line on completion, not one on start and one on end.**
  Two lines per request doubles volume to record something the completion line
  already implies.
- **The correlation identifier is generated at the edge and honoured from an
  upstream proxy where one supplies it**, and it is the same identifier the
  failure response returns. This ticket and the API-edge ticket share it; the
  edge ticket owns generating it, this one owns putting it in the log.
- **Redaction is configured on the logger, not remembered at each call site.** A
  policy applied at the logger cannot be forgotten by the next person to add a
  line.
- **Liveness and readiness are separate endpoints.** Liveness answers only that
  the process is up. Readiness answers whether the database connection is
  established. Blending them causes an orchestrator to kill processes during a
  database outage, which turns a recoverable dependency failure into an outage of
  its own.
- **The existing health path keeps working and reports liveness**, so nothing
  currently probing it breaks.
- **Startup connects first, then listens.** A failed attempt retries with
  exponential backoff and a cap rather than exiting; the process exits only after
  the cap is exhausted, and says why. During retries the server is not listening,
  so there is no unready-but-serving state to reason about.
- **Log level and log format come from configuration**, with production
  defaulting to a level that is useful and quiet, and development to something
  readable.

## Testing Decisions

Logging is a poor thing to assert at the HTTP seam: a test that pins log text
pins the implementation and breaks on every reword. The testable parts are the
endpoints and the redaction policy, and those are worth covering; the rest is
verified by reading a real log line during implementation.

- **Seam:** the HTTP API against the running Express app for the health
  endpoints. For redaction, the logger is exercised directly with a capturing
  destination — a narrow internal seam, private to the module and its tests.
- **Prior art:** the existing integration suites for the HTTP seam; the excerpt
  suggestion tests for injecting a substitute at a seam rather than mocking a
  module.
- **Cases:**
  - Liveness answers healthy while the process is running.
  - Readiness answers ready when the database is connected.
  - Readiness answers unready, with a non-success status, when the database is
    disconnected.
  - The liveness answer does not become unhealthy when the database is
    disconnected.
  - A failure response's correlation identifier is a well-formed value, and the
    same request's log line carries it — asserted through the capturing
    destination rather than by parsing process output.
  - A log call carrying a password, a token, an authorization header and a
    cookie emits none of those values.
  - Health endpoint requests produce no request log line.
- **Verified by observation, not asserted:** that a real run emits parseable JSON
  and that a failed database connection retries before exiting.

## Out of Scope

- Metrics, tracing and any exporter for them.
- An error-tracking service integration.
- Alerting rules and dashboards.
- Frontend logging.
- Audit logging of Creator actions as a product feature.

## Further Notes

This ticket depends on the API-edge ticket: an unhandled failure only becomes a
log line if something catches it in one place. Implementing this first would mean
adding a logger to fourteen catch blocks that the other ticket then deletes.

The readiness endpoint is what makes the container ticket's health configuration
meaningful, and the correlation identifier is what makes the API edge's failure
response actionable. The three are best done in sequence: edge, then this, then
the container.
