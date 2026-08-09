import { describe, expect, it } from "vitest";
import {
  changeItemStatus,
  type Item
} from "../../lib/items/domain";

const base: Item = {
  id: "item-1",
  userId: "user-a",
  url: "https://example.com",
  title: null,
  rawText: "https://example.com",
  sourceType: null,
  note: null,
  status: "inbox",
  createdAt: "2026-08-09T10:00:00Z",
  updatedAt: "2026-08-09T10:00:00Z"
};

describe("item lifecycle", () => {
  it("marks an item done", () => {
    const updated = changeItemStatus(
      base,
      "done",
      "2026-08-09T11:00:00Z"
    );

    expect(updated.status).toBe("done");
    expect(updated.updatedAt).toBe("2026-08-09T11:00:00Z");
  });

  it("marks an item kept", () => {
    const updated = changeItemStatus(
      base,
      "kept",
      "2026-08-09T11:00:00Z"
    );

    expect(updated.status).toBe("kept");
  });

  it("does not mutate the original", () => {
    changeItemStatus(
      base,
      "done",
      "2026-08-09T11:00:00Z"
    );

    expect(base.status).toBe("inbox");
  });

  it("rejects an invalid status", () => {
    expect(() =>
      changeItemStatus(
        base,
        "archived" as never,
        "2026-08-09T11:00:00Z"
      )
    ).toThrow("Unsupported item status");
  });
});
