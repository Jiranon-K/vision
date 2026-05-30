// Admin designation is driven by the ADMIN_EMAILS env var (comma-separated).
// Any user whose email matches is treated as an admin: promoted on register and
// self-healed on login, so admin status survives DB resets without a manual step.
export function isAdminEmail(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw || !email) {
    return false;
  }

  const target = email.trim().toLowerCase();
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(target);
}
