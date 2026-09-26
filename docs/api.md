# API reference

Base URL in development: `http://localhost:3001`.

Authentication is by **httpOnly cookie**. `POST /api/auth/login` sets `access_token`
and `refresh_token`; the browser sends them automatically. An `Authorization: Bearer <token>`
header is accepted as a fallback for non-browser clients.

Routes marked **optional** authenticate when a token is present and fall back to
anonymous otherwise — an anonymous caller sees Published Posts only.

## Health

| Method | Endpoint            | Auth | Description                                                       |
| ------ | ------------------- | ---- | ----------------------------------------------------------------- |
| GET    | `/api/health`       | —    | Liveness: the process is up. Says nothing about the database      |
| GET    | `/api/health/ready` | —    | Readiness: 200 when the database is connected, 503 when it is not |

## Authentication — `/api/auth`

| Method | Endpoint               | Auth | Description                                                      |
| ------ | ---------------------- | ---- | ---------------------------------------------------------------- |
| POST   | `/register`            | —    | Register a Creator and send the verification email. Rate limited |
| POST   | `/login`               | —    | Authenticate and set the session cookies. Rate limited           |
| POST   | `/logout`              | —    | Revoke this device's session and clear its cookies               |
| POST   | `/logout-everywhere`   | yes  | Revoke every session the Creator holds                           |
| POST   | `/refresh`             | —    | Exchange the refresh cookie for a new access token               |
| GET    | `/me`                  | yes  | The signed-in Creator                                            |
| POST   | `/forgot-password`     | —    | Send a password-reset link. Rate limited                         |
| POST   | `/reset-password`      | —    | Set a new password from a reset token                            |
| POST   | `/verify-email`        | —    | Verify an address from an email token                            |
| POST   | `/resend-verification` | yes  | Resend the verification email. Rate limited                      |

## Posts — `/api/posts`

| Method | Endpoint        | Auth     | Description                                                                                                                                                                         |
| ------ | --------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/`             | yes      | The Hub list: the caller's own Posts. An admin sees all. Filters: `category`, `status`, `search`. Paginated                                                                         |
| GET    | `/public`       | —        | The Reader list: Published Posts, without owner ids. Filters: `category`, `search`. Paginated                                                                                       |
| GET    | `/:id`          | optional | A single Post by id. A Draft is readable by its owner or an admin only                                                                                                              |
| GET    | `/slug/:slug`   | —        | A Published Post by Slug — what the public blog reads                                                                                                                               |
| POST   | `/:id/view`     | —        | Record a View. Body `{ "source": "delivery" }` when the Reader arrived from a Delivery                                                                                              |
| POST   | `/`             | yes      | Create a Post. `readTime` and `slug` are derived server-side. `deliver: true` with `status: "Published"` delivers it to the Creator's Followers                                     |
| PUT    | `/:id`          | yes      | Update or publish a Post. Its Creator only — an Admin is refused with 403 (ADR 0006). `deliver: true` on the publish delivers it to the Creator's Followers                         |
| DELETE | `/:id`          | yes      | Delete a Post. Its Creator only — an Admin is refused with 403 (ADR 0006)                                                                                                           |
| POST   | `/:id/withhold` | yes      | Withhold a Published Post. Admin only. Body `{ "reason": "..." }`, recorded and never shown to the Creator. Answers with the Post's `owner`, `status`, `withheld` and `permissions` |
| DELETE | `/:id/withhold` | yes      | Lift a withholding. Any Admin. The record of who withheld it, when and why is kept. Answers as above                                                                                |

Every Post in a response to a signed-in caller — the Hub list, `/:id`, and the
create and update responses — carries `permissions`: the actions that caller may
perform on it, drawn from `edit`, `publish`, `delete`, `withhold` and `restore`. The server is the only
author of these answers and the dashboard renders its controls from them
([ADR 0004](adr/0004-server-owns-authorization-rules.md)). A response to an
anonymous Reader carries no `permissions` field at all, and an absent field
means no permissions.

A **Withheld** Post (`withheld: true`, a field only signed-in responses carry) is absent from every Reader path — the
public list, search, `/slug/:slug`, an anonymous `/:id` — answers 404 at its
Slug, and records no Views. Its Creator still sees it in the Hub, marked
Withheld, and may still edit it; publishing it does not make it visible. The
reason recorded with a withholding is never part of any response.

Both listings answer `{ "items": [...], "nextCursor": "..." }`. `nextCursor` is
present only when more Posts exist; pass it back as `?cursor=` for the next
page. `?limit=` defaults to 20 and is clamped to 50 — a size above the maximum
is clamped rather than refused, a malformed one is refused. The cursor is opaque
and its composition may change.

A Post that was delivered carries `delivery: { "followers": n, "at": "..." }`.
A Post is delivered at most once: `deliver` is honoured only by the request that
makes it Published, never for a Withheld Post, and never again after a Delivery
exists — editing it, or returning it to Draft and publishing again, sends
nothing. Publishing never waits on email: the Delivery is queued and sent
within the platform's daily limit.

A listed Post omits `content`: listing and reading are different requests with
different payloads. `GET /:id` and `GET /slug/:slug` still return the full Post.

## Analytics — `/api/analytics`

| Method | Endpoint     | Auth | Description                                                                                                                                                                                                                                                                                                                           |
| ------ | ------------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/`          | yes  | Stat cards for the signed-in Creator: Total Views, Posts                                                                                                                                                                                                                                                                              |
| GET    | `/views`     | yes  | The Creator's daily View counts, one point per day for the last seven                                                                                                                                                                                                                                                                 |
| GET    | `/followers` | yes  | Over the same seven UTC days as `/views`: `followers`, `weeklyGain`, `deliveries` (Posts delivered), `delivered` (Delivery emails actually sent), `lastDeliveryAt`, `viewsFromDeliveries`, and `weekly`: the Followers at the end of each of the last eight UTC weeks (Monday to Monday), oldest first, as `{ weekStart, followers }` |

> Both routes report on the Posts the signed-in Creator owns. Total Views sums
> Views across their Published Posts; a Draft accumulates none. Subscribers and
> Engagement are not reported — neither has a per-Creator definition, and a
> platform figure shown as a personal one is worse than no figure.

## Followers — `/api/followers`

| Method | Endpoint            | Auth | Description                                                                                                                            |
| ------ | ------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/`                 | —    | Follow the Creator of a Post. Body `{ "postId", "email" }`. Always `202`; a confirmation email goes to a new or pending address        |
| POST   | `/confirm`          | —    | Confirm a follow. Body `{ "token" }`. `410` for a used or expired link (48 hours). Answers with the Creator and the Post followed from |
| POST   | `/stop`             | —    | Stop following. Body `{ "token" }` from a Delivery's stop link. Idempotent                                                             |
| POST   | `/stop/:token`      | —    | The same, for a mail client's one-click unsubscribe (RFC 8058)                                                                         |
| GET    | `/`                 | yes  | The caller's confirmed Followers, newest first: `{ "items": [{ "email", "since" }] }`                                                  |
| GET    | `/export`           | yes  | The same as `followers.csv`                                                                                                            |
| GET    | `/summary`          | yes  | `followers`, `weeklyGain`, and `sendableToday` — how many Delivery emails the platform can still send today                            |
| GET    | `/count/:creatorId` | yes  | `{ "count" }`. The Creator themselves, or an Admin — the only Followers figure an Admin can read                                       |

A Follower belongs to one Creator ([ADR 0009](adr/0009-creators-own-their-followers.md)).
The follow answer never reveals whether an address already follows: the form
cannot be used to learn who follows whom.

## Settings — `/api/settings`

| Method | Endpoint         | Auth | Description                     |
| ------ | ---------------- | ---- | ------------------------------- |
| GET    | `/profile`       | yes  | The Creator's profile           |
| PUT    | `/profile`       | yes  | Update the profile              |
| PUT    | `/password`      | yes  | Change the password             |
| GET    | `/notifications` | yes  | Notification preferences        |
| PUT    | `/notifications` | yes  | Update notification preferences |
