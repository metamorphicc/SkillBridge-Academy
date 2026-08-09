(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nav = document.getElementById("nav");

  if (nav) {
    let ticking = false;
    const syncNav = () => {
      nav.classList.toggle("is-floating", window.scrollY > 24);
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(syncNav);
          ticking = true;
        }
      },
      { passive: true },
    );
    syncNav();
  }

  const state = {
    goal: "career",
    level: "beginner",
    start: "soon",
  };

  const labels = {
    goal: {
      career: "Career change",
      upgrade: "Improve current role",
      browse: "Explore programs",
    },
    level: {
      beginner: "Beginner",
      working: "Already practicing",
      advanced: "Experienced",
    },
    start: {
      soon: "This month",
      later: "In 1-2 months",
      unknown: "Not sure yet",
    },
  };

  const scoreMap = {
    hot: {
      title: "Hot lead",
      label: "Hot",
      className: "score--hot",
      action: "Send schedule options",
      telegramTitle: "New hot lead",
      telegramAction: "Next: send schedule options",
    },
    warm: {
      title: "Warm lead",
      label: "Warm",
      className: "score--warm",
      action: "Ask timing and format questions",
      telegramTitle: "New warm lead",
      telegramAction: "Next: clarify timing and format",
    },
    cold: {
      title: "Cold lead",
      label: "Cold",
      className: "score--cold",
      action: "Add nurture reminder",
      telegramTitle: "New cold lead",
      telegramAction: "Next: send helpful intro material",
    },
  };

  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };

  const setScore = (id, score) => {
    const node = document.getElementById(id);
    if (!node) return;
    node.className = `score ${score.className}`;
    node.textContent = score.label;
  };

  const scoreKey = () => {
    if (state.goal === "browse" || state.start === "unknown") return "cold";
    if (state.goal === "upgrade" || state.start === "later") return "warm";
    return "hot";
  };

  const render = () => {
    const score = scoreMap[scoreKey()];
    const goal = labels.goal[state.goal];
    const level = labels.level[state.level];
    const start = labels.start[state.start];
    const sentenceGoal = goal.charAt(0).toLowerCase() + goal.slice(1);

    setText("profile-title", score.title);
    setText("profile-goal", goal);
    setText("profile-level", level);
    setText("profile-start", start);
    setText("profile-action", score.action);
    setScore("profile-score", score);

    setText("telegram-title", score.telegramTitle);
    setText("telegram-body", `Anna: ${sentenceGoal}, ${level.toLowerCase()} level, start: ${start.toLowerCase()}.`);
    setText("telegram-action", score.telegramAction);
    setText("crm-goal", goal);
    setText("crm-start", start);
    setScore("crm-score", score);
  };

  document.querySelectorAll(".qualifier input").forEach((input) => {
    input.addEventListener("change", (event) => {
      state[event.target.name] = event.target.value;
      render();
    });
  });

  const requestForm = document.getElementById("request-form");
  const requestStatus = document.getElementById("request-status");

  if (requestForm && requestStatus) {
    const validators = {
      name: (value) => {
        if (value.length < 2) return "Enter a real name.";
        if (/^(.)\1{2,}$/i.test(value.replace(/\s/g, ""))) return "Name cannot be repeated characters.";
        return "";
      },
      school: (value) => {
        if (value.length < 3) return "Enter the school or project name.";
        if (/test|asdf|qwerty|12345/i.test(value)) return "Use a real project name for the demo request.";
        return "";
      },
      contact: (value) => {
        const normalized = value.replace(/\s/g, "");
        const telegram = /^@[a-z0-9_]{5,32}$/i.test(normalized);
        const phone = /^\+?[0-9()\-]{7,18}$/.test(normalized);
        const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (!telegram && !phone && !email) return "Add a valid Telegram, phone, or email.";
        return "";
      },
    };

    const validateRequest = () => {
      let firstError = "";
      ["name", "school", "contact"].forEach((fieldName) => {
        const field = requestForm.elements[fieldName];
        const value = String(field.value || "").trim();
        field.value = value;
        const error = validators[fieldName](value);
        field.setCustomValidity(error);
        if (!firstError && error) firstError = error;
      });
      return firstError;
    };

    ["name", "school", "contact"].forEach((fieldName) => {
      requestForm.elements[fieldName].addEventListener("input", () => {
        requestForm.elements[fieldName].setCustomValidity("");
        requestStatus.classList.remove("is-error", "is-success");
        requestStatus.textContent = "No data is sent yet. This local demo shows the planned intake behavior.";
      });
    });

    requestForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const error = validateRequest();
      if (error) {
        requestStatus.classList.remove("is-success");
        requestStatus.classList.add("is-error");
        requestStatus.textContent = error;
        requestForm.reportValidity();
        return;
      }

      const data = new FormData(requestForm);
      const name = String(data.get("name") || "New lead").trim();
      const school = String(data.get("school") || "school").trim();
      const need = String(data.get("need") || "lead qualification").trim();
      const contact = String(data.get("contact") || "").trim();

      requestStatus.classList.remove("is-error", "is-success");
      requestStatus.textContent = "Saving request and preparing bot qualification...";

      try {
        const response = await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, school, contact, need }),
        });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.errors?.join(" ") || result.error || "Request was not accepted.");
        }

        requestStatus.classList.add("is-success");
        requestStatus.textContent = `${name} from ${school}: request saved. Score: ${result.scoring.score}. Next step: Telegram bot qualification for ${need}.`;
      } catch (submitError) {
        requestStatus.classList.add("is-error");
        requestStatus.textContent = `${submitError.message} If the API is not running, start it with node scripts/dev-server.mjs.`;
      }
    });
  }

  const stages = Array.from(document.querySelectorAll(".stage"));
  if (!reduce && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );
    stages.forEach((stage) => observer.observe(stage));
  } else {
    stages.forEach((stage) => stage.classList.add("is-in"));
  }

  render();
})();
