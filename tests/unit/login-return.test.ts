import { describe, expect, it } from "vitest";
import {
  buildShareReturnPath,
  safeNextPath
} from "../../lib/auth/return-path";

describe("pending share survives authentication", () => {
  it("builds a return path that preserves shared URL and text", () => {
    const next = buildShareReturnPath({
      url: "https://example.com/article",
      text: "Interesting article"
    });

    const [pathname, query = ""] = next.split("?");
    const params = new URLSearchParams(query);

    expect(pathname).toBe("/share");
    expect(params.get("text")).toBe("Interesting article");
    expect(params.get("url")).toBe("https://example.com/article");
  });

  it("preserves an optional shared title", () => {
    const next = buildShareReturnPath({
      title: "Example",
      url: "https://example.com"
    });

    const params = new URLSearchParams(next.split("?")[1]);

    expect(next.startsWith("/share?")).toBe(true);
    expect(params.get("title")).toBe("Example");
    expect(params.get("url")).toBe("https://example.com");
  });

  it("accepts a local share return path after login", () => {
    const next =
      "/share?url=https%3A%2F%2Fexample.com&text=Interesting";

    expect(safeNextPath(next)).toBe(next);
  });

  it("defaults to the inbox when no return path exists", () => {
    expect(safeNextPath(undefined)).toBe("/");
    expect(safeNextPath("")).toBe("/");
  });

  it("rejects an external redirect", () => {
    expect(
      safeNextPath("https://malicious.example")
    ).toBe("/");
  });

  it("rejects a protocol-relative external redirect", () => {
    expect(
      safeNextPath("//malicious.example")
    ).toBe("/");
  });
});