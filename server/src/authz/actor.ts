// Who is making a request. Lives apart from the Post policy so that the session
// middleware can build one without importing the Posts module that uses it.
export type Actor =
  | { kind: 'reader' }
  | { kind: 'creator'; id: string }
  | { kind: 'admin'; id: string };

export const READER: Actor = { kind: 'reader' };

interface SessionClaims {
  id: string;
  role: string;
}

export function actorFrom(claims: SessionClaims | undefined): Actor {
  if (!claims) return READER;
  switch (claims.role) {
    case 'admin':
      return { kind: 'admin', id: claims.id };
    case 'creator':
      return { kind: 'creator', id: claims.id };
    default:
      throw new Error(`Unrecognised role: ${claims.role}`);
  }
}
