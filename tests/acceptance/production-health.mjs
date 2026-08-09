const baseUrl = (process.env.ACCEPTANCE_BASE_URL || "").replace(/\/$/, "");

if (!baseUrl) {
  console.error("FAIL: ACCEPTANCE_BASE_URL is required");
  process.exit(1);
}

if (!baseUrl.startsWith("https://")) {
  console.error("FAIL: production acceptance tests require an HTTPS URL");
  process.exit(1);
}

const checks = [];
function pass(message) {
  checks.push({ ok: true, message });
  console.log(`✓ ${message}`);
}
function fail(message) {
  checks.push({ ok: false, message });
  console.error(`✗ ${message}`);
}

try {
  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { accept: "application/json" },
    cache: "no-store"
  });

  response.status === 200
    ? pass("Health endpoint returned HTTP 200")
    : fail(`Health endpoint returned HTTP ${response.status}`);

  const bodyText = await response.text();
  let body;
  try {
    body = JSON.parse(bodyText);
    pass("Health endpoint returned JSON");
  } catch {
    fail("Health endpoint did not return valid JSON");
    body = {};
  }

  body.status === "ok"
    ? pass("Application status is ok")
    : fail("Application status is not ok");

  body.database?.status === "ok"
    ? pass("Database status is ok")
    : fail("Database status is not ok");

  Number.isFinite(body.database?.result)
    ? pass(`Database returned numeric health result: ${body.database.result}`)
    : fail("Database did not return a numeric health result");

  const forbiddenPatterns = [
    /sb_secret_/i,
    /service_role/i,
    /SUPABASE_SECRET_KEY/i,
    /SUPABASE_DB_PASSWORD/i,
    /postgres(?:ql)?:\/\//i
  ];
  forbiddenPatterns.some((pattern) => pattern.test(bodyText))
    ? fail("Health response appears to expose sensitive configuration")
    : pass("Health response does not expose known secret patterns");

  if (Number.isFinite(body.database?.result)) {
    const secondResponse = await fetch(`${baseUrl}/api/health`, {
      headers: { accept: "application/json" },
      cache: "no-store"
    });
    const secondBody = await secondResponse.json();
    secondResponse.status === 200
      ? pass("Repeated health call returned HTTP 200")
      : fail(`Repeated health call returned HTTP ${secondResponse.status}`);
    secondBody.database?.result === body.database.result
      ? pass("Repeated health call did not change the healthcheck row count")
      : fail("Healthcheck row count changed across repeated health calls");
  }
} catch (error) {
  fail(`Could not reach deployed health endpoint: ${error instanceof Error ? error.message : "unknown error"}`);
}

const failed = checks.filter((check) => !check.ok).length;
console.log(`\n${checks.length - failed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
