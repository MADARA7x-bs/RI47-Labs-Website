(() => {
  const $ = id => document.getElementById(id);
  const cfg = window.RI47_CONFIG || {};
  const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes("YOUR-PROJECT") && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");
  if (!configured || !window.supabase) { $("admin-config-warning").classList.remove("hidden"); return; }
  const db = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  let projects = [];
  const fields = ["name","description","platform","category","version","date","icon","url","download","changelog","featured"];
  const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const setMessage = (id, msg, bad=false) => { $(id).textContent = msg; $(id).className = "form-message" + (bad ? " error" : " success"); };
  const getVal = id => $(id).value.trim();
  const setVal = (id, value) => { $(id).value = value ?? ""; };
  const isAdmin = async session => {
    if (!session?.user?.email) return false;
    const { data, error } = await db.from("admin_users").select("user_id").eq("user_id", session.user.id).maybeSingle();
    return !error && !!data;
  };
  async function updateAuthUI() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) { $("login-panel").classList.remove("hidden"); $("dashboard").classList.add("hidden"); return; }
    if (!(await isAdmin(session))) {
      await db.auth.signOut();
      $("login-panel").classList.remove("hidden");
      $("dashboard").classList.add("hidden");
      setMessage("login-message", "This account is not authorised as an admin.", true);
      return;
    }
    $("login-panel").classList.add("hidden"); $("dashboard").classList.remove("hidden");
    await loadProjects();
  }
  $("login-form").addEventListener("submit", async e => {
    e.preventDefault(); setMessage("login-message", "Signing in…");
    const { error } = await db.auth.signInWithPassword({ email: getVal("login-email"), password: $("login-password").value });
    if (error) { setMessage("login-message", error.message, true); return; }
    await updateAuthUI();
  });
  $("sign-out").addEventListener("click", async () => { await db.auth.signOut(); resetForm(); await updateAuthUI(); });
  db.auth.onAuthStateChange(() => { setTimeout(updateAuthUI, 0); });

  async function loadProjects() {
    $("admin-project-list").innerHTML = '<p class="muted">Loading projects…</p>';
    const { data, error } = await db.from("projects").select("*").order("updated_at", { ascending: false });
    if (error) { $("admin-project-list").innerHTML = `<p class="form-message error">${esc(error.message)}</p>`; return; }
    projects = data || [];
    $("admin-count").textContent = `${projects.length} ITEM${projects.length === 1 ? "" : "S"}`;
    if (!projects.length) { $("admin-project-list").innerHTML = '<p class="muted">No projects yet. Add your first one using the form.</p>'; return; }
    $("admin-project-list").innerHTML = projects.map(p => `<article class="admin-project"><div class="admin-project-info"><strong>${esc(p.name)}</strong><span>${esc(p.platform || "Project")} ${p.version ? "· v"+esc(p.version) : ""} · ${p.published ? "Published" : "Draft"}</span></div><div class="admin-project-actions"><button class="mini-button" data-edit="${esc(p.id)}">Edit</button><button class="mini-button" data-publish="${esc(p.id)}">${p.published ? "Unpublish" : "Publish"}</button><button class="mini-button danger" data-delete="${esc(p.id)}">Delete</button></div></article>`).join("");
    $("admin-project-list").querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => editProject(b.dataset.edit)));
    $("admin-project-list").querySelectorAll("[data-publish]").forEach(b => b.addEventListener("click", () => togglePublish(b.dataset.publish)));
    $("admin-project-list").querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", () => deleteProject(b.dataset.delete)));
  }
  function editProject(id) {
    const p = projects.find(x => String(x.id) === String(id)); if (!p) return;
    $("project-id").value = p.id;
    setVal("project-name",p.name); setVal("project-description",p.description); setVal("project-platform",p.platform || "Android"); setVal("project-category",p.category); setVal("project-version",p.version); setVal("project-date",p.release_date); setVal("project-icon",p.icon_url); setVal("project-url",p.project_url); setVal("project-download",p.download_url); setVal("project-changelog",p.changelog);
    $("project-featured").checked = !!p.featured;
    $("form-heading").textContent = "Edit project"; $("save-project").innerHTML = 'Save changes <span>→</span>'; $("cancel-edit").classList.remove("hidden");
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function resetForm() {
    $("project-form").reset(); $("project-id").value = ""; $("form-heading").textContent = "Add a project"; $("save-project").innerHTML = 'Publish project <span>→</span>'; $("cancel-edit").classList.add("hidden"); $("project-message").textContent = "";
  }
  $("cancel-edit").addEventListener("click", resetForm);
  $("project-form").addEventListener("submit", async e => {
    e.preventDefault();
    const id = getVal("project-id");
    const payload = {
      name:getVal("project-name"), description:getVal("project-description"), platform:getVal("project-platform"),
      category:getVal("project-category") || null, version:getVal("project-version") || null, release_date:getVal("project-date") || null,
      icon_url:getVal("project-icon") || null, project_url:getVal("project-url") || null, download_url:getVal("project-download"),
      changelog:getVal("project-changelog") || null, featured:$("project-featured").checked, published:true, updated_at:new Date().toISOString()
    };
    $("save-project").disabled = true; setMessage("project-message", "Saving…");
    const result = id ? await db.from("projects").update(payload).eq("id",id) : await db.from("projects").insert(payload);
    $("save-project").disabled = false;
    if (result.error) { setMessage("project-message", result.error.message, true); return; }
    setMessage("project-message", id ? "Project updated." : "Project published.");
    resetForm(); await loadProjects();
  });
  async function togglePublish(id) {
    const p = projects.find(x => String(x.id) === String(id)); if (!p) return;
    const { error } = await db.from("projects").update({published:!p.published,updated_at:new Date().toISOString()}).eq("id",id);
    if (error) alert("Could not update project: " + error.message); else await loadProjects();
  }
  async function deleteProject(id) {
    const p = projects.find(x => String(x.id) === String(id)); if (!p || !confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const { error } = await db.from("projects").delete().eq("id",id);
    if (error) alert("Could not delete project: " + error.message); else await loadProjects();
  }
  updateAuthUI();
})();