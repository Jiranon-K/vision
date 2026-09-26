// The Auth module's interface (ADR 0007). Anything not exported here, or from
// auth.routes.ts for mounting, is internal to the module.
//
// Importing this file loads the session middleware, and with it the token
// module, which requires JWT_SECRET. Code that only needs the Actor type
// should use `import type`.
export { auth, optionalAuth, type AuthRequest } from './require-session';
export { READER, actorFrom, type Actor } from './actor';
export { default as User, type IUser } from './user.model';
export { validatePasswordStrength } from './password';
export { reissueSessionAfterPasswordChange } from './auth.controller';
// Settings' schemas, until ticket 07 moves them to the Creators module.
export {
  changePasswordSchema,
  profileSchema,
  notificationSchema,
} from './auth.schema';
