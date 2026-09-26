export const ROLES = ['admin', 'creator'] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return (ROLES as readonly unknown[]).includes(value);
}
