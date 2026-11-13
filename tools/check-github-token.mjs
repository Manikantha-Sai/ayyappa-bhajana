// Checks that a GitHub token can do everything the website's "Add song" needs.
// It reads the repo, creates a temporary commit + branch, deletes that branch again,
// and checks Pull Request access. Nothing is changed in the repo and no PR is opened.
//
// Run in PowerShell (the token is only kept in this terminal window):
//   $env:GITHUB_TOKEN = "paste-your-token-here"
//   node tools/check-github-token.mjs
//   Remove-Item Env:GITHUB_TOKEN          # forget it afterwards
const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPO || "Manikantha-Sai/ayyappa-bhajana";
const base = process.env.GITHUB_BRANCH || "main";
if (!token) { console.log('Set the token first:  $env:GITHUB_TOKEN = "..."'); process.exit(1); }

async function gh(path, method = "GET", body) {
  const r = await fetch("https://api.github.com" + path, {
    method,
    headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json",
               "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "bhajana-token-check",
               ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = r.status === 204 ? null : await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, data, msg: (data && data.message) || "" };
}
let failed = false;
function report(name, res, fix) {
  if (res.ok) console.log("  OK    " + name);
  else { failed = true; console.log(`  FAIL  ${name}  ->  ${res.status} ${res.msg}\n        Fix: ${fix}`); }
  return res.ok;
}

console.log(`Checking token against ${repo} (branch ${base})\n`);
const who = await gh("/user");
console.log(who.ok ? `  Token belongs to: ${who.data.login}` : `  Token not valid: ${who.status} ${who.msg}`);
if (!who.ok) process.exit(1);

const ref = await gh(`/repos/${repo}/git/ref/heads/${base}`);
if (!report("Read the repo", ref,
  `Repository access must include ${repo.split("/")[1]} (and Resource owner must be ${repo.split("/")[0]}).`)) process.exit(1);
const sha = ref.data.object.sha;
const commit = await gh(`/repos/${repo}/git/commits/${sha}`);
report("Read commits", commit, "Contents permission must be at least Read.");

const tree = await gh(`/repos/${repo}/git/trees`, "POST",
  { base_tree: commit.data.tree.sha, tree: [{ path: "tools/.token-check.txt", mode: "100644", type: "blob", content: "check\n" }] });
if (report("Write files (Contents: Read and write)", tree, "Set Contents to 'Read and write'.")) {
  const c = await gh(`/repos/${repo}/git/commits`, "POST", { message: "token check (temporary)", tree: tree.data.sha, parents: [sha] });
  if (report("Create commits", c, "Set Contents to 'Read and write'.")) {
    const branch = "song/token-check-" + Date.now().toString(36);
    const b = await gh(`/repos/${repo}/git/refs`, "POST", { ref: "refs/heads/" + branch, sha: c.data.sha });
    if (report("Create a branch", b,
      "Set Contents to 'Read and write'. If it already is, a branch rule/ruleset is blocking new branches: allow creating 'song/*' branches.")) {
      const d = await gh(`/repos/${repo}/git/refs/heads/${branch}`, "DELETE");
      console.log(d.ok ? "        (temporary branch deleted again)" : `        Note: delete the branch ${branch} on GitHub by hand.`);
    }
  }
}
const prs = await gh(`/repos/${repo}/pulls?state=all&per_page=1`);
report("Read Pull Requests", prs, "Set Pull requests to 'Read and write'.");
// Creating a PR with a missing head branch fails with 422 if permitted, 403 if not allowed.
const prTry = await gh(`/repos/${repo}/pulls`, "POST", { title: "token check", head: "no-such-branch-xyz", base });
const prAllowed = prTry.status === 422;
report("Create Pull Requests", { ok: prAllowed, status: prTry.status, msg: prTry.msg }, "Set Pull requests to 'Read and write'.");

console.log(failed
  ? "\nFix the FAIL lines above on the token (github.com/settings/personal-access-tokens), then run this again."
  : "\nAll good: this token can do everything the website needs.\n" +
    "If the website still fails, Vercel has a different/old token: paste THIS token into GITHUB_TOKEN\n" +
    "(Production environment ticked) and redeploy.");
