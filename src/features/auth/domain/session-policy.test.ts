import { describe, expect, it } from "vitest";
import { requireAuthenticatedPrincipal, UnauthorizedError } from "./session-policy";

describe("auth session access policy", () => {
  it("rejects a missing session, including expired or invalid-cookie sessions", () => {
    expect(() => requireAuthenticatedPrincipal(null)).toThrow(UnauthorizedError);
  });

  it("allows an authenticated account without email verification", () => {
    expect(requireAuthenticatedPrincipal({ user: { id: "u1", name: "Ana", email: "ana@example.com" } })).toEqual({
      id: "u1",
      name: "Ana",
      email: "ana@example.com",
    });
  });

  it("returns only the authenticated user's principal", () => {
    expect(requireAuthenticatedPrincipal({ user: { id: "u1", name: "Ana", email: "ana@example.com" } })).toEqual({
      id: "u1",
      name: "Ana",
      email: "ana@example.com",
    });
  });
});
