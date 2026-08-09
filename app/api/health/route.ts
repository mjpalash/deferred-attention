import { NextResponse } from "next/server";
import { evaluateHealth } from "@/lib/health";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await evaluateHealth(async () => {
    const supabase = createServerSupabaseClient();
    const { count, error } = await supabase
      .from("healthcheck")
      .select("id", { count: "exact", head: true });

    if (error || count === null) {
      throw new Error("Database health query failed");
    }

    return count;
  });

  return NextResponse.json(result, {
    status: result.status === "ok" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
