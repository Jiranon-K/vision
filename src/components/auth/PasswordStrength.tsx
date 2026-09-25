import { cn } from "@/lib/utils";
import { PASSWORD_RULES, metPasswordRules } from "@/lib/password";

export interface PasswordStrengthProps {
  password: string;
}

/**
 * Five bars that fill as the policy is met, over a row of rule chips. The bar
 * colour steps with the score so a weak-but-long password still reads amber.
 */
export function PasswordStrength({ password }: PasswordStrengthProps) {
  const met = metPasswordRules(password);
  const score = met.filter(Boolean).length;
  // Semantic steps, not lime primitives: these marks sit on a themed surface
  // next to text that flips with the theme, so they have to flip with it.
  const barTone =
    score <= 2 ? "bg-warning" : score <= 4 ? "bg-brand-border" : "bg-accent";

  return (
    <div className="mt-1.5 flex flex-col gap-2.5">
      <div className="flex gap-1.5" aria-hidden="true">
        {PASSWORD_RULES.map((rule, index) => (
          <span
            key={rule.id}
            className={cn(
              "h-[3px] flex-1 rounded-sm transition-colors",
              index < score ? barTone : "bg-border-subtle"
            )}
          />
        ))}
      </div>

      <ul className="flex list-none flex-wrap gap-x-2.5 gap-y-1.5 p-0">
        {PASSWORD_RULES.map((rule, index) => (
          <li
            key={rule.id}
            className={cn(
              "inline-flex items-center gap-1.5 text-[11.5px] font-medium",
              met[index] ? "text-brand-text" : "text-text-faint"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 rounded-full",
                met[index] ? "bg-brand-border" : "bg-border"
              )}
            />
            {rule.label}
            <span className="sr-only">{met[index] ? " — met" : " — not met"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
