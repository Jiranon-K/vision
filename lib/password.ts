export interface PasswordRule {
  id: string;
  /** Chip copy in the strength meter. Short — these sit five to a row. */
  label: string;
  test: (password: string) => boolean;
}

// Mirrors the password policy the API enforces on register and reset. Kept in
// one place so the meter, the submit gate and the field error never disagree.
export const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: "8+ characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "Uppercase", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "Lowercase", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "Number", test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "Symbol", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export function metPasswordRules(password: string): boolean[] {
  return PASSWORD_RULES.map((rule) => rule.test(password));
}

export function passwordMeetsPolicy(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
