import type { SupabaseClient } from "@supabase/supabase-js";
import { fromDbItem, type DbItem } from "@/lib/items/db";
import {
  captureSharedContent,
  type CaptureStore
} from "@/lib/share/capture";
import type { ParsedSharedContent } from "@/lib/share/parse";

function supabaseCaptureStore(
  supabase: SupabaseClient
): CaptureStore {
  return {
    async save({ userId, item }) {
      const { data, error } = await supabase
        .from("items")
        .insert({
          user_id: userId,
          url: item.url,
          title: item.title,
          raw_text: item.rawText,
          source_type: item.sourceType,
          note: item.note,
          status: item.status
        })
        .select("*")
        .single();

      if (error) {
        throw new Error("Could not save item");
      }

      return {
        item: fromDbItem(data as DbItem)
      };
    }
  };
}

export async function captureShareWithSupabase({
  supabase,
  userId,
  shared
}: {
  supabase: SupabaseClient;
  userId: string;
  shared: ParsedSharedContent;
}) {
  return captureSharedContent({
    userId,
    shared,
    store: supabaseCaptureStore(supabase)
  });
}
