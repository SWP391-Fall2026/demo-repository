// Local contract-derived HTTP smoke, NOT a Postman collection runner or browser test.
// Secrets/OTP/JWT and response bodies are never included in evidence or console output.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const privateDir = path.join(root, "storage-rental-secrets");
const mode = process.argv[2];
const mock = mode === "mock-run" || mode === "mock-status";
const baseUrl = `http://127.0.0.1:${mock ? 18080 : 8080}/api`;
const fixturePath = path.join(privateDir, mock ? "auth-mock-smoke.private.json" : "auth-smoke.private.json");
const otpPath = path.join(privateDir, "otp.txt");
const output = path.join(root, `artifacts/auth-staging/${mock ? "auth-mock-http-smoke.json" : ["retry-email", "complete-email"].includes(mode) ? "auth-http-email-retry.json" : "auth-http-smoke.json"}`);
const contractPath = path.join(root, "postman/auth.postman_collection.json");
const collection = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const evidence = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, "utf8")) : {
  executor: "Node HTTP; saved contract paths; not Postman CLI/GUI",
  target: `${baseUrl} with approved staging database`,
  otp_delivery: mock ? "MOCK-OTP, separate test profile" : "REAL-EMAIL",
  contract_sha256: crypto.createHash("sha256").update(fs.readFileSync(contractPath)).digest("hex"),
  started_at_utc: new Date().toISOString(), checks: [], secret_values_exported: false,
};
function save() { fs.writeFileSync(output, JSON.stringify(evidence, null, 2)); }
function check(id, condition) {
  if (mock) id = id.replace("AUTH-LIVE-", "AUTH-MOCK-");
  evidence.checks.push({ id, result: condition ? "PASS" : "FAIL" }); save();
  if (!condition) throw new Error(id);
}
function requestSpec(name) {
  const item = collection.item.find((entry) => entry.name === name);
  if (!item) throw new Error("Missing saved contract request");
  const url = item.request.url.replace("{{base_url}}", baseUrl);
  if (!/^http:\/\/127\.0\.0\.1:(8080|18080)\/api\/auth\/[a-z-]+$/.test(url)) throw new Error("Unexpected contract target");
  return { method: item.request.method, url };
}
async function request(name, body, token) {
  const spec = requestSpec(name);
  const response = await fetch(spec.url, {
    method: spec.method, redirect: "error", signal: AbortSignal.timeout(20000),
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
}

async function completeFixture(fixture, code) {
    const verified = await request("03-verify-otp", { email: fixture.email, code });
    check("AUTH-LIVE-09-otp-registers", verified.status === 200 && verified.body.success === true && verified.body.data?.registered === true);
    check("AUTH-LIVE-10-registration-does-not-login", !verified.body.token && verified.body.data?.email === fixture.email);
    const replay = await request("03-verify-otp", { email: fixture.email, code });
    check("AUTH-LIVE-11-otp-consumed", replay.status === 400 && replay.body.success === false);
    if (!mock) fs.writeFileSync(otpPath, "");
    const login = await request("04-login-original", { username: fixture.username, password: fixture.password });
    check("AUTH-LIVE-12-raw-password-login", login.status === 200 && login.body.success === true && typeof login.body.token === "string");
    check("AUTH-LIVE-13-customer-role", login.body.data?.role === "CUSTOMER" && login.body.data?.status === "ACTIVE");
    const token = login.body.token;
    const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    check("AUTH-LIVE-14-jwt24h", claims.exp - claims.iat === 86400 && claims.sub === fixture.username);
    const me = await request("05-current-profile", undefined, token);
    check("AUTH-LIVE-15-backend-validates-jwt", me.status === 200 && me.body.success === true && me.body.data?.id === login.body.data?.id && me.body.data?.role === "CUSTOMER");
    const trimmed = await request("06-login-trimmed-denied", { username: fixture.username, password: fixture.password.trim() });
    check("AUTH-LIVE-16-trimmed-password-rejected", trimmed.status === 401 && trimmed.body.success === false && !trimmed.body.token);
    const invalid = await request("05-current-profile", undefined, "invalid-test-token");
    check("AUTH-LIVE-17-invalid-token-401", invalid.status === 401 && invalid.body.success === false);
    if (mock) await mockAdditionalChecks(fixture);
    evidence.status = mock ? "HTTP_AUTH_SMOKE_PASSED_MOCK_OTP_LIVE_DB" : "HTTP_AUTH_SMOKE_PASSED";
    evidence.completed_at_utc = new Date().toISOString();
    evidence.browser_e2e = "NOT-TESTED"; evidence.postman_runner = "NOT-TESTED";
}

async function mockAdditionalChecks(base) {
  // A dedicated mock-OTP process still writes real, explicitly synthetic staging fixtures.
  const fixtureCases = [{ label: "base", ...base }];
  const fresh = () => {
    const key = crypto.randomBytes(6).toString("hex");
    return { ...base, username: `ar${key}`, email: `auth_${key}@auth.invalid`,
      phone: `09${crypto.randomInt(0, 100000000).toString().padStart(8, "0")}` };
  };
  for (const field of ["username", "email", "phone"]) {
    const duplicate = { ...fresh(), [field]: base[field] };
    const response = await request("01-send-otp", duplicate);
    check(`AUTH-MOCK-18-duplicate-${field}-precheck`, response.status === 400 && response.body.success === false);
  }
  const wrongFormat = await request("02-invalid-otp-format", { email: base.email, code: "12345" });
  check("AUTH-MOCK-19-malformed-otp-rejected", wrongFormat.status === 400 && wrongFormat.body.success === false);
  for (const kind of ["same-otp", "username", "phone"]) {
    const first = fresh();
    const second = kind === "same-otp" ? first : { ...fresh(), [kind]: first[kind] };
    const challengeA = await request("01-send-otp", first);
    check(`AUTH-MOCK-20-race-${kind}-challenge-a`, challengeA.status === 200 && challengeA.body.data?.delivery === "email");
    const challengeB = kind === "same-otp" ? challengeA : await request("01-send-otp", second);
    check(`AUTH-MOCK-21-race-${kind}-challenge-b`, challengeB.status === 200 && challengeB.body.data?.delivery === "email");
    throw new Error("OTP challenge codes must be received from email; concurrent delivery runner is disabled.");
    const outcomes = await Promise.all([
      request("03-verify-otp", { email: first.email, code: challengeA.body.data.code }),
      request("03-verify-otp", { email: second.email, code: challengeB.body.data.code }),
    ]);
    const winners = outcomes.map((r, index) => ({ ...r, index })).filter((r) => r.status === 200 && r.body.data?.registered === true);
    check(`AUTH-MOCK-22-race-${kind}-exactly-one-registration`, winners.length === 1);
    const loser = outcomes[1 - winners[0].index];
    check(`AUTH-MOCK-23-race-${kind}-loser-rejected`, (kind === "same-otp" ? loser.status === 400 : [400, 409].includes(loser.status)) && loser.body.success === false);
    check(`AUTH-MOCK-24-race-${kind}-no-auto-login`, outcomes.every((r) => !r.body.token));
    fixtureCases.push({ label: kind, ...(winners[0].index === 0 ? first : second) });
    evidence.races ??= [];
    evidence.races.push({ kind, http_statuses: outcomes.map((r) => r.status), successful_registrations: winners.length });
  }
  fs.writeFileSync(path.join(privateDir, "auth-mock-cases.private.json"), JSON.stringify(fixtureCases), { flag: "wx", mode: 0o600 });
  evidence.synthetic_registered_accounts_expected = fixtureCases.length;
}

async function mockStatusChecks(fixture) {
  const cp = [path.join(root, "artifacts/auth-staging/migration-classes"),
    fs.readFileSync(path.join(root, "artifacts/auth-staging/backend-runtime-classpath.txt"), "utf8").trim()].join(path.delimiter);
  function changeStatus(status) {
    const result = JSON.parse(execFileSync("java", ["-cp", cp, "AuthFixtureStateControl",
      path.join(privateDir, "backend.env"), fixturePath, status], {
      cwd: root, encoding: "utf8", timeout: 30000, stdio: ["ignore", "pipe", "pipe"],
    }));
    if (result.status !== "SYNTHETIC_FIXTURE_STATUS_CHANGED") throw new Error("Synthetic fixture state control failed");
  }
  const active = await request("04-login-original", { username: fixture.username, password: fixture.password });
  check("AUTH-MOCK-25-active-login", active.status === 200 && !!active.body.token);
  const token = active.body.token;
  const real = await fetch("http://127.0.0.1:8080/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000), redirect: "error",
  });
  check("AUTH-MOCK-26-test-signing-key-isolated", real.status === 401);
  try {
    for (const status of ["LOCKED", "DISABLED"]) {
      changeStatus(status);
      const login = await request("04-login-original", { username: fixture.username, password: fixture.password });
      check(`AUTH-MOCK-27-${status.toLowerCase()}-login-denied`, login.status === 401 && login.body.success === false && !login.body.token);
      const me = await request("05-current-profile", undefined, token);
      check(`AUTH-MOCK-28-${status.toLowerCase()}-jwt-denied`, me.status === 401 && me.body.success === false);
    }
  } finally {
    changeStatus("ACTIVE");
    evidence.synthetic_fixture_restored_active = true; save();
  }
  const restored = await request("04-login-original", { username: fixture.username, password: fixture.password });
  check("AUTH-MOCK-29-restored-active-login", restored.status === 200 && !!restored.body.token);
  evidence.status = "HTTP_AUTH_SMOKE_PASSED_MOCK_OTP_LIVE_DB";
  evidence.completed_at_utc = new Date().toISOString();
}

try {
  if (mock) throw new Error("This runner supports email OTP only; mock delivery is disabled.");
  if (mode === "prepare" || mode === "retry-email" || mode === "mock-run") {
    if (mode !== "retry-email" && fs.existsSync(fixturePath)) throw new Error("Private fixture already exists; do not silently replace an OTP challenge");
    const email = mock ? `auth_${crypto.randomBytes(8).toString("hex")}@auth.invalid` : process.argv[3];
    if (!email || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) throw new Error("Operator-designated OTP inbox required");
    const password = ` ${crypto.randomBytes(24).toString("base64url")} `;
    const fixture = mode === "retry-email" ? JSON.parse(fs.readFileSync(fixturePath, "utf8")) : {
      name: "Khach Thu Nghiem", username: `auth${Date.now().toString(36)}`,
      email, phone: `09${crypto.randomInt(0, 100000000).toString().padStart(8, "0")}`,
      cccd: `001${crypto.randomInt(0, 1000000000).toString().padStart(9, "0")}`,
      password, confirmPassword: password,
    };
    if (mode === "retry-email" && fixture.email !== email) throw new Error("Retry inbox differs from the approved fixture");
    if (mode !== "retry-email") fs.writeFileSync(fixturePath, JSON.stringify(fixture), { flag: "wx", mode: 0o600 });
    if (!fs.existsSync(otpPath)) fs.writeFileSync(otpPath, "", { flag: "wx", mode: 0o600 });
    const me = await request("05-current-profile");
    check("AUTH-LIVE-01-anonymous-me-401", me.status === 401 && me.body.success === false);
    if (!mock) {
    const frontend = await fetch("http://127.0.0.1:5173/register", { redirect: "error", signal: AbortSignal.timeout(10000) });
    check("AUTH-LIVE-02-vite-register-served", frontend.status === 200 && (await frontend.text()).includes('type="module"'));
    const proxy = await fetch("http://127.0.0.1:5173/api/auth/me", { redirect: "error", signal: AbortSignal.timeout(10000) });
    check("AUTH-LIVE-03-vite-api-proxy-401", proxy.status === 401 && (await proxy.json()).success === false);
    }
    const tooLong = await request("09-password-utf8-overflow", { ...fixture, password: "é".repeat(37), confirmPassword: "é".repeat(37) });
    check("AUTH-LIVE-04-over72-utf8-rejected", tooLong.status === 400 && tooLong.body.success === false && /72/.test(tooLong.body.message ?? ""));
    const mismatch = await request("07-confirm-mismatch", { ...fixture, confirmPassword: fixture.password.trim() });
    check("AUTH-LIVE-05-confirm-is-raw", mismatch.status === 400 && mismatch.body.success === false);
    const challenge = await request("01-send-otp", fixture);
    evidence.otp_request_http_status = challenge.status;
    if (challenge.status !== 200) { evidence.status = "OTP_DELIVERY_OR_REGISTRATION_BLOCKED"; save(); }
    check("AUTH-LIVE-06-email-challenge-accepted", challenge.status === 200 && challenge.body.success === true && challenge.body.data?.delivery === "email");
    check("AUTH-LIVE-07-no-otp-or-jwt-in-response", !challenge.body.token && !challenge.body.data?.code);
    const expiresAt = challenge.body.data.expiresAt;
    check("AUTH-LIVE-08-otp-ttl", Date.parse(expiresAt) > Date.now() && Date.parse(expiresAt) - Date.now() <= 300000);
    evidence.otp_expires_at_utc = expiresAt;
    evidence.status = "WAITING_FOR_OPERATOR_OTP";
    if (mock) await completeFixture(fixture, challenge.body.data.code);
  } else if (mode === "mock-status") {
    await mockStatusChecks(JSON.parse(fs.readFileSync(fixturePath, "utf8")));
  } else if (mode === "complete" || mode === "complete-email") {
    const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
    const code = fs.readFileSync(otpPath, "utf8").replace(/^\uFEFF/, "").trim();
    if (!/^[0-9]{6}$/.test(code)) throw new Error("Operator must enter the six-digit OTP into the ignored otp.txt file");
    if (Date.now() >= Date.parse(evidence.otp_expires_at_utc)) throw new Error("OTP challenge expired; do not attempt or automatically resend");
    await completeFixture(fixture, code);
  } else throw new Error("Expected prepare or complete");
  save();
  console.log(JSON.stringify({ status: evidence.status, assertions_passed: evidence.checks.filter((c) => c.result === "PASS").length,
    otp_expires_at_utc: evidence.otp_expires_at_utc, evidence: path.relative(root, output) }));
} catch (error) {
  evidence.status = evidence.status === "OTP_DELIVERY_OR_REGISTRATION_BLOCKED" ? evidence.status : "HTTP_SMOKE_BLOCKED_OR_FAILED";
  // Fixed assertion IDs only; never print provider/network response text, OTP or credentials.
  evidence.failure_check = /^AUTH-LIVE-[0-9]+-[a-z0-9-]+$/.test(error.message) ? error.message : "Private fixture/runtime input requires inspection";
  save();console.log(JSON.stringify({status:evidence.status,failure_check:evidence.failure_check,otp_request_http_status:evidence.otp_request_http_status}));process.exitCode=2;
}
