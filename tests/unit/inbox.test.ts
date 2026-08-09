import { describe, expect, it } from "vitest";
import {
  selectInboxItems,
  type Item
} from "../../lib/items/domain";

const make = (
  id: string,
  status: Item["status"],
  createdAt: string
): Item => ({
  id,
  userId: "user-a",
  url: null,
  title: null,
  rawText: "test",
  sourceType: null,
  note: null,
  status,
  createdAt,
  updatedAt: createdAt
});

describe("selectInboxItems", () => {
  it("returns only inbox items", () => {
    const items = [
      make("1", "inbox", "2026-08-09T10:00:00Z"),
      make("2", "done", "2026-08-09T11:00:00Z"),
      make("3", "kept", "2026-08-09T12:00:00Z")
    ];

    expect(selectInboxItems(items).map((x) => x.id)).toEqual(["1"]);
  });

  it("orders newest first", () => {
    const items = [
      make("old", "inbox", "2026-08-09T08:00:00Z"),
      make("new", "inbox", "2026-08-09T12:00:00Z")
    ];

    expect(selectInboxItems(items).map((x) => x.id)).toEqual([
      "new",
      "old"
    ]);
  });

  it("returns an empty array for an empty inbox", () => {
    expect(
      selectInboxItems([
        make("1", "done", "2026-08-09T08:00:00Z")
      ])
    ).toEqual([]);
  });
});
