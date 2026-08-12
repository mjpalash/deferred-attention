import { describe, expect, it, vi } from "vitest";
import type { Item } from "../../lib/items/domain";
import {
  captureSharedContent,
  type CaptureStore
} from "../../lib/share/capture";

function savedItem(overrides: Partial<Item> = {}): Item {
  return {
    id: "item-1",
    userId: "user-1",
    url: "https://example.com/article",
    title: null,
    rawText: "https://example.com/article",
    sourceType: "android-share",
    note: null,
    status: "inbox",
    createdAt: "2026-08-12T02:30:00.000Z",
    updatedAt: "2026-08-12T02:30:00.000Z",
    ...overrides
  };
}

describe("Slice 3 instant share capture", () => {
  it("persists a valid shared URL immediately as an inbox item", async () => {
    const item = savedItem();
    const save = vi.fn().mockResolvedValue({ item });
    const store: CaptureStore = { save };

    const result = await captureSharedContent({
      userId: "user-1",
      shared: {
        url: "https://example.com/article",
        title: null,
        rawText: "https://example.com/article"
      },
      store
    });

    expect(save).toHaveBeenCalledOnce();
    expect(save).toHaveBeenCalledWith({
      userId: "user-1",
      item: {
        url: "https://example.com/article",
        title: null,
        rawText: "https://example.com/article",
        sourceType: "android-share",
        note: null,
        status: "inbox"
      }
    });
    expect(result).toEqual({ item });
  });

  it("persists shared plain text without requiring a URL", async () => {
    const item = savedItem({
      url: null,
      rawText: "Something to return to"
    });
    const save = vi.fn().mockResolvedValue({ item });
    const store: CaptureStore = { save };

    await captureSharedContent({
      userId: "user-1",
      shared: {
        url: null,
        title: null,
        rawText: "Something to return to"
      },
      store
    });

    expect(save).toHaveBeenCalledWith({
      userId: "user-1",
      item: {
        url: null,
        title: null,
        rawText: "Something to return to",
        sourceType: "android-share",
        note: null,
        status: "inbox"
      }
    });
  });

  
  it("surfaces persistence failure instead of reporting a successful save", async () => {
    const store: CaptureStore = {
      save: vi.fn().mockRejectedValue(
        new Error("Could not save item")
      )
    };

    await expect(
      captureSharedContent({
        userId: "user-1",
        shared: {
          url: "https://example.com/article",
          title: null,
          rawText: "https://example.com/article"
        },
        store
      })
    ).rejects.toThrow("Could not save item");
  });
});
