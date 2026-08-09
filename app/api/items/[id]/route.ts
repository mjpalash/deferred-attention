import { NextResponse } from "next/server";
import { isValidItemStatus } from "@/lib/items/domain";
import { fromDbItem, type DbItem } from "@/lib/items/db";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

async function authenticatedClient() {
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase.auth.getClaims();

  const userId =
    typeof data?.claims?.sub === "string"
      ? data.claims.sub
      : null;

  return { supabase, userId, authError: error };
}

export async function GET(_request: Request, context: Context) {
  const { supabase, userId, authError } = await authenticatedClient();

  if (authError || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Could not load item" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    item: fromDbItem(data as DbItem)
  });
}

export async function PATCH(request: Request, context: Context) {
  const { supabase, userId, authError } = await authenticatedClient();

  if (authError || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status =
    body && typeof body === "object"
      ? (body as { status?: unknown }).status
      : undefined;

  if (!isValidItemStatus(status)) {
    return NextResponse.json(
      { error: "Unsupported item status" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("items")
    .update({ status })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Could not update item" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    item: fromDbItem(data as DbItem)
  });
}
