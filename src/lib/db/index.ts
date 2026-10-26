import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { schema } from "./schema";

type Database = ReturnType<typeof drizzle>;
type DbGlobal = typeof globalThis & { __resetDbCache?: Map<string, Database> };
const dbGlobal = globalThis as DbGlobal;
const dbCache = (dbGlobal.__resetDbCache ??= new Map<string, Database>());

export function createDb(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL precisa estar configurada para acessar o banco.");
  }

  const existing = dbCache.get(databaseUrl);
  if (existing) return existing;

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle({ client, schema });
  dbCache.set(databaseUrl, db);
  return db;
}
