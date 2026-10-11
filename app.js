(() => {
  const $ = (id) => document.getElementById(id);
  $("year").textContent = new Date().getFullYear();
  const cfg = window.RI47_CONFIG || {};
  if (cfg.CONTACT_EMAIL) $("contact-link").href = `mailto:${cfg.CONTACT_EMAIL}`;
  const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes("YOUR-PROJECT") && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");
  const grid = $("project-grid");

  const escapeHtml = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const safeUrl = (s = "") => { try { const u = new URL(s); return ["http:", "https:"].includes(u.protocol) ? u.href : ""; } catch { return ""; } };

  function projectCard(p) {
    const iconUrl = safeUrl(p.icon_url);
    const download = safeUrl(p.download_url);
    return `<article class="project-card">
      <div class="project-top"><div class="app-icon">${iconUrl ? `<img src="${escapeHtml(iconUrl)}" alt="" loading="lazy" onerror="this.remove()">` : `<span>${escapeHtml((p.name || "P").slice(0,2).toUpperCase())}</span>`}</div><span class="project-platform">${escapeHtml(p.platform || "Project")}</span></div>
      <div class="project-title-row"><h3>${escapeHtml(p.name)}</h3>${p.featured ? '<span class="featured-label">FEATURED</span>' : ""}</div>
      <p class="project-description">${escapeHtml(p.description)}</p>
      <div class="project-tags">${p.category ? `<span>${escapeHtml(p.category)}</span>` : ""}${p.version ? `<span>v${escapeHtml(p.version)}</span>` : ""}</div>
      <div class="project-card-footer"><button class="text-link release-open" data-id="${escapeHtml(p.id)}">Release details <span>↗</span></button>${download ? `<a class="download-link" href="${escapeHtml(download)}" target="_blank" rel="noopener noreferrer">Download <span>↓</span></a>` : ""}</div>
    </article>`;
  }

  function showDetails(p) {
    const iconUrl = safeUrl(p.icon_url);
    const projectUrl = safeUrl(p.project_url);
    const download = safeUrl(p.download_url);
    $("release-content").innerHTML = `<p class="eyebrow">PROJECT RELEASE</p><div class="dialog-title">${iconUrl ? `<img src="${escapeHtml(iconUrl)}" alt="" class="dialog-icon">` : ""}<div><h2>${escapeHtml(p.name)}</h2><p class="muted">${escapeHtml(p.platform || "Project")}${p.version ? " · Version " + escapeHtml(p.version) : ""}${p.release_date ? " · " + escapeHtml(p.release_date) : ""}</p></div></div><p class="dialog-description">${escapeHtml(p.description)}</p><h3>What's new</h3><div class="changelog">${escapeHtml(p.changelog || "No release notes have been added yet.")}</div><div class="hero-actions">${download ? `<a class="button button-dark" href="${escapeHtml(download)}" target="_blank" rel="noopener noreferrer">Download release <span>↓</span></a>` : ""}${projectUrl ? `<a class="button button-outline" href="${escapeHtml(projectUrl)}" target="_blank" rel="noopener noreferrer">Project page ↗</a>` : ""}</div>`;
    $("release-dialog").showModal();
  }

  async function loadProjects() {
    if (!configured || !window.supabase) {
      grid.innerHTML = "";
      $("project-count").textContent = "GETTING READY";
      $("setup-notice").classList.remove("hidden");
      $("empty-state").classList.add("hidden");
      return;
    }
    try {
      const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      const { data, error } = await client.from("projects").select("*").eq("published", true).order("featured", { ascending: false }).order("updated_at", { ascending: false });
      if (error) throw error;
      const projects = data || [];
      grid.innerHTML = projects.map(projectCard).join("");
      $("project-count").textContent = `${projects.length} ${projects.length === 1 ? "PROJECT" : "PROJECTS"}`;
      $("empty-state").classList.toggle("hidden", projects.length > 0);
      grid.querySelectorAll(".release-open").forEach(btn => btn.addEventListener("click", () => {
        const p = projects.find(item => String(item.id) === btn.dataset.id);
        if (p) showDetails(p);
      }));
    } catch (e) {
      grid.innerHTML = "";
      $("project-count").textContent = "TEMPORARILY UNAVAILABLE";
      $("setup-notice").classList.remove("hidden");
      console.error("Could not load projects", e);
    }
  }

  $("close-dialog").addEventListener("click", () => $("release-dialog").close());
  $("release-dialog").addEventListener("click", e => { if (e.target === $("release-dialog")) $("release-dialog").close(); });
  loadProjects();
})();