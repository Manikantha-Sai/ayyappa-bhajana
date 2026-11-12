// Shared helpers for the /api functions (Vercel ignores files starting with "_" as routes).
//
// Settings (Vercel → Project → Settings → Environment Variables):
//   ADMIN_PASSWORD   shared password for adding / editing songs
//   GITHUB_TOKEN     fine-grained GitHub token for this repo: Contents = Read and write,
//                    Pull requests = Read and write
//   GITHUB_REPO      e.g. Manikantha-Sai/ayyappa-bhajana
//   GITHUB_BRANCH    branch the site is deployed from (default: main)
//   SESSION_SECRET   optional: any long random text, used to sign login sessions
const crypto = require("crypto");

const env = k => process.env[k] || "";

function json(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body || "{}"); } catch { return {}; }
}

// ----- Login sessions: "<expiry>.<signature>", signed with HMAC-SHA256 -----
const secret = () => env("SESSION_SECRET") || "bhajana-session:" + env("ADMIN_PASSWORD");
const sign = exp => crypto.createHmac("sha256", secret()).update(String(exp)).digest("base64url");
function makeToken(hours = 12) {
  const exp = Date.now() + hours * 3600 * 1000;
  return exp + "." + sign(exp);
}
function checkToken(token) {
  if (typeof token !== "string") return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  const a = Buffer.from(sig), b = Buffer.from(sign(exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function passwordOk(given) {
  const wanted = env("ADMIN_PASSWORD");
  if (!wanted || typeof given !== "string") return false;
  const h = x => crypto.createHash("sha256").update(x, "utf8").digest();
  return crypto.timingSafeEqual(h(given), h(wanted));
}
const bearer = req => {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
};

// ----- GitHub REST API -----
async function gh(pathname, { method = "GET", body } = {}) {
  const r = await fetch("https://api.github.com" + pathname, {
    method,
    headers: {
      Authorization: "Bearer " + env("GITHUB_TOKEN"),
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "bhajana-site",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = r.status === 204 ? null : await r.json().catch(() => null);
  if (!r.ok) {
    const e = new Error((data && data.message) || "GitHub error " + r.status);
    e.status = r.status;
    throw e;
  }
  return data;
}

module.exports = { env, json, readBody, makeToken, checkToken, passwordOk, bearer, gh };
