# API reference

Base URL in development: `http://localhost:3001`.

Authentication is by **httpOnly cookie**. `POST /api/auth/login` sets `access_token`
and `refresh_token`; the browser sends them automatically. An `Authorization: Bearer <token>`
header is accepted as a fallback for non-browser clients.

Routes marked **optional** authenticate when a token is present and fall back to
anonymous otherwise — an anonymous caller sees Published Posts only.

## Health

| Method | Endpoint      | Auth | Description    |
| ------ | ------------- | ---- | -------------- |
| GET    | `/api/health` | —    | Liveness check |

## Authentication — `/api/auth`

| Method | Endpoint               | Auth | Description                                                      |
| ------ | ---------------------- | ---- | ---------------------------------------------------------------- |
| POST   | `/register`            | —    | Register a Creator and send the verification email. Rate limited |
| POST   | `/login`               | —    | Authenticate and set the session cookies. Rate limited           |
| POST   | `/logout`              | —    | Clear the session cookies                                        |
| POST   | `/refresh`             | —    | Exchange the refresh cookie for a new access token               |
| GET    | `/me`                  | yes  | The signed-in Creator                                            |
| POST   | `/forgot-password`     | —    | Send a password-reset link. Rate limited                         |
| POST   | `/reset-password`      | —    | Set a new password from a reset token                            |
| POST   | `/verify-email`        | —    | Verify an address from an email token                            |
| POST   | `/resend-verification` | yes  | Resend the verification email. Rate limited                      |

## Posts — `/api/posts`

| Method | Endpoint      | Auth     | Description                                                                                      |
| ------ | ------------- | -------- | ------------------------------------------------------------------------------------------------ |
| GET    | `/`           | yes      | The Hub list: the caller's own Posts. An admin sees all. Filters: `category`, `status`, `search` |
| GET    | `/public`     | —        | The Reader list: Published Posts, without owner ids. Filters: `category`, `search`               |
| GET    | `/:id`        | optional | A single Post by id. A Draft is readable by its owner or an admin only                           |
| GET    | `/slug/:slug` | —        | A Published Post by Slug — what the public blog reads                                            |
| POST   | `/:id/view`   | —        | Record a View                                                                                    |
| POST   | `/`           | yes      | Create a Post. `readTime` and `slug` are derived server-side                                     |
| PUT    | `/:id`        | yes      | Update a Post. Owner or admin only                                                               |
| DELETE | `/:id`        | yes      | Delete a Post. Owner or admin only                                                               |

## Analytics — `/api/analytics`

| Method | Endpoint | Auth | Description                                                           |
| ------ | -------- | ---- | --------------------------------------------------------------------- |
| GET    | `/`      | yes  | Stat cards for the signed-in Creator: Total Views, Posts              |
| GET    | `/views` | yes  | The Creator's daily View counts, one point per day for the last seven |

> Both routes report on the Posts the signed-in Creator owns. Total Views sums
> Views across their Published Posts; a Draft accumulates none. Subscribers and
> Engagement are not reported — neither has a per-Creator definition, and a
> platform figure shown as a personal one is worse than no figure.

## Settings — `/api/settings`

| Method | Endpoint         | Auth | Description                     |
| ------ | ---------------- | ---- | ------------------------------- |
| GET    | `/profile`       | yes  | The Creator's profile           |
| PUT    | `/profile`       | yes  | Update the profile              |
| PUT    | `/password`      | yes  | Change the password             |
| GET    | `/notifications` | yes  | Notification preferences        |
| PUT    | `/notifications` | yes  | Update notification preferences |
