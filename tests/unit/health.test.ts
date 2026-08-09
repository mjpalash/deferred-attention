import { describe, expect, it, vi } from "vitest";
import { evaluateHealth } from "@/lib/health";

describe("evaluateHealth", () => {
  it("reports healthy when the read-only DB count query returns a number", async () => {
    const query = vi.fn().mockResolvedValue(1);

    await expect(evaluateHealth(query)).resolves.toEqual({
      status: "ok",
      database: {
        status: "ok",
        check: "healthcheck_count",
        result: 1
      }
    });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("accepts zero as a valid numeric database result", async () => {
    await expect(evaluateHealth(async () => 0)).resolves.toMatchObject({
      status: "ok",
      database: { status: "ok", result: 0 }
    });
  });

  it("reports unavailable when the database query fails", async () => {
    await expect(
      evaluateHealth(async () => {
        throw new Error("connection detail that must not escape");
      })
    ).resolves.toEqual({ status: "error", database: { status: "unavailable" } });
  });

  it("does not return arbitrary non-numeric DB results as healthy", async () => {
    await expect(evaluateHealth(async () => Number.NaN)).resolves.toEqual({
      status: "error",
      database: { status: "unavailable" }
    });
  });
});
