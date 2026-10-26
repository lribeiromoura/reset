import "server-only";
import { betterAuth } from "better-auth/minimal";
import { createAuthOptions } from "@/lib/auth-options";

export const auth = betterAuth(createAuthOptions());
