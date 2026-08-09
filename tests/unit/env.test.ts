import { describe, expect, it } from "vitest";
import { getServerEnv } from "@/lib/env";

describe("getServerEnv", () => {
  it("returns required server configuration when present", () => {
    const env = getServerEnv({
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SECRET_KEY: "test-secret"
    });

    expect(env).toEqual({
      supabaseUrl: "https://example.supabase.co",
      supabaseSecretKey: "test-secret"
    });
  });

  it("fails clearly when required configuration is missing without printing values", () => {
    expect(() => getServerEnv({ SUPABASE_URL: "https://example.supabase.co" })).toThrow(
      "Missing required server configuration: SUPABASE_SECRET_KEY"
    );
  });
});
