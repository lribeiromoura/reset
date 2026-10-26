import { randomBytes } from "node:crypto";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { createDb } from "@/lib/db";
import * as schema from "@/lib/db/auth-schema";
import { sendAuthEmail } from "@/lib/email/send-auth-email";

export function createAuthOptions() {
  const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
  const mayUseBuildDefaults = process.env.NODE_ENV !== "production" || isProductionBuild;
  const baseURL = process.env.BETTER_AUTH_URL ?? (mayUseBuildDefaults ? "http://localhost:3000" : undefined);
  const secret = process.env.BETTER_AUTH_SECRET ?? (mayUseBuildDefaults ? randomBytes(32).toString("base64url") : undefined);
  const databaseUrl = process.env.DATABASE_URL ?? (mayUseBuildDefaults ? "postgres://reset:reset@localhost:5432/reset" : undefined);

  if (!baseURL || !secret || !databaseUrl) {
    throw new Error("BETTER_AUTH_URL, BETTER_AUTH_SECRET e DATABASE_URL são obrigatórias em produção.");
  }

  const trustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? baseURL)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    appName: "Reset",
    baseURL,
    secret,
    trustedOrigins,
    database: drizzleAdapter(createDb(databaseUrl), {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      autoSignIn: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
        await sendAuthEmail({
          to: user.email,
          subject: "Redefina sua senha do Reset",
          text: "Recebemos um pedido para redefinir sua senha. Use o link seguro abaixo:",
          link: url,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: 60 * 60,
      sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
        await sendAuthEmail({
          to: user.email,
          subject: "Confirme seu e-mail no Reset",
          text: "Confirme seu endereço de e-mail para continuar no Reset:",
          link: url,
        });
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    user: {
      deleteUser: { enabled: true },
    },
    rateLimit: {
      enabled: true,
      storage: "database" as const,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 5 },
        "/request-password-reset": { window: 60, max: 3 },
        "/send-verification-email": { window: 60, max: 3 },
      },
    },
  };
}
