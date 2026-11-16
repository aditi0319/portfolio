/* Shared helpers used by both the public site and the admin panel */
window.PF = (() => {
  const CFG = window.SITE_CONFIG;

  const isConfigured = () =>
    !!CFG.supabaseUrl && !CFG.supabaseUrl.startsWith("YOUR_") &&
    !!CFG.supabaseAnonKey && !CFG.supabaseAnonKey.startsWith("YOUR_");

  const db = (isConfigured() && window.supabase)
    ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey)
    : null;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const cat = (id) => CFG.categories.find((c) => c.id === id) || { id, label: id || "Other", emoji: "✨" };

  /* Turn YouTube / Instagram / Vimeo links into embeddable URLs */
  function embedUrl(url) {
    try {
      const u = new URL(url);
      const h = u.hostname.replace(/^www\.|^m\./, "");
      if (h === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
      if (h.endsWith("youtube.com")) {
        const parts = u.pathname.split("/").filter(Boolean);
        if (parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live") return `https://www.youtube-nocookie.com/embed/${parts[1]}`;
        if (u.searchParams.get("v")) return `https://www.youtube-nocookie.com/embed/${u.searchParams.get("v")}`;
      }
      if (h.endsWith("instagram.com")) {
        const m = u.pathname.match(/\/(reel|reels|p|tv)\/([^/?#]+)/);
        if (m) return `https://www.instagram.com/${m[1] === "reels" ? "reel" : m[1]}/${m[2]}/embed`;
      }
      if (h.endsWith("vimeo.com")) {
        const id = u.pathname.split("/").filter(Boolean).pop();
        if (/^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
      }
    } catch (e) { /* not a URL */ }
    return null;
  }

  function youtubeThumb(url) {
    const e = embedUrl(url);
    const m = e && e.match(/youtube-nocookie\.com\/embed\/([\w-]+)/);
    return m ? `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` : null;
  }

  function detectType(url) {
    if (embedUrl(url)) return "embed";
    if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)) return "video";
    return "image";
  }

  const isMotion = (item) => item.type === "video" || item.type === "embed";

  /* Colourful placeholder used for demo items / embeds without a cover */
  const GRADS = {
    cafe: ["#F7D9C4", "#EFB99A", "#5a2f20"], food: ["#FFB36B", "#E8452C", "#fff"],
    jewellery: ["#1f5d4e", "#0b2a23", "#e2c27a"], product: ["#E1D6FF", "#B9A3FF", "#2f1f6e"],
    thumbnail: ["#FFE14D", "#FFB800", "#111"], rap: ["#2a0b0b", "#0c0c0c", "#ff3b3b"],
    reel: ["#FF9A8B", "#A64BF4", "#fff"], other: ["#9EE6C4", "#4FB3A0", "#0f3b33"]
  };
  function placeholder(item) {
    const g = GRADS[item.category] || GRADS.other;
    const c = cat(item.category);
    return `<div class="ph" style="--g1:${g[0]};--g2:${g[1]};--fg:${g[2]}">
      <span class="ph-emoji">${c.emoji}</span>
      <span class="ph-title">${esc(item.title)}</span>
    </div>`;
  }

  /* Preview for cards (small) */
  function cardMedia(item) {
    const play = isMotion(item) ? `<span class="play" aria-hidden="true"></span>` : "";
    if (item.cover_url) return `<img src="${esc(item.cover_url)}" alt="${esc(item.title)}" loading="lazy">${play}`;
    if (!item.media_url) return placeholder(item) + play;
    if (item.type === "image") return `<img src="${esc(item.media_url)}" alt="${esc(item.title)}" loading="lazy">`;
    if (item.type === "video") return `<video src="${esc(item.media_url)}#t=0.1" muted loop playsinline preload="metadata"></video>${play}`;
    const yt = youtubeThumb(item.media_url);
    if (yt) return `<img src="${yt}" alt="${esc(item.title)}" loading="lazy">${play}`;
    return placeholder(item) + play;
  }

  /* Full-size media for the lightbox */
  function fullMedia(item) {
    if (!item.media_url) return placeholder(item);
    if (item.type === "image") return `<img src="${esc(item.media_url)}" alt="${esc(item.title)}">`;
    if (item.type === "video") return `<video src="${esc(item.media_url)}" controls autoplay playsinline ${item.cover_url ? `poster="${esc(item.cover_url)}"` : ""}></video>`;
    const e = embedUrl(item.media_url);
    if (!e) return `<a class="ext" href="${esc(item.media_url)}" target="_blank" rel="noopener">Open video ↗</a>`;
    const vertical = /instagram|shorts/.test(item.media_url);
    return `<iframe class="${vertical ? "vertical" : ""}" src="${esc(e)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>`;
  }

  /* Demo items shown until Supabase is connected */
  const DEMO = [
    { id: "d1", title: "Latte Season", category: "cafe", type: "image", featured: true, client: "Brew & Bloom Café" },
    { id: "d2", title: "Café opening day", category: "reel", type: "video", featured: true },
    { id: "d3", title: "The Gold Edit", category: "jewellery", type: "image", featured: true },
    { id: "d4", title: "I tried 7 cafés in 1 day", category: "thumbnail", type: "image", featured: true },
    { id: "d5", title: "No Sleep Tour", category: "rap", type: "image", featured: true },
    { id: "d6", title: "Sizzle Sunday", category: "food", type: "image" },
    { id: "d7", title: "Glow Serum launch", category: "product", type: "image" },
    { id: "d8", title: "Street food reel", category: "reel", type: "video" },
    { id: "d9", title: "Winter menu", category: "cafe", type: "image" },
    { id: "d10", title: "Diwali collection", category: "jewellery", type: "image" },
    { id: "d11", title: "Burger drop", category: "food", type: "image" },
    { id: "d12", title: "Studio vlog cover", category: "thumbnail", type: "image" },
    { id: "d13", title: "Behind the bar", category: "reel", type: "video" },
    { id: "d14", title: "Mixtape cover", category: "rap", type: "image" }
  ];

  async function loadWorks() {
    if (!db) return DEMO;
    const { data, error } = await db.from("works").select("*")
      .order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    if (error) { console.error(error); return []; }
    return data;
  }

  return { CFG, db, isConfigured, esc, cat, embedUrl, detectType, isMotion, cardMedia, fullMedia, placeholder, loadWorks, DEMO };
})();
