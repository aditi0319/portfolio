/* Admin panel logic */
(() => {
  const { CFG, db, esc, cat, detectType, isMotion, cardMedia, DEMO } = window.PF;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const MAX_MB = 50;
  const DEMO_MODE = !db && new URLSearchParams(location.search).has("demo");

  /* ================= Backend (Supabase, or in-memory demo) ================= */
  const api = DEMO_MODE ? (() => {
    let rows = DEMO.map((d, i) => ({ ...d, sort_order: i }));
    return {
      list: async () => [...rows].sort((a, b) => a.sort_order - b.sort_order),
      insert: async (row) => { rows.push({ ...row, id: "n" + Date.now() }); },
      update: async (id, patch) => { rows = rows.map((r) => (r.id === id ? { ...r, ...patch } : r)); },
      remove: async (item) => { rows = rows.filter((r) => r.id !== item.id); },
      upload: async (file) => ({ url: URL.createObjectURL(file), path: null }),
      removeFile: async () => {}
    };
  })() : {
    list: async () => {
      const { data, error } = await db.from("works").select("*")
        .order("sort_order", { ascending: true }).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    insert: async (row) => { const { error } = await db.from("works").insert(row); if (error) throw error; },
    update: async (id, patch) => { const { error } = await db.from("works").update(patch).eq("id", id); if (error) throw error; },
    remove: async (item) => {
      const { error } = await db.from("works").delete().eq("id", item.id);
      if (error) throw error;
      await api.removeFile(item.storage_path); await api.removeFile(item.cover_path);
    },
    upload: async (file) => {
      const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
      const base = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "file";
      const path = `${new Date().getFullYear()}/${Date.now()}-${base}.${ext}`;
      const { error } = await db.storage.from(CFG.bucket).upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = db.storage.from(CFG.bucket).getPublicUrl(path);
      return { url: data.publicUrl, path };
    },
    removeFile: async (path) => { if (path) await db.storage.from(CFG.bucket).remove([path]); }
  };

  /* ================= Screens ================= */
  const show = (id) => ["setupScreen", "loginScreen", "dash"].forEach((s) => ($("#" + s).hidden = s !== id));
  $$("[data-cfg]").forEach((el) => { const v = CFG[el.dataset.cfg]; if (v) el.textContent = v; });

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2600);
  }

  async function boot() {
    if (DEMO_MODE) { show("dash"); $("#userEmail").textContent = "Demo mode · changes are not saved"; return startDash(); }
    if (!db) return show("setupScreen");
    const { data } = await db.auth.getSession();
    if (data.session) { show("dash"); $("#userEmail").textContent = data.session.user.email; startDash(); }
    else show("loginScreen");
  }

  /* ================= Login ================= */
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("#loginBtn"); btn.disabled = true; btn.textContent = "Logging in…"; $("#loginErr").textContent = "";
    const { error } = await db.auth.signInWithPassword({ email: $("#loginEmail").value.trim(), password: $("#loginPass").value });
    btn.disabled = false; btn.textContent = "Log in";
    if (error) { $("#loginErr").textContent = error.message; return; }
    boot();
  });
  $("#logoutBtn").addEventListener("click", async () => {
    if (DEMO_MODE) return (location.href = "index.html");
    await db.auth.signOut(); show("loginScreen");
  });

  /* ================= Dashboard ================= */
  let works = [], filter = "all", search = "", editing = null, source = "upload", pickedFile = null;

  let started = false;
  async function startDash() {
    if (!started) {
      started = true;
      $("#catInput").innerHTML = CFG.categories.map((c) => `<option value="${esc(c.id)}">${c.emoji} ${esc(c.label)}</option>`).join("");
      $("#sbCats").innerHTML = CFG.categories.map((c) => `<button class="sb-link" data-filter="${esc(c.id)}">${c.emoji} ${esc(c.label)} <small data-count="${esc(c.id)}"></small></button>`).join("");
      $$(".sb-link[data-filter]").forEach((b) => b.addEventListener("click", () => {
        filter = b.dataset.filter;
        $$(".sb-link[data-filter]").forEach((x) => x.classList.toggle("on", x === b));
        $("#listTitle").textContent = filter === "all" ? "All work" : filter === "featured" ? "Featured" : cat(filter).label;
        renderList();
      }));
    }
    await refresh();
  }

  async function refresh() {
    try { works = await api.list(); }
    catch (err) { toast("Couldn't load work: " + err.message); works = []; }
    $("#cAll").textContent = works.length;
    $$("[data-count]").forEach((s) => { s.textContent = works.filter((w) => w.category === s.dataset.count).length || ""; });
    renderList();
  }

  function visible() {
    let list = works;
    if (filter === "featured") list = list.filter((w) => w.featured);
    else if (filter !== "all") list = list.filter((w) => w.category === filter);
    if (search) list = list.filter((w) => (w.title + " " + (w.client || "")).toLowerCase().includes(search));
    return list;
  }

  function renderList() {
    const list = visible();
    $("#itemsEmpty").hidden = list.length > 0;
    const canMove = filter === "all" && !search;
    $("#items").innerHTML = list.map((w, i) => `
      <div class="it ${editing?.id === w.id ? "editing" : ""}" data-id="${esc(w.id)}">
        <div class="thumb">${cardMedia(w)}
          <span class="badge">${cat(w.category).emoji} ${esc(cat(w.category).label)}</span>
          ${w.featured ? `<span class="star">⭐</span>` : ""}
        </div>
        <div class="meta"><b>${esc(w.title)}</b><span>${w.type === "embed" ? "Linked video" : w.type === "video" ? "Video" : "Image"}${w.client ? " · " + esc(w.client) : ""}</span></div>
        <div class="acts">
          <button title="Move up" data-act="up" ${!canMove || i === 0 ? "disabled" : ""}>↑</button>
          <button title="Move down" data-act="down" ${!canMove || i === list.length - 1 ? "disabled" : ""}>↓</button>
          <button title="Feature on homepage" class="fav ${w.featured ? "on" : ""}" data-act="fav">★</button>
          <button title="Edit" data-act="edit">✎</button>
          <button title="Delete" class="del" data-act="del">🗑</button>
        </div>
      </div>`).join("");
  }

  $("#searchInput").addEventListener("input", (e) => { search = e.target.value.trim().toLowerCase(); renderList(); });

  $("#items").addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-act]"); if (!btn) return;
    const id = btn.closest(".it").dataset.id;
    const item = works.find((w) => String(w.id) === id);
    const act = btn.dataset.act;
    try {
      if (act === "edit") return startEdit(item);
      if (act === "fav") { await api.update(item.id, { featured: !item.featured }); toast(item.featured ? "Removed from homepage" : "Featured on homepage ⭐"); }
      if (act === "del") {
        if (!confirm(`Delete “${item.title}”? This can't be undone.`)) return;
        await api.remove(item); if (editing?.id === item.id) resetForm(); toast("Deleted");
      }
      if (act === "up" || act === "down") {
        const idx = works.indexOf(item), j = act === "up" ? idx - 1 : idx + 1;
        const other = works[j]; if (!other) return;
        // normalise order then swap
        await Promise.all(works.map((w, k) => (w.sort_order !== k ? api.update(w.id, { sort_order: k }).then(() => (w.sort_order = k)) : null)));
        await api.update(item.id, { sort_order: j }); await api.update(other.id, { sort_order: idx });
      }
      await refresh();
    } catch (err) { toast("Error: " + err.message); }
  });

  /* ================= Form ================= */
  function setSource(src) {
    source = src;
    $$("#sourceSeg button").forEach((b) => b.classList.toggle("on", b.dataset.src === src));
    $("#drop").hidden = src !== "upload";
    $("#linkWrap").hidden = src !== "link";
    updateCoverVisibility();
  }
  $$("#sourceSeg button").forEach((b) => b.addEventListener("click", () => setSource(b.dataset.src)));

  function updateCoverVisibility() {
    let motion = false;
    if (source === "upload") motion = pickedFile ? pickedFile.type.startsWith("video") : (editing && isMotion(editing));
    else { const v = $("#linkInput").value.trim(); motion = v ? detectType(v) !== "image" : false; }
    $("#coverWrap").hidden = !motion;
  }
  $("#linkInput").addEventListener("input", updateCoverVisibility);

  function setFile(file) {
    if (!file) return;
    if (!/^image\/|^video\//.test(file.type)) return toast("Please choose an image or video");
    if (file.size > MAX_MB * 1024 * 1024) return toast(`File is over ${MAX_MB} MB. Post it on Instagram/YouTube and paste the link instead.`);
    pickedFile = file;
    const url = URL.createObjectURL(file);
    $("#dropInner").innerHTML = (file.type.startsWith("video") ? `<video src="${url}" muted autoplay loop playsinline></video>` : `<img src="${url}" alt="">`)
      + `<small>${esc(file.name)} · ${(file.size / 1048576).toFixed(1)} MB · click to change</small>`;
    if (!$("#titleInput").value) $("#titleInput").value = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
    updateCoverVisibility();
  }
  $("#fileInput").addEventListener("change", (e) => setFile(e.target.files[0]));
  const drop = $("#drop");
  ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", (e) => setFile(e.dataTransfer.files[0]));

  const DROP_DEFAULT = $("#dropInner").innerHTML;
  function resetForm() {
    editing = null; pickedFile = null;
    $("#workForm").reset(); $("#dropInner").innerHTML = DROP_DEFAULT;
    $("#formTitle").textContent = "Add new work"; $("#saveBtn").textContent = "Publish to portfolio";
    $("#cancelEdit").hidden = true; $("#formErr").textContent = "";
    setSource("upload"); renderList();
  }
  $("#cancelEdit").addEventListener("click", resetForm);
  $("#newBtn").addEventListener("click", () => { resetForm(); $("#titleInput").focus(); window.scrollTo({ top: 0, behavior: "smooth" }); });

  function startEdit(item) {
    resetForm(); editing = item;
    $("#formTitle").textContent = "Edit work"; $("#saveBtn").textContent = "Save changes"; $("#cancelEdit").hidden = false;
    $("#titleInput").value = item.title; $("#catInput").value = item.category;
    $("#clientInput").value = item.client || ""; $("#featInput").checked = !!item.featured;
    if (item.type === "embed" || !item.storage_path) { setSource("link"); $("#linkInput").value = item.media_url || ""; }
    else { setSource("upload"); $("#dropInner").innerHTML = cardMedia(item).replace(/<span class="play"[^>]*><\/span>/, "") + `<small>Current file · click or drop to replace</small>`; }
    updateCoverVisibility(); renderList();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $("#workForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#formErr"); err.textContent = "";
    const title = $("#titleInput").value.trim();
    if (!title) return (err.textContent = "Add a title");

    const row = { title, category: $("#catInput").value, client: $("#clientInput").value.trim() || null, featured: $("#featInput").checked };
    const oldFiles = [];

    const saveBtn = $("#saveBtn"); saveBtn.disabled = true; $("#progress").hidden = false;
    try {
      if (source === "upload") {
        if (pickedFile) {
          saveBtn.textContent = "Uploading…";
          const up = await api.upload(pickedFile);
          Object.assign(row, { media_url: up.url, storage_path: up.path, type: pickedFile.type.startsWith("video") ? "video" : "image" });
          if (editing?.storage_path) oldFiles.push(editing.storage_path);
        } else if (!editing) throw new Error("Choose a file to upload");
        else if (!editing.storage_path) throw new Error("Choose a file to upload");
      } else {
        const url = $("#linkInput").value.trim();
        if (!/^https?:\/\//i.test(url)) throw new Error("Paste a full link starting with https://");
        Object.assign(row, { media_url: url, type: detectType(url), storage_path: null });
        if (editing?.storage_path) oldFiles.push(editing.storage_path);
      }

      const coverFile = $("#coverInput").files[0];
      const finalType = row.type || editing?.type;
      if (coverFile && finalType !== "image") {
        saveBtn.textContent = "Uploading cover…";
        const cv = await api.upload(coverFile);
        Object.assign(row, { cover_url: cv.url, cover_path: cv.path });
        if (editing?.cover_path) oldFiles.push(editing.cover_path);
      } else if (finalType === "image" && editing?.cover_path) {
        Object.assign(row, { cover_url: null, cover_path: null }); oldFiles.push(editing.cover_path);
      }

      saveBtn.textContent = "Saving…";
      if (editing) { await api.update(editing.id, row); toast("Changes saved ✓"); }
      else {
        const minOrder = works.reduce((m, w) => Math.min(m, w.sort_order ?? 0), 0);
        await api.insert({ ...row, sort_order: minOrder - 1 }); toast("Published to your portfolio 🎉");
      }
      await Promise.all(oldFiles.map((p) => api.removeFile(p).catch(() => {})));
      resetForm(); await refresh();
    } catch (ex) {
      err.textContent = ex.message || "Something went wrong";
    } finally {
      saveBtn.disabled = false; $("#progress").hidden = true;
      saveBtn.textContent = editing ? "Save changes" : "Publish to portfolio";
    }
  });

  if (db) db.auth.onAuthStateChange((evt) => { if (evt === "SIGNED_OUT") show("loginScreen"); });
  boot();
})();
