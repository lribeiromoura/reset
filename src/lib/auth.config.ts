import { betterAuth } from "better-auth/minimal";
import { createAuthOptions } from "./auth-options";

// The Better Auth CLI loads this config without Next.js's server-only marker.
export const auth = betterAuth(createAuthOptions());
