import { readFile, readdir } from "node:fs/promises";
import path from "node:path";


const root = process.cwd();
const failures = [];
const passes = [];

function assert(condition, message) {
  if (condition) {
    passes.push(message);
    console.log(`✓ ${message}`);
  } else {
    failures.push(message);
    console.error(`✗ ${message}`);
  }
}

const gitignore = await readFile(path.join(root, ".gitignore"), "utf8");
const envExample = await readFile(path.join(root, ".env.example"), "utf8");
const healthRoute = await readFile(path.join(root, "app/api/health/route.ts"), "utf8");

assert(gitignore.includes(".env.*"), "Environment files are ignored");
assert(gitignore.includes("!.env.example"), ".env.example is allowed in the repository");
assert(envExample.includes("SUPABASE_URL="), "SUPABASE_URL is documented");
assert(envExample.includes("SUPABASE_SECRET_KEY="), "SUPABASE_SECRET_KEY is documented");
assert(!envExample.includes("sb_secret_"), ".env.example contains no Supabase secret value");
assert(!envExample.includes("postgresql://"), ".env.example contains no database connection string");
assert(!envExample.includes("NEXT_PUBLIC_SUPABASE_SECRET_KEY"), "Server secret is not marked public");

const mutationPatterns = [/\.insert\s*\(/, /\.update\s*\(/, /\.delete\s*\(/, /\.upsert\s*\(/];
assert(
  !mutationPatterns.some((pattern) => pattern.test(healthRoute)),
  "Health route contains no Supabase mutation operation"
);
assert(healthRoute.includes('.select("id", { count: "exact", head: true })'), "Health route uses a read-only count query");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (["node_modules", ".next", ".git", ".vercel"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...(await walk(full)));
    else results.push(full);
  }
  return results;
}



console.log(`\n${passes.length} passed, ${failures.length} failed`);
process.exit(failures.length === 0 ? 0 : 1);
