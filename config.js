/* =========================================================
   SITE CONFIG — edit this file to make the site yours
   ========================================================= */
window.SITE_CONFIG = {
  /* ---- Supabase (for the admin panel). Leave as-is to run in demo mode. ----
     Find these in Supabase → Project Settings → API (Data API / API Keys).
     Use the "Project URL" and the "anon public" (or "publishable") key.
     NEVER paste the service_role / secret key here. */
  supabaseUrl: "https://htltyamlzeorkepfrnne.supabase.co",
  supabaseAnonKey: "sb_publishable_kC4iTMJ9Pa5ugmC9Zuxhtg_M6osVVGP",
  bucket: "portfolio",

  /* ---- About you ---- */
  name: "Aditi Shrivastava",
  role: "Video editor & graphic designer",
  greeting: "hey there 👋",
  headline: "I edit Reels & design posters that sell.",
  intro: "Cafés, food spots, jewellery brands, rappers and creators. If it needs to look good online, I make it.",
  city: "India",

  /* ---- Contact ---- */
  whatsapp: "9977532259",          // country code + number, no + or spaces
  whatsappMessage: "Hi! I saw your portfolio and want to discuss a project.",
  instagram: "aditopia7",           // without @
  email: "shrivastavaaditi3457@gmail.com",

  /* ---- Stats card ---- */
  stats: [
    { value: "25+", label: "projects delivered", note: "and counting!" },
    { value: "10+",  label: "happy clients" },
    { value: "50k+",  label: "views generated" }
  ],

  /* ---- Categories (id is saved in the database, label is shown) ---- */
  categories: [
    { id: "cafe",      label: "Café posters", emoji: "☕" },
    { id: "food",      label: "Food photos",  emoji: "🍔" },
    { id: "jewellery", label: "Jewellery",    emoji: "💍" },
    { id: "product",   label: "Product ads",  emoji: "🧴" },
    { id: "thumbnail", label: "Thumbnails",   emoji: "▶️" },
    { id: "rap",       label: "Rap posters",  emoji: "🎤" },
    { id: "reel",      label: "Reels",        emoji: "🎬" },
    { id: "other",     label: "Other",        emoji: "✨" }
  ],

  /* ---- Services section ---- */
  services: [
    { emoji: "🎬", title: "Reels editing",     desc: "Hooks, captions, transitions, trending audio sync. Ready to post.", price: "from ₹499", color: "coral" },
    { emoji: "☕", title: "Café & food posters", desc: "Menus, offers, new launches and festive posts that make people hungry.", price: "from ₹299", color: "lemon" },
    { emoji: "💍", title: "Product & jewellery ads", desc: "Clean, premium creatives for launches, sales and catalogues.", price: "from ₹399", color: "lilac" },
    { emoji: "▶️", title: "Thumbnails & covers", desc: "Click-worthy YouTube thumbnails, rap posters and album covers.", price: "from ₹199", color: "mint" }
  ]
};
