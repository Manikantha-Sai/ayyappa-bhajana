// POST /api/login  { password }  →  { token }   (session valid for 12 hours)
const { env, json, readBody, makeToken, passwordOk } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { error: "Use POST." });
  if (!env("ADMIN_PASSWORD")) return json(res, 500, { error: "Admin login is not set up yet (ADMIN_PASSWORD is missing in Vercel settings)." });
  const { password } = readBody(req);
  if (!passwordOk(password)) {
    await new Promise(r => setTimeout(r, 800));       // slow down password guessing
    return json(res, 401, { error: "Wrong password." });
  }
  return json(res, 200, { token: makeToken(12) });
};
