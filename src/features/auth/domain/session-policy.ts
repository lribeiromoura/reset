export type AuthPrincipal = {
  id: string;
  name: string;
  email: string;
};

export type SessionForAccess = {
  user: AuthPrincipal;
};

export class UnauthorizedError extends Error {
  readonly code = "UNAUTHORIZED";

  constructor() {
    super("UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export function requireAuthenticatedPrincipal(session: SessionForAccess | null): AuthPrincipal {
  if (!session) throw new UnauthorizedError();
  const { id, name, email } = session.user;
  return { id, name, email };
}
