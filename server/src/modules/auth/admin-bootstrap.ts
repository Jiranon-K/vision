import User from './user.model';

function isListedAdminEmail(email: string): boolean {
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

export async function bootstrapsFirstAdmin(email: string): Promise<boolean> {
  if (!isListedAdminEmail(email)) return false;
  return !(await User.exists({ role: 'admin' }));
}
