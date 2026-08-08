// Deliberately loose: the API is the authority on whether an address exists,
// and a stricter pattern here only rejects addresses that are actually valid.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

/** The banner that sits above a form whose own fields are what failed. */
export const FIELD_ERROR_BANNER = "Check the highlighted fields below.";

/** Every auth screen says the same thing when the API cannot be reached. */
export const SERVICE_UNAVAILABLE =
  "We cannot reach the server right now. Try again in a moment.";
