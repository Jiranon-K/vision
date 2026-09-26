// The Auth feature's interface (ADR 0007). Anything not exported here is
// internal to the feature.
export { AuthFormAlert, type AuthBanner } from "./components/auth-form-alert";
export { AuthResult } from "./components/auth-result";
export { AuthShell } from "./components/auth-shell";
export { AuthSubmitButton } from "./components/auth-submit-button";
export { PasswordField } from "./components/password-field";
export { PasswordStrength } from "./components/password-strength";
export { default as UnverifiedEmailBanner } from "./components/unverified-email-banner";
export { useAuth } from "./hooks/use-auth";
export { useFieldErrors } from "./hooks/use-field-errors";
export { usePasswordToggle } from "./hooks/use-password-toggle";
export { useRedirectIfAuthenticated } from "./hooks/use-redirect-if-authenticated";
export {
  getCurrentUser,
  getRememberMe,
  setRememberMe,
  type AccountRole,
  type CurrentUser,
} from "./session";
export { isValidEmail, FIELD_ERROR_BANNER, SERVICE_UNAVAILABLE } from "./validation";
export { passwordMeetsPolicy } from "./password";
export {
  forgotPasswordRequest,
  logoutEverywhereRequest,
  logoutRequest,
  resendVerificationRequest,
  resetPasswordRequest,
  verifyEmailRequest,
} from "./api";
