# Admin: adding and editing songs from the website

People with the admin password can add new songs, or edit existing ones, from the website.
Every addition or change becomes a **Pull Request** on GitHub and only goes live after you approve it.

## How it works

1. On the site, tap **🔐 Admin login** at the bottom of the song index and enter the password.
2. **➕ Add song**: choose a category, type the song name, paste the lyrics, and tap **Send for approval**.
   To change a song, open it and tap **✏️ Edit this song**.
3. GitHub opens a Pull Request called "Add song: …" or "Edit song: …" on the repo.
   You'll get an email or app notification for it.
4. Open the Pull Request on GitHub (website or app) and check the lyrics under **Files changed**.
   - **Merge** it to publish. Vercel rebuilds the site, and the song appears about a minute later.
   - **Close** it to reject.

New songs are saved as `lyrics/<category>/<Song name>.txt` and appear at the end of their category.
To put them in a different position, add their titles to `songs.js` in the order you want.

## One-time setup

### 1. Create a GitHub token

1. On GitHub, go to **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. **Token name:** `bhajana-site`. **Expiration:** your choice. When it expires, create a new one and update Vercel.
3. **Repository access:** *Only select repositories*, then choose `ayyappa-bhajana`.
4. **Permissions → Repository permissions:**
   - **Contents:** Read and write
   - **Pull requests:** Read and write
5. Click **Generate token** and copy it. GitHub only shows it once.

### 2. Add the settings in Vercel

In Vercel, go to the project's **Settings → Environment Variables** and add:

| Name | Value |
|---|---|
| `ADMIN_PASSWORD` | The password contributors will use |
| `GITHUB_TOKEN` | The token from step 1 |
| `GITHUB_REPO` | `Manikantha-Sai/ayyappa-bhajana` |
| `GITHUB_BRANCH` | `main` |
| `SESSION_SECRET` | Any long random text (optional, makes logins harder to forge) |

Then go to **Deployments → ⋯ → Redeploy**, so the new settings take effect.

The password and the token are stored only in Vercel. They are never sent to visitors' browsers or saved in the repo.

### To change the password

Change `ADMIN_PASSWORD` in Vercel and redeploy. Anyone who was logged in is logged out.

## Working on songs locally

Lyrics files live in `lyrics/<category>/`. After changing them, run:

```
node build.mjs
```

This rebuilds `lyrics.js`. Vercel runs the same command automatically on every deploy.

Admin login only works on the online site, not when `index.html` is opened from a folder.
