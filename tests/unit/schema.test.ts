import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sql = readFileSync(
  resolve(
    "supabase/migrations/202608090002_create_items.sql"
  ),
  "utf8"
).toLowerCase();

describe("Slice 1 items schema", () => {
  it("defines ownership and supported lifecycle", () => {
    expect(sql).toContain(
      "user_id uuid not null references auth.users(id)"
    );
    expect(sql).toContain(
      "status in ('inbox', 'done', 'kept')"
    );
  });

  it("enables RLS and authenticated policies", () => {
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("to authenticated");
    expect(sql).toContain("auth.uid()");
  });

  it.each([
    "folder",
    "tags",
    "category",
    "priority",
    "due_date"
  ])("does not add non-goal field %s", (field) => {
    const tableSection = sql
      .split("create table if not exists public.items (")[1]
      .split("create index")[0];

    expect(tableSection).not.toMatch(
      new RegExp(`\\b${field}\\b`)
    );
  });
});
