import { describe, expect, it } from "vitest";
import { parseSharedContent } from "../../lib/share/parse";

describe("parseSharedContent", () => {
  it("parses a separately supplied URL", () => {
    const result = parseSharedContent({
      url: "https://example.com/article"
    });

    expect(result).toEqual({
      url: "https://example.com/article",
      rawText: "https://example.com/article",
      title: null
    });
  });

  it("parses plain text with no URL", () => {
    const result = parseSharedContent({
      text: "Read about CRDTs later"
    });

    expect(result).toEqual({
      url: null,
      rawText: "Read about CRDTs later",
      title: null
    });
  });

  it("preserves a supplied title with a URL", () => {
    const result = parseSharedContent({
      title: "Interesting article",
      url: "https://example.com/article"
    });

    expect(result).toEqual({
      url: "https://example.com/article",
      rawText: "https://example.com/article",
      title: "Interesting article"
    });
  });

  it("extracts a URL from shared text while preserving original text", () => {
    const result = parseSharedContent({
      text: "Worth reading https://example.com/article later"
    });

    expect(result.url).toBe("https://example.com/article");
    expect(result.rawText).toBe(
      "Worth reading https://example.com/article later"
    );
  });

  it("prefers the separately supplied URL over a URL embedded in text", () => {
    const result = parseSharedContent({
      text: "See https://other.example.com",
      url: "https://example.com/article"
    });

    expect(result.url).toBe("https://example.com/article");
    expect(result.rawText).toBe("See https://other.example.com");
  });

  it("rejects an empty share", () => {
    expect(() => parseSharedContent({})).toThrow(
      "Shared content must contain a URL or text"
    );
  });

  it("rejects whitespace-only share content", () => {
    expect(() =>
      parseSharedContent({
        title: " ",
        text: " ",
        url: " "
      })
    ).toThrow("Shared content must contain a URL or text");
  });
});
