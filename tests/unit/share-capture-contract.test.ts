import { describe, expect, it } from "vitest";
import { parseSharedContent } from "../../lib/share/parse";
import { prepareNewItem } from "../../lib/items/domain";

describe("Android share capture contract", () => {
  it("feeds shared URLs into the existing Slice 1 item model", () => {
    const shared = parseSharedContent({
      url: "https://example.com/article"
    });

    const item = prepareNewItem({
      url: shared.url,
      rawText: shared.rawText,
      title: shared.title
    });

    expect(item.status).toBe("inbox");
    expect(item.url).toBe("https://example.com/article");
    expect(item.rawText).toBe("https://example.com/article");
  });

  it("feeds shared plain text into the existing Slice 1 item model", () => {
    const shared = parseSharedContent({
      text: "Something to return to"
    });

    const item = prepareNewItem({
      url: shared.url,
      rawText: shared.rawText,
      title: shared.title
    });

    expect(item.status).toBe("inbox");
    expect(item.url).toBeNull();
    expect(item.rawText).toBe("Something to return to");
  });

  it("does not introduce capture-time organizational metadata", () => {
    const shared = parseSharedContent({
      url: "https://example.com"
    });

    expect(Object.keys(shared).sort()).toEqual(
      ["rawText", "title", "url"].sort()
    );
  });
});
