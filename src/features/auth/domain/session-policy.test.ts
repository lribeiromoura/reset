import { describe, expect, it } from "vitest";
import { requireVerifiedPrincipal, UnauthorizedError } from "./session-policy";

describe("auth session access policy", () => {
  it("rejects a missing session, including expired or invalid-cookie sessions", () => {
    expect(() => requireVerifiedPrincipal(null)).toThrow(UnauthorizedError);
  });

  it("rejects sessions whose email has not been verified", () => {
    expect(() => requireVerifiedPrincipal({ user: { id: "u1", name: "Ana", email: "ana@example.com", emailVerified: false } })).toThrow(UnauthorizedError);
  });

  it("returns only the verified user's principal", () => {
    expect(requireVerifiedPrincipal({ user: { id: "u1", name: "Ana", email: "ana@example.com", emailVerified: true } })).toEqual({
      id: "u1",
      name: "Ana",
      email: "ana@example.com",
    });
  });
});
