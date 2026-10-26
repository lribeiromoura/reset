import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const requestId = randomUUID();
  try {
    await createDb().execute(sql`select 1`);
    return NextResponse.json({ status: "ok" }, {
      headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
    });
  } catch {
    console.error("reset_health_check_failed", { requestId });
    return NextResponse.json({ status: "unavailable" }, {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "30", "X-Request-Id": requestId },
    });
  }
}
