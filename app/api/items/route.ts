import { NextResponse } from "next/server";
import {
  prepareNewItem,
  type NewItemInput
} from "@/lib/items/domain";
import { fromDbItem, type DbItem } from "@/lib/items/db";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

export const dynamic = "force-dynamic";

async function authenticatedClient() {
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase.auth.getClaims();

  const userId =
    typeof data?.claims?.sub === "string"
      ? data.claims.sub
      : null;

  return { supabase, userId, authError: error };
}

export async function GET() {
  const { supabase, userId, authError } = await authenticatedClient();

  if (authError || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("status", "inbox")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Could not load inbox" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    items: (data as DbItem[]).map(fromDbItem)
  });
}

export async function POST(request: Request) {
  const { supabase, userId, authError } = await authenticatedClient();

  if (authError || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!input || typeof input !== "object") {
    return NextResponse.json({ error: "Invalid capture" }, { status: 400 });
  }

  try {
    const prepared = prepareNewItem(input as NewItemInput);

    const { data, error } = await supabase
      .from("items")
      .insert({
        user_id: userId,
        url: prepared.url,
        title: prepared.title,
        raw_text: prepared.rawText,
        source_type: prepared.sourceType,
        note: prepared.note,
        status: prepared.status
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Could not save item" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { item: fromDbItem(data as DbItem) },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid capture";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
