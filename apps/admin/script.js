(function () {
  const state = {
    leads: [],
    stats: null,
    filter: "all",
    statusFilter: "all",
    followFilter: "all",
    routeFilter: "active",
    search: "",
    selectedId: null,
  };

  const labels = {
    qualification: "Needs qualification",
    call_window: "Call window",
    fit_questions: "Fit questions",
    intro_material: "Nurture material",
    unrouted: "Unrouted",
  };

  const statusLabels = {
    new: "New",
    needs_qualification: "Needs qualification",
    contacted: "Contacted",
    no_answer: "No answer",
    won: "Won",
    lost: "Lost",
    nurture: "Nurture",
  };

  const statusActions = [
    ["new", "New"],
    ["contacted", "Contacted"],
    ["no_answer", "No answer"],
    ["won", "Won"],
    ["lost", "Lost"],
    ["nurture", "Nurture"],
  ];

  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };

  const formatDate = (value) => {
    if (!value) return "No time";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const clean = (value, fallback = "Not answered") => String(value || fallback);
  const leadId = (lead) => String(lead.eventId || lead.id || "");
  const pipelineStatus = (lead) => lead.pipelineStatus || (lead.status === "intake" || lead.score === "pending" ? "needs_qualification" : "new");
  const followRoute = (lead) => lead.followUp || lead.routing?.followUp || "unrouted";

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  function renderMetrics() {
    const stats = state.stats || {};
    const scores = stats.scores || {};
    const pipeline = stats.pipeline || {};
    setText("total-leads", `${stats.total || 0} leads`);
    setText("needs-action", stats.needsAction || 0);
    setText("metric-open", stats.open || 0);
    setText("metric-hot", scores.hot || 0);
    setText("metric-contacted", pipeline.contacted || 0);
    setText("metric-won", pipeline.won || 0);
  }

  function renderQueues() {
    const list = document.getElementById("queue-list");
    if (!list) return;
    const followUps = state.stats?.followUps || {};
    const entries = Object.entries(followUps)
      .filter(([key]) => state.routeFilter === "all" || key !== "unrouted")
      .sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
      list.innerHTML = '<p class="empty">No follow-up routes yet.</p>';
      return;
    }

    list.innerHTML = entries
      .map(
        ([key, count]) => `
          <div class="queue-item">
            <div>
              <b>${labels[key] || key}</b>
              <span>${key}</span>
            </div>
            <strong>${count}</strong>
          </div>
        `,
      )
      .join("");
  }

  function leadSignal(lead) {
    const answers = lead.answers || {};
    const goal = answers.goal || lead.goal;
    const start = answers.start || lead.start;
    const budget = answers.budget || lead.budget;
    return [goal, start, budget].filter(Boolean).join(" / ") || clean(lead.need, "Waiting for qualification");
  }

  function filteredLeads() {
    const query = state.search.trim().toLowerCase();
    return state.leads.filter((lead) => {
      const scoreOk = state.filter === "all" || lead.score === state.filter;
      const statusOk = state.statusFilter === "all" || pipelineStatus(lead) === state.statusFilter;
      const followOk = state.followFilter === "all" || followRoute(lead) === state.followFilter;
      const text = [lead.name, lead.school, lead.contact, lead.need, leadSignal(lead), lead.nextAction]
        .join(" ")
        .toLowerCase();
      const searchOk = !query || text.includes(query);
      return scoreOk && statusOk && followOk && searchOk;
    });
  }

  function renderRows() {
    const target = document.getElementById("lead-rows");
    if (!target) return;

    const leads = filteredLeads();

    if (leads.length === 0) {
      target.innerHTML = '<p class="empty">No leads in this view.</p>';
      return;
    }

    target.innerHTML = leads
      .map(
        (lead) => {
          const id = leadId(lead);
          const stage = pipelineStatus(lead);
          return `
          <button class="lead-row ${state.selectedId === id ? "is-selected" : ""}" type="button" role="row" data-lead-id="${escapeHtml(id)}">
            <div role="cell">
              <b>${escapeHtml(clean(lead.name, "Unnamed lead"))}</b>
              <small>${escapeHtml(clean(lead.school, "No school"))} / ${escapeHtml(formatDate(lead.createdAt))}</small>
            </div>
            <div role="cell">
              <span>${escapeHtml(leadSignal(lead))}</span>
              <small>${escapeHtml(clean(lead.contact, "No contact"))}</small>
            </div>
            <div role="cell">
              <span class="score-pill" data-score="${escapeHtml(clean(lead.score, "pending"))}">${escapeHtml(clean(lead.score, "pending"))}</span>
              <small>${lead.points ?? 0}/100</small>
            </div>
            <div role="cell">
              <span class="stage-pill" data-stage="${escapeHtml(stage)}">${escapeHtml(statusLabels[stage] || stage)}</span>
              <small>${escapeHtml(clean(followRoute(lead), "No route"))}</small>
            </div>
          </button>
        `;
        },
      )
      .join("");
  }

  function renderDetail() {
    const target = document.getElementById("lead-detail");
    if (!target) return;
    const lead = state.leads.find((item) => leadId(item) === state.selectedId);
    if (!lead) {
      target.innerHTML = '<p class="empty">Choose a row to see answers, next action, and manager controls.</p>';
      return;
    }

    const answers = lead.answers || {};
    const stage = pipelineStatus(lead);
    const rows = [
      ["Goal", answers.goal || lead.goal],
      ["Level", answers.level || lead.level],
      ["Start", answers.start || lead.start],
      ["Format", answers.format || lead.format],
      ["Budget", answers.budget || lead.budget],
      ["Contact time", answers.contactTime || lead.contactTime],
    ];

    target.innerHTML = `
      <div class="profile-head">
        <div>
          <h3>${escapeHtml(clean(lead.name, "Unnamed lead"))}</h3>
          <p>${escapeHtml(clean(lead.school, "No school"))}</p>
        </div>
        <span class="score-pill" data-score="${escapeHtml(clean(lead.score, "pending"))}">${escapeHtml(clean(lead.score, "pending"))}</span>
      </div>
      <dl class="profile-grid">
        <div><dt>Contact</dt><dd>${escapeHtml(clean(lead.contact, "No contact"))}</dd></div>
        <div><dt>Route</dt><dd>${escapeHtml(clean(followRoute(lead), "No route"))}</dd></div>
        <div><dt>Source</dt><dd>${escapeHtml(clean(lead.source, "No source"))}</dd></div>
        <div><dt>Created</dt><dd>${escapeHtml(formatDate(lead.createdAt))}</dd></div>
      </dl>
      <div class="answer-list">
        ${rows
          .map(([label, value]) => `<div><span>${escapeHtml(label)}</span><b>${escapeHtml(clean(value))}</b></div>`)
          .join("")}
      </div>
      <div class="next-box">
        <span>Next action</span>
        <b>${escapeHtml(clean(lead.nextAction, "Review lead"))}</b>
      </div>
      <div class="status-actions" aria-label="Lead status actions">
        ${statusActions
          .map(
            ([value, label]) =>
              `<button class="status-btn ${stage === value ? "is-active" : ""}" type="button" data-status="${value}">${label}</button>`,
          )
          .join("")}
      </div>
      <label class="note-field">
        <span>Manager note</span>
        <textarea id="manager-note" rows="4" placeholder="Add context for the next touch">${escapeHtml(lead.managerNote || "")}</textarea>
      </label>
      <label class="owner-field">
        <span>Owner</span>
        <input id="owner-input" type="text" autocomplete="off" value="${escapeHtml(lead.owner || "")}" placeholder="Manager name" />
      </label>
      <button class="save-btn" id="save-lead" type="button">Save lead</button>
    `;
  }

  function render() {
    renderMetrics();
    renderQueues();
    renderRows();
    renderDetail();
  }

  async function loadLeads() {
    setText("sync-state", "Refreshing");
    try {
      const response = await fetch("/api/leads?limit=200", { cache: "no-store" });
      const result = await response.json();
      if (response.status === 401) {
        window.location.replace("/apps/admin/login.html");
        return;
      }
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not load leads.");
      state.leads = result.leads || [];
      state.stats = result.stats || {};
      if (!state.selectedId && state.leads[0]) state.selectedId = leadId(state.leads[0]);
      setText("sync-state", `Updated ${formatDate(new Date().toISOString())}`);
      render();
    } catch (error) {
      setText("sync-state", error.message || "Load failed");
    }
  }

  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("is-active"));
      button.classList.add("is-active");
      state.filter = button.dataset.filter || "all";
      render();
    });
  });

  document.querySelectorAll(".mini-tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".mini-tab").forEach((tab) => tab.classList.remove("is-active"));
      button.classList.add("is-active");
      state.routeFilter = button.dataset.routeFilter || "active";
      renderQueues();
    });
  });

  document.getElementById("status-filter")?.addEventListener("change", (event) => {
    state.statusFilter = event.target.value || "all";
    renderRows();
  });

  document.getElementById("follow-filter")?.addEventListener("change", (event) => {
    state.followFilter = event.target.value || "all";
    renderRows();
  });

  document.getElementById("search-input")?.addEventListener("input", (event) => {
    state.search = event.target.value || "";
    renderRows();
  });

  document.getElementById("lead-rows")?.addEventListener("click", (event) => {
    const row = event.target.closest("[data-lead-id]");
    if (!row) return;
    state.selectedId = row.dataset.leadId || null;
    render();
  });

  async function patchSelectedLead(patch) {
    const id = state.selectedId;
    if (!id) return;
    setText("sync-state", "Saving");
    const response = await fetch(`/api/leads/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const result = await response.json();
    if (response.status === 401) {
      window.location.replace("/apps/admin/login.html");
      return;
    }
    if (!response.ok || !result.ok) throw new Error(result.error || "Could not update lead.");
    state.leads = state.leads.map((lead) => (leadId(lead) === id ? result.lead : lead));
    state.stats = result.stats || state.stats;
    setText("sync-state", `Saved ${formatDate(new Date().toISOString())}`);
    render();
  }

  document.getElementById("lead-detail")?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-status]");
    if (!button) return;
    try {
      await patchSelectedLead({ pipelineStatus: button.dataset.status });
    } catch (error) {
      setText("sync-state", error.message || "Save failed");
    }
  });

  document.getElementById("lead-detail")?.addEventListener("click", async (event) => {
    if (event.target.id !== "save-lead") return;
    try {
      await patchSelectedLead({
        managerNote: document.getElementById("manager-note")?.value || "",
        owner: document.getElementById("owner-input")?.value || "",
      });
    } catch (error) {
      setText("sync-state", error.message || "Save failed");
    }
  });

  document.getElementById("refresh-button")?.addEventListener("click", loadLeads);
  document.getElementById("logout-button")?.addEventListener("click", async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.replace("/apps/admin/login.html");
  });

  loadLeads();
})();
