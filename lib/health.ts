export type HealthResult =
  | {
      status: "ok";
      database: {
        status: "ok";
        check: "healthcheck_count";
        result: number;
      };
    }
  | {
      status: "error";
      database: {
        status: "unavailable";
      };
    };

export type HealthCountQuery = () => Promise<number>;

export async function evaluateHealth(queryCount: HealthCountQuery): Promise<HealthResult> {
  try {
    const count = await queryCount();
    if (!Number.isFinite(count)) {
      return { status: "error", database: { status: "unavailable" } };
    }

    return {
      status: "ok",
      database: {
        status: "ok",
        check: "healthcheck_count",
        result: count
      }
    };
  } catch {
    return { status: "error", database: { status: "unavailable" } };
  }
}
