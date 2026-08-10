import { describe, expect, it } from "vitest";
import { manifest } from "../../app/manifest";

describe("PWA manifest", () => {
  it("describes an installable standalone application", () => {
    const value = manifest();

    expect(value.name).toBeTruthy();
    expect(value.short_name).toBeTruthy();
    expect(value.start_url).toBe("/");
    expect(value.display).toBe("standalone");
    expect(Array.isArray(value.icons)).toBe(true);
    expect(value.icons?.length ?? 0).toBeGreaterThan(0);
  });

  it("registers an Android Web Share Target", () => {
    const value = manifest();
    const shareTarget = value.share_target;

    expect(shareTarget).toBeDefined();
    expect(shareTarget?.action).toBe("/share");
    expect(shareTarget?.method).toBe("GET");
    expect(shareTarget?.params).toMatchObject({
      title: "title",
      text: "text",
      url: "url"
    });
  });
});
