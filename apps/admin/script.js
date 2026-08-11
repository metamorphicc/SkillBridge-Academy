(function () {
  const state = {
    leads: [],
    stats: null,
    filter: "all",
    routeFilter: "active",
  };

  const labels = {
    qualification: "Needs qualification",
    call_window: "Call window",
    fit_questions: "Fit questions",
    intro_material: "Nurture material",
    unrouted: "Unrouted",
  };

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

  function renderMetrics() {
    const stats = state.stats || {};
    const scores = stats.scores || {};
    setText("total-leads", `${stats.total || 0} leads`);
    setText("metric-hot", scores.hot || 0);
    setText("metric-warm", scores.warm || 0);
    setText("metric-cold", scores.cold || 0);
    setText("metric-pending", scores.pending || 0);
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

  function renderRows() {
    const target = document.getElementById("lead-rows");
    if (!target) return;

    const leads = state.filter === "all" ? state.leads : state.leads.filter((lead) => lead.score === state.filter);

    if (leads.length === 0) {
      target.innerHTML = '<p class="empty">No leads in this view.</p>';
      return;
    }

    target.innerHTML = leads
      .map(
        (lead) => `
          <div class="lead-row" role="row">
            <div role="cell">
              <b>${clean(lead.name, "Unnamed lead")}</b>
              <small>${clean(lead.school, "No school")} / ${formatDate(lead.createdAt)}</small>
            </div>
            <div role="cell">
              <span>${leadSignal(lead)}</span>
              <small>${clean(lead.contact, "No contact")}</small>
            </div>
            <div role="cell">
              <span class="score-pill" data-score="${clean(lead.score, "pending")}">${clean(lead.score, "pending")}</span>
              <small>${lead.points ?? 0}/100</small>
            </div>
            <div role="cell">
              <span>${clean(lead.nextAction, "No next action")}</span>
              <small>${clean(lead.followUp || lead.routing?.followUp, "No route")}</small>
            </div>
          </div>
        `,
      )
      .join("");
  }

  function render() {
    renderMetrics();
    renderQueues();
    renderRows();
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
      renderRows();
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

  document.getElementById("refresh-button")?.addEventListener("click", loadLeads);
  document.getElementById("logout-button")?.addEventListener("click", async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.replace("/apps/admin/login.html");
  });

  loadLeads();
})();
