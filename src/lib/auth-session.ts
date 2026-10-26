import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { requireVerifiedPrincipal } from "@/features/auth/domain/session-policy";

export async function getServerSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireAuthenticatedUser() {
  return requireVerifiedPrincipal(await getServerSession());
}
