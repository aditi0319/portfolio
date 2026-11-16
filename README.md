# Portfolio website (Bento Candy)

A colourful portfolio for Reels, café & food posters, jewellery/product ads, thumbnails and rap posters, with a private **admin panel** where you add, edit, reorder, feature and delete your work (images and videos) without touching code.

```
index.html          ← the public website
style.css           ← all colours / fonts / layout (edit :root to restyle)
script.js           ← website logic (filters, lightbox, reels row…)
admin.html          ← your private admin panel  (yoursite.com/admin.html)
admin.css / admin.js
shared.js           ← helpers used by both pages
config.js           ← YOUR details: name, links, stats, services, Supabase keys
supabase-setup.sql  ← one-time database setup
```

---

## 1. Preview it right now (demo mode)

Just open `index.html` in your browser. Until Supabase is connected it shows colourful sample cards.

To try the admin panel without a database, open `admin.html?demo`. Nothing is saved in demo mode.

> Tip: in VS Code, install the **Live Server** extension → right-click `index.html` → *Open with Live Server*.

## 2. Make it yours

Open **`config.js`** and change your name, headline, WhatsApp number, Instagram handle, email, stats and services/prices.

Want different colours? Edit the variables at the top of **`style.css`** (`--lilac`, `--lemon`, `--mint`, `--coral`…).

## 3. Set up the admin panel (free, about 10 minutes)

1. Go to **supabase.com** → sign up → **New project** (any name, choose region *Mumbai* for India, save the DB password somewhere).
2. Open **SQL Editor** → New query → paste everything from `supabase-setup.sql`.
   **First replace every `YOUR_EMAIL@example.com` with your email** → click **Run**.
3. Create your login: **Authentication → Users → Add user → Create new user**. Enter the same email and a strong password, and tick **Auto Confirm User**.
4. Block strangers from signing up: **Authentication → Sign In / Providers** → turn **off** “Allow new users to sign up”.
   (Even if you forget, the SQL rules only let *your* email change anything.)
5. Get your keys: **Project Settings → API** (or the **Connect** button). Copy the **Project URL** and the **anon / publishable** key into `config.js`:
   ```js
   supabaseUrl: "https://abcdxyz.supabase.co",
   supabaseAnonKey: "eyJhbGciOi... or sb_publishable_...",
   ```
   ⚠️ Never use the `service_role` / secret key. That key gives full access to your database.
6. Open `admin.html` → log in → start uploading 🎉

### Using the admin panel
- **Upload file:** drag in an image or video (max 50 MB). It's stored in Supabase.
- **Paste link:** Instagram reel, YouTube (normal or Shorts), Vimeo, or any direct image/video URL. **Recommended for Reels**, because it saves your free storage (1 GB on the free plan). Add a cover image so the card looks nice.
- **⭐ Feature:** featured items show in the colourful blocks at the top of the homepage.
- **↑ ↓:** reorder (in the “All work” view). **✎** edit, **🗑** delete (also deletes the file).
- Each category only appears on the site once it has at least one item.

## 4. Put it online (free)

**Easiest: Netlify Drop**
1. Go to **app.netlify.com/drop**
2. Drag the whole project folder in. You get a live link in seconds.
3. Optional: Site settings → change the site name to `yourname.netlify.app`, or connect your own domain.

To update the code later, drag the folder in again (Deploys → drag & drop). **Adding or removing work doesn't need a redeploy**, because the admin panel updates the live site instantly.

**Alternatives:** GitHub Pages or Vercel work too, since it's a plain static site.

## 5. Tips
- Compress images before uploading (squoosh.app or tinypng.com). Big files mean a slow site.
- Use 1080×1350 for posters and 1280×720 for thumbnails. For Reels, link from Instagram.
- Put the site link in your Instagram bio and in every outreach DM.
- The free Supabase plan pauses a project after about 7 days with no activity. Opening the admin or site regularly keeps it awake, and you can restore it from the dashboard if it pauses.
