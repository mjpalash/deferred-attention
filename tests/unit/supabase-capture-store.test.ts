import { describe, expect, it, vi } from "vitest";
import { captureShareWithSupabase } from "../../lib/share/supabase-capture-store";

function makeSupabaseInsertResult({
  data,
  error
}: {
  data: unknown;
  error: unknown;
}) {
  const single = vi.fn().mockResolvedValue({ data, error });
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  const from = vi.fn(() => ({ insert }));

  return {
    client: { from },
    spies: { from, insert, select, single }
  };
}

describe("Supabase share capture adapter", () => {
  it("persists one shared item and returns the saved item", async () => {
    const row = {
      id: "item-1",
      user_id: "user-1",
      url: "https://example.com/article",
      title: "Example",
      raw_text: "https://example.com/article",
      source_type: "android-share",
      note: null,
      status: "inbox",
      created_at: "2026-08-12T03:00:00.000Z",
      updated_at: "2026-08-12T03:00:00.000Z"
    };

    const { client, spies } = makeSupabaseInsertResult({
      data: row,
      error: null
    });

    const result = await captureShareWithSupabase({
      supabase: client as never,
      userId: "user-1",
      shared: {
        url: "https://example.com/article",
        title: "Example",
        rawText: "https://example.com/article"
      }
    });

    expect(spies.from).toHaveBeenCalledWith("items");
    expect(spies.insert).toHaveBeenCalledOnce();
    expect(spies.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      url: "https://example.com/article",
      title: "Example",
      raw_text: "https://example.com/article",
      source_type: "android-share",
      note: null,
      status: "inbox"
    });

    expect(result.item).toMatchObject({
      id: "item-1",
      userId: "user-1",
      url: "https://example.com/article",
      sourceType: "android-share",
      status: "inbox"
    });
  });

  it("surfaces a database insert failure as a capture failure", async () => {
    const { client } = makeSupabaseInsertResult({
      data: null,
      error: { message: "database unavailable" }
    });

    await expect(
      captureShareWithSupabase({
        supabase: client as never,
        userId: "user-1",
        shared: {
          url: "https://example.com/article",
          title: null,
          rawText: "https://example.com/article"
        }
      })
    ).rejects.toThrow("Could not save item");
  });
});
