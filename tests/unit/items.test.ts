import { describe, expect, it } from "vitest";
import {
  prepareNewItem,
  isValidItemStatus
} from "../../lib/items/domain";

describe("prepareNewItem", () => {
  it("accepts a URL-only capture", () => {
    const item = prepareNewItem({
      url: "https://example.com/article"
    });

    expect(item.url).toBe("https://example.com/article");
    expect(item.rawText).toBe("https://example.com/article");
    expect(item.status).toBe("inbox");
  });

  it("accepts plain text", () => {
    const item = prepareNewItem({
      rawText: "Look into event sourcing later"
    });

    expect(item.url).toBeNull();
    expect(item.rawText).toBe("Look into event sourcing later");
  });

  it("does not require optional metadata", () => {
    const item = prepareNewItem({
      rawText: "Something worth returning to"
    });

    expect(item.title).toBeNull();
    expect(item.note).toBeNull();
    expect(item.sourceType).toBeNull();
  });

  it("rejects an empty capture", () => {
    expect(() => prepareNewItem({})).toThrow(
      "A capture must contain a URL or text"
    );
  });

  it("rejects whitespace-only text", () => {
    expect(() => prepareNewItem({ rawText: "   " })).toThrow(
      "A capture must contain a URL or text"
    );
  });
});

describe("item status", () => {
  it.each(["inbox", "done", "kept"])(
    "accepts status %s",
    (status) => {
      expect(isValidItemStatus(status)).toBe(true);
    }
  );

  it.each(["deleted", "archived", "later", "", "priority"])(
    "rejects status %s",
    (status) => {
      expect(isValidItemStatus(status)).toBe(false);
    }
  );
});
