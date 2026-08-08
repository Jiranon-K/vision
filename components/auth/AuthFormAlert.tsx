import { Alert } from "@/components/ui/alert";
import { FIELD_ERROR_BANNER } from "@/lib/auth-validation";

/**
 * A message the server gave us, as opposed to one the form raised itself.
 * `error` is a rejection, `warning` a condition that will pass on its own, and
 * `neutral` something that is not the Creator's doing at all.
 */
export type AuthBanner = {
  tone: "error" | "warning" | "neutral";
  text: string;
};

export interface AuthFormAlertProps {
  /**
   * Wins over `banner`: fix your own fields before arguing with the server.
   * Omit on a screen that has no form of its own to get wrong.
   */
  hasFieldErrors?: boolean;
  banner: AuthBanner | null;
}

export function AuthFormAlert({
  hasFieldErrors = false,
  banner,
}: AuthFormAlertProps) {
  if (hasFieldErrors) {
    return (
      <Alert tone="warning" className="mt-5">
        {FIELD_ERROR_BANNER}
      </Alert>
    );
  }

  if (!banner) return null;

  return (
    <Alert tone={banner.tone} className="mt-5">
      {banner.text}
    </Alert>
  );
}
