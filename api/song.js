// POST /api/song   (needs "Authorization: Bearer <token>" from /api/login)
//   Add:   { category, title, lyrics, name }
//   Edit:  { category, title, lyrics, name, originalTitle }
//
// Creates a new branch with one commit (lyrics/<category>/<title>.txt added or changed; on a
// rename / category move the old file is removed) and opens a Pull Request. The song goes live
// only when the admin merges the Pull Request on GitHub; Vercel then rebuilds the site.
const { env, json, readBody, checkToken, bearer, gh } = require("./_lib");

const BAD_CHARS = /[\\/:*?"<>|\u0000-\u001f]/;   // not allowed in file names
const MAX_LYRICS = 20000;

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { error: "Use POST." });
  if (!checkToken(bearer(req))) return json(res, 401, { error: "Your login has expired. Please log in again." });
  for (const k of ["GITHUB_TOKEN", "GITHUB_REPO"])
    if (!env(k)) return json(res, 500, { error: `The server is not set up yet (${k} is missing in Vercel settings).` });

  // ----- Check the input -----
  const b = readBody(req);
  const title = String(b.title || "").normalize("NFC").replace(/\s+/g, " ").trim();
  const lyrics = String(b.lyrics || "").replace(/\r\n?/g, "\n").trim();
  const name = String(b.name || "").replace(/\s+/g, " ").trim().slice(0, 60);
  const category = String(b.category || "");
  const originalTitle = b.originalTitle ? String(b.originalTitle).normalize("NFC") : null;
  if (title.length < 2 || title.length > 80) return json(res, 400, { error: "Song name must be 2 to 80 characters." });
  if (BAD_CHARS.test(title) || title.startsWith(".")) return json(res, 400, { error: 'Song name can\'t contain \\ / : * ? " < > |' });
  if (!lyrics) return json(res, 400, { error: "Please paste the lyrics." });
  if (lyrics.length > MAX_LYRICS) return json(res, 400, { error: `Lyrics are too long (max ${MAX_LYRICS} characters).` });

  const repo = env("GITHUB_REPO"), base = env("GITHUB_BRANCH") || "main";
  try {
    // ----- Current state of the repo -----
    const ref = await gh(`/repos/${repo}/git/ref/heads/${encodeURIComponent(base)}`);
    const baseSha = ref.object.sha;
    const baseCommit = await gh(`/repos/${repo}/git/commits/${baseSha}`);
    const tree = await gh(`/repos/${repo}/git/trees/${baseCommit.tree.sha}?recursive=1`);

    const songsEntry = tree.tree.find(e => e.path === "songs.js");
    if (!songsEntry) return json(res, 500, { error: "songs.js not found in the repo." });
    const songsSrc = Buffer.from((await gh(`/repos/${repo}/git/blobs/${songsEntry.sha}`)).content, "base64").toString("utf8");
    const CATEGORIES = new Function(songsSrc + "; return CATEGORIES;")();
    const cat = CATEGORIES.find(c => c.bg === category);
    if (!cat) return json(res, 400, { error: "Please choose a category." });

    const existing = new Map();                    // song title → file path
    for (const e of tree.tree) {
      const m = /^lyrics\/([^/]+)\/(.+)\.txt$/.exec(e.path);
      if (m && e.type === "blob") existing.set(m[2].normalize("NFC"), e.path);
    }

    // ----- Files to change -----
    const newPath = `lyrics/${cat.bg}/${title}.txt`;
    const changes = [{ path: newPath, mode: "100644", type: "blob", content: lyrics + "\n" }];
    if (originalTitle) {
      const oldPath = existing.get(originalTitle);
      if (!oldPath) return json(res, 404, { error: `"${originalTitle}" no longer exists on the site.` });
      if (title !== originalTitle && existing.has(title)) return json(res, 409, { error: `A song called "${title}" already exists.` });
      if (oldPath !== newPath) changes.push({ path: oldPath, mode: "100644", type: "blob", sha: null });  // rename / move
    } else if (existing.has(title)) {
      return json(res, 409, { error: `A song called "${title}" already exists. Open it and use Edit instead.` });
    }

    // ----- One commit on a new branch, then a Pull Request -----
    const action = originalTitle ? "Edit" : "Add";
    const what = originalTitle && originalTitle !== title ? `${originalTitle} → ${title}` : title;
    const by = name ? `Submitted by ${name} via the website.` : "Submitted via the website.";
    const newTree = await gh(`/repos/${repo}/git/trees`, { method: "POST", body: { base_tree: baseCommit.tree.sha, tree: changes } });
    const commit = await gh(`/repos/${repo}/git/commits`, {
      method: "POST",
      body: { message: `${action} song: ${what} (${cat.name})\n\n${by}`, tree: newTree.sha, parents: [baseSha] },
    });
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "song";
    const branch = `song/${slug}-${Date.now().toString(36)}`;
    await gh(`/repos/${repo}/git/refs`, { method: "POST", body: { ref: "refs/heads/" + branch, sha: commit.sha } });
    const pr = await gh(`/repos/${repo}/pulls`, {
      method: "POST",
      body: {
        title: `${action} song: ${what}`,
        head: branch,
        base,
        body: [
          `**${action === "Add" ? "New song" : "Song edit"}** submitted from the bhajana website.`,
          "",
          `- **Category:** ${cat.name}`,
          `- **Song:** ${what}`,
          `- **Submitted by:** ${name || "(not given)"}`,
          "",
          "Check the lyrics in **Files changed**.",
          "**Merge** this pull request to publish it on the website (live about a minute later).",
          "**Close** it to reject.",
        ].join("\n"),
      },
    });
    return json(res, 200, { ok: true, pr: pr.html_url, number: pr.number });
  } catch (e) {
    const hint = e.status === 401 || e.status === 403 || e.status === 404
      ? " (check GITHUB_TOKEN permissions and GITHUB_REPO in Vercel settings)" : "";
    return json(res, 502, { error: "Could not save to GitHub: " + e.message + hint });
  }
};
