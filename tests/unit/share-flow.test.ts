import { describe, expect, it, vi } from "vitest";
import type { ParsedSharedContent } from "../../lib/share/parse";
import {
  handleShareCapture,
  type ShareCaptureDependencies
} from "../../lib/share/handle-share-capture";

const sharedUrl: ParsedSharedContent = {
  url: "https://example.com/article",
  title: "Example",
  rawText: "https://example.com/article"
};

describe("Slice 3 share flow orchestration", () => {
  it("auto-saves immediately for an authenticated user", async () => {
    const capture = vi.fn().mockResolvedValue({
      item: { id: "item-1" }
    });

    const dependencies: ShareCaptureDependencies = {
      getUserId: vi.fn().mockResolvedValue("user-1"),
      capture
    };

    const result = await handleShareCapture({
      shared: sharedUrl,
      returnPath: "/share?title=Example&url=https%3A%2F%2Fexample.com%2Farticle",
      dependencies
    });

    expect(capture).toHaveBeenCalledOnce();
    expect(capture).toHaveBeenCalledWith({
      userId: "user-1",
      shared: sharedUrl
    });
    expect(result).toEqual({
      kind: "saved",
      itemId: "item-1"
    });
  });

  it("does not require a confirmation step before capture", async () => {
    const capture = vi.fn().mockResolvedValue({
      item: { id: "item-1" }
    });

    const result = await handleShareCapture({
      shared: sharedUrl,
      returnPath: "/share?url=https%3A%2F%2Fexample.com%2Farticle",
      dependencies: {
        getUserId: vi.fn().mockResolvedValue("user-1"),
        capture
      }
    });

    expect(result.kind).toBe("saved");
    expect(capture).toHaveBeenCalledOnce();
  });

  it("preserves the share through login when the user is unauthenticated", async () => {
    const capture = vi.fn();

    const result = await handleShareCapture({
      shared: sharedUrl,
      returnPath:
        "/share?title=Example&url=https%3A%2F%2Fexample.com%2Farticle",
      dependencies: {
        getUserId: vi.fn().mockResolvedValue(null),
        capture
      }
    });

    expect(capture).not.toHaveBeenCalled();
    expect(result).toEqual({
      kind: "login-required",
      loginPath:
        "/login?next=%2Fshare%3Ftitle%3DExample%26url%3Dhttps%253A%252F%252Fexample.com%252Farticle"
    });
  });

  it("reports persistence failure instead of claiming the share was saved", async () => {
    const capture = vi.fn().mockRejectedValue(
      new Error("Could not save item")
    );

    const result = await handleShareCapture({
      shared: sharedUrl,
      returnPath: "/share?url=https%3A%2F%2Fexample.com%2Farticle",
      dependencies: {
        getUserId: vi.fn().mockResolvedValue("user-1"),
        capture
      }
    });

    expect(result).toEqual({
      kind: "error",
      message: "Could not save item"
    });
  });
});
