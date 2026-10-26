import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { schema } from "./schema";

type Database = ReturnType<typeof drizzle>;
type DbGlobal = typeof globalThis & { __resetDbCache?: Map<string, Database> };
const dbGlobal = globalThis as DbGlobal;
const dbCache = (dbGlobal.__resetDbCache ??= new Map<string, Database>());

export function createDb(
  databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL,
) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL precisa estar configurada para acessar o banco.");
  }

  const existing = dbCache.get(databaseUrl);
  if (existing) return existing;

  const connectionUrl = new URL(databaseUrl);
  const isSupabase = connectionUrl.hostname.endsWith(".supabase.co")
    || connectionUrl.hostname.endsWith(".supabase.com");
  const usesTransactionPooler = connectionUrl.port === "6543";
  const client = postgres(databaseUrl, {
    max: 1,
    ...(isSupabase ? { ssl: "require" as const } : {}),
    ...(usesTransactionPooler ? { prepare: false } : {}),
  });
  const db = drizzle({ client, schema });
  dbCache.set(databaseUrl, db);
  return db;
}
