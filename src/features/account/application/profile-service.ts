import { eq } from "drizzle-orm";
import { createDb } from "@/lib/db";
import { user } from "@/lib/db/auth-schema";
import { userProfiles } from "@/lib/db/domain-schema";

type Database = ReturnType<typeof createDb>;

export async function getAccountProfile(db: Database, userId: string) {
  const [identity] = await db.select({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt })
    .from(user).where(eq(user.id, userId)).limit(1);
  if (!identity) return null;
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return { user: identity, profile: profile ?? null, onboardingCompleted: Boolean(profile?.onboardingCompletedAt) };
}

export async function updateAccountProfile(
  db: Database,
  userId: string,
  changes: { name?: string; timezone?: string },
) {
  await db.transaction(async (tx) => {
    if (changes.name !== undefined) {
      await tx.update(user).set({ name: changes.name, updatedAt: new Date() }).where(eq(user.id, userId));
    }
    if (changes.timezone !== undefined) {
      await tx.insert(userProfiles).values({ userId, timezone: changes.timezone })
        .onConflictDoUpdate({ target: userProfiles.userId, set: { timezone: changes.timezone, updatedAt: new Date() } });
    }
  });
  return getAccountProfile(db, userId);
}
