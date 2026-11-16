/* Public site logic */
(async () => {
  const { CFG, esc, cat, isMotion, cardMedia, fullMedia, loadWorks } = window.PF;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- fill in text from config ---------- */
  $$("[data-cfg]").forEach((el) => { const v = CFG[el.dataset.cfg]; if (v) el.textContent = v; });
  document.title = `${CFG.name} · ${CFG.role}`;
  $("#year").textContent = new Date().getFullYear();

  const waLink = `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(CFG.whatsappMessage || "")}`;
  $$(".js-wa").forEach((a) => { a.href = waLink; a.target = "_blank"; a.rel = "noopener"; });
  $$(".js-ig").forEach((a) => { a.href = `https://instagram.com/${CFG.instagram}`; a.target = "_blank"; a.rel = "noopener"; });
  $$(".js-mail").forEach((a) => { a.href = `mailto:${CFG.email}`; });

  /* ---------- mobile menu ---------- */
  const links = $("#links");
  $("#menuBtn").addEventListener("click", () => links.classList.toggle("open"));
  $$("a", links).forEach((a) => a.addEventListener("click", () => links.classList.remove("open")));

  /* ---------- rotating stats ---------- */
  const statCard = $("#statCard");
  const stats = CFG.stats || [];
  statCard.innerHTML = `
    ${stats[0]?.note ? `<div class="hand">${esc(stats[0].note)}</div>` : ""}
    <div class="dots">${stats.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>
    <b>${esc(stats[0]?.value || "")}</b><span>${esc(stats[0]?.label || "")}</span>`;
  if (stats.length > 1) {
    let si = 0;
    setInterval(() => {
      si = (si + 1) % stats.length;
      const b = $("b", statCard), s = $("span", statCard);
      b.style.opacity = 0;
      setTimeout(() => { b.textContent = stats[si].value; s.textContent = stats[si].label; b.style.opacity = 1; }, 250);
      $$(".dots i", statCard).forEach((d, i) => d.classList.toggle("on", i === si));
    }, 3200);
  }

  /* ---------- marquee ---------- */
  const words = CFG.categories.filter((c) => c.id !== "other").map((c) => c.label);
  const chunk = words.map((w) => `<span>${esc(w)}</span><span class="star">✦</span>`).join("");
  $("#marquee").innerHTML = chunk + chunk + chunk + chunk;

  /* ---------- services ---------- */
  $("#servicesGrid").innerHTML = (CFG.services || []).map((s) => `
    <div class="svc bg-${esc(s.color || "lemon")} reveal">
      <div class="e">${esc(s.emoji)}</div><h3>${esc(s.title)}</h3><p>${esc(s.desc)}</p>
      ${s.price ? `<div class="price">${esc(s.price)}</div>` : ""}
    </div>`).join("");

  /* ---------- load work ---------- */
  const works = await loadWorks();

  /* lightbox */
  let lbList = [], lbIndex = 0;
  const lb = $("#lightbox");
  function openLB(list, index) {
    lbList = list; lbIndex = index; renderLB();
    lb.classList.add("open"); lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function renderLB() {
    const it = lbList[lbIndex];
    $("#lbMedia").innerHTML = fullMedia(it);
    const c = cat(it.category);
    $("#lbInfo").innerHTML = `<b>${esc(it.title)}</b><span>${c.emoji} ${esc(c.label)}${it.client ? " · for " + esc(it.client) : ""}</span>`;
    $$(".lb-nav", lb).forEach((b) => (b.style.visibility = lbList.length > 1 ? "visible" : "hidden"));
  }
  function closeLB() {
    lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true");
    $("#lbMedia").innerHTML = ""; document.body.style.overflow = "";
  }
  const step = (d) => { lbIndex = (lbIndex + d + lbList.length) % lbList.length; renderLB(); };
  $(".lb-close").addEventListener("click", closeLB);
  $(".lb-nav.prev").addEventListener("click", () => step(-1));
  $(".lb-nav.next").addEventListener("click", () => step(1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLB(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLB();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });

  /* ---------- hero bento slots ---------- */
  const used = new Set();
  const pick = (fn) => {
    const it = works.find((w) => !used.has(w.id) && w.featured && fn(w)) || works.find((w) => !used.has(w.id) && fn(w));
    if (it) used.add(it.id);
    return it;
  };
  const slots = {
    heroReel: pick(isMotion),
    heroWide: pick((w) => w.category === "thumbnail") || pick(() => true),
    heroPoster: pick((w) => !isMotion(w)),
    heroExtra1: pick((w) => !isMotion(w)),
    heroExtra2: pick(() => true)
  };
  const heroList = Object.values(slots).filter(Boolean);
  Object.entries(slots).forEach(([id, it]) => {
    const el = document.getElementById(id);
    if (!it) { el.style.background = "var(--pink)"; el.innerHTML = `<div class="ph" style="--g1:#FFB3D1;--g2:#FF8A6B;--fg:#1b1b1f"><span class="ph-emoji">✨</span><span class="ph-title">New work soon</span></div>`; return; }
    el.href = "#";
    el.innerHTML = cardMedia(it) + `<span class="tag">${cat(it.category).emoji} ${esc(it.title)}</span>`;
    el.addEventListener("click", (e) => { e.preventDefault(); openLB(heroList, heroList.indexOf(it)); });
  });

  /* ---------- category chips (jump to filtered work) ---------- */
  const present = CFG.categories.filter((c) => works.some((w) => w.category === c.id));
  $("#catChips").innerHTML = (present.length ? present : CFG.categories)
    .map((c) => `<button data-cat="${esc(c.id)}">${c.emoji} ${esc(c.label)}</button>`).join("");
  $$("#catChips button").forEach((b) => b.addEventListener("click", () => {
    setFilter(b.dataset.cat);
    document.getElementById("work").scrollIntoView();
  }));

  /* ---------- work grid + filters ---------- */
  const ARS = ["4/5", "1/1", "3/4", "4/5", "9/16", "1/1", "3/4"];
  let current = "all";
  function setFilter(id) {
    current = id;
    $$("#filters button").forEach((b) => b.classList.toggle("on", b.dataset.cat === id));
    renderGrid();
  }
  const filterCats = [{ id: "all", label: "All", emoji: "" }, ...present];
  $("#filters").innerHTML = filterCats.map((c) => {
    const n = c.id === "all" ? works.length : works.filter((w) => w.category === c.id).length;
    return `<button data-cat="${esc(c.id)}" class="${c.id === "all" ? "on" : ""}">${c.emoji} ${esc(c.label)}<small>${n}</small></button>`;
  }).join("");
  $$("#filters button").forEach((b) => b.addEventListener("click", () => setFilter(b.dataset.cat)));

  function renderGrid() {
    const list = current === "all" ? works : works.filter((w) => w.category === current);
    $("#workCount").textContent = `${list.length} piece${list.length === 1 ? "" : "s"}`;
    $("#workEmpty").hidden = list.length > 0;
    const grid = $("#workGrid");
    grid.innerHTML = list.map((it, i) => `
      <a href="#" class="tile${!it.media_url && !it.cover_url ? " has-ph" : ""}" data-i="${i}" style="--ar:${it.category === "thumbnail" ? "16/9" : isMotion(it) ? "9/16" : ARS[i % ARS.length]};animation-delay:${Math.min(i, 12) * 40}ms">
        ${cardMedia(it)}
        <div class="over"><b>${esc(it.title)}</b><span>${cat(it.category).emoji} ${esc(cat(it.category).label)}${it.client ? " · " + esc(it.client) : ""}</span></div>
      </a>`).join("");
    $$(".tile", grid).forEach((t) => t.addEventListener("click", (e) => { e.preventDefault(); openLB(list, +t.dataset.i); }));
    wireVideos(grid);
  }
  renderGrid();

  /* ---------- reels row ---------- */
  const reels = works.filter((w) => isMotion(w) || w.category === "reel");
  const reelRow = $("#reelRow");
  if (!reels.length) { $("#reels").style.display = "none"; }
  reelRow.innerHTML = reels.map((it, i) => `
    <div class="reel" data-i="${i}">${cardMedia(it)}
      <div class="over"><b>${esc(it.title)}</b></div></div>`).join("");
  $$(".reel", reelRow).forEach((r) => r.addEventListener("click", () => openLB(reels, +r.dataset.i)));
  $$(".row-nav button").forEach((b) => b.addEventListener("click", () =>
    reelRow.scrollBy({ left: +b.dataset.dir * reelRow.clientWidth * 0.8, behavior: "smooth" })));
  wireVideos(reelRow);
  wireVideos(document.querySelector(".bento"));

  /* autoplay muted video previews when visible */
  function wireVideos(root) {
    const vids = $$("video", root);
    if (!vids.length) return;
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      const v = en.target;
      if (en.isIntersecting) { v.play().catch(() => {}); } else { v.pause(); }
    }), { threshold: 0.4 });
    vids.forEach((v) => { v.muted = true; io.observe(v); });
  }

  /* ---------- reveal on scroll ---------- */
  const rio = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("in"); rio.unobserve(en.target); }
  }), { threshold: 0.12 });
  $$(".reveal").forEach((el) => rio.observe(el));

  /* ---------- active nav link ---------- */
  const navLinks = $$("#links a");
  const sio = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const id = en.target.classList.contains("bento") ? "#top" : "#" + en.target.id;
    navLinks.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  [$(".bento"), ...["work", "reels", "services", "contact"].map((id) => document.getElementById(id))]
    .forEach((el) => el && sio.observe(el));
})();
