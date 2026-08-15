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
    intake: {
      title: "Intake captured",
      label: "Intake",
      className: "score--intake",
      action: "Continue Telegram qualification",
      telegramTitle: "New intake captured",
      telegramAction: "Next: ask goal, level, start, format, and budget",
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
  const submitResult = document.getElementById("submit-result");
  const webQualifier = document.getElementById("web-qualifier");
  const webQualifierProgress = document.getElementById("web-qualifier-progress");
  const webQualifierQuestion = document.getElementById("web-qualifier-question");
  const webQualifierOptions = document.getElementById("web-qualifier-options");
  const webQualifierBack = document.getElementById("web-qualifier-back");

  if (requestForm && requestStatus) {
    const submitButton = requestForm.querySelector('button[type="submit"]');
    const webQuestions = [
      {
        key: "goal",
        prompt: "What is the student's main learning goal?",
        options: ["Change career", "Improve current role", "Explore options"],
      },
      {
        key: "level",
        prompt: "What is their current level?",
        options: ["Beginner", "Already practicing", "Experienced"],
      },
      {
        key: "start",
        prompt: "When do they want to start?",
        options: ["Within 7 days", "This month", "In 1-2 months", "Not sure yet"],
      },
      {
        key: "format",
        prompt: "Which format sounds best?",
        options: ["Group", "Individual consultation", "Not sure"],
      },
      {
        key: "budget",
        prompt: "Are they ready to discuss budget or payment options?",
        options: ["Ready to discuss", "Need price first", "Just browsing"],
      },
      {
        key: "contactTime",
        prompt: "When is a good time for the manager to contact them?",
        options: ["Today", "Tomorrow", "This week"],
      },
    ];
    const webQualificationState = {
      lead: null,
      answers: {},
      index: 0,
      completed: false,
    };

    const hideRequestStatus = () => {
      requestStatus.hidden = true;
      requestStatus.textContent = "";
      requestStatus.classList.remove("is-error", "is-success", "is-warning");
    };
    const showRequestStatus = (message, className = "") => {
      requestStatus.hidden = false;
      requestStatus.textContent = message;
      requestStatus.classList.remove("is-error", "is-success", "is-warning");
      if (className) requestStatus.classList.add(className);
    };
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
    const setFormDisabled = (disabled) => {
      ["name", "school", "contact", "need"].forEach((fieldName) => {
        requestForm.elements[fieldName].disabled = disabled;
      });
    };
    const currentWebQuestion = () => webQuestions[webQualificationState.index] || null;
    const renderWebQualifier = () => {
      if (!webQualifier || !webQualifierProgress || !webQualifierQuestion || !webQualifierOptions) return;
      const question = currentWebQuestion();
      webQualifier.hidden = false;
      webQualifierOptions.innerHTML = "";

      if (!question) {
        webQualifierProgress.textContent = "Qualification complete";
        webQualifierQuestion.textContent = "Sending the manager brief...";
        if (webQualifierBack) webQualifierBack.hidden = true;
        return;
      }

      webQualifierProgress.textContent = `Question ${webQualificationState.index + 1} of ${webQuestions.length}`;
      webQualifierQuestion.textContent = question.prompt;
      if (webQualifierBack) webQualifierBack.hidden = webQualificationState.index === 0;

      question.options.forEach((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "web-qualifier__option";
        button.textContent = option;
        button.addEventListener("click", () => chooseWebAnswer(option));
        webQualifierOptions.append(button);
      });
    };
    const updateProductPreview = (lead, scoring) => {
      const answers = lead.answers || {};
      const score = scoreMap[scoring.score] || scoreMap.cold;
      setText("profile-title", `${score.label} lead`);
      setText("profile-goal", answers.goal || "Not answered");
      setText("profile-level", answers.level || "Not answered");
      setText("profile-start", answers.start || "Not answered");
      setText("profile-action", scoring.nextAction || score.action);
      setScore("profile-score", score);
      setText("telegram-title", `New ${score.label.toLowerCase()} lead`);
      setText(
        "telegram-body",
        `${lead.name}: ${answers.goal || "goal not answered"}, ${answers.level || "level not answered"}, start: ${
          answers.start || "not answered"
        }.`,
      );
      setText("telegram-action", `Next: ${scoring.nextAction || score.action}`);
      setText("crm-name", lead.name || "New lead");
      setText("crm-goal", answers.goal || "Not answered");
      setText("crm-start", answers.start || "Not answered");
      setScore("crm-score", score);
    };
    const submitQualifiedLead = async () => {
      if (!webQualificationState.lead) return;
      renderWebQualifier();
      showRequestStatus("Preparing manager brief...", "is-warning");

      try {
        const response = await fetch("/api/lead/qualify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...webQualificationState.lead,
            answers: webQualificationState.answers,
          }),
        });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.errors?.join(" ") || result.error || "Request was not sent.");
        }

        webQualificationState.completed = true;
        if (webQualifierProgress) webQualifierProgress.textContent = "Qualification complete";
        if (webQualifierQuestion) webQualifierQuestion.textContent = "Thanks. A manager will review the request and contact you.";
        if (webQualifierOptions) webQualifierOptions.innerHTML = "";
        if (webQualifierBack) webQualifierBack.hidden = true;
        showRequestStatus("Qualification complete. The manager brief was sent.", "is-success");
        setText("submit-status", `${result.scoring.score.toUpperCase()} lead routed to the manager.`);
        updateProductPreview(result.lead, result.scoring);
      } catch (submitError) {
        showRequestStatus(submitError.message || "Request was not sent. Please check the fields and try again.", "is-error");
        if (webQualifierQuestion) webQualifierQuestion.textContent = "Something went wrong. Please choose the last answer again.";
        webQualificationState.index = Math.max(0, webQualificationState.index - 1);
        renderWebQualifier();
      }
    };
    const chooseWebAnswer = (option) => {
      const question = currentWebQuestion();
      if (!question || webQualificationState.completed) return;
      webQualificationState.answers[question.key] = option;
      webQualificationState.index += 1;
      if (webQualificationState.index >= webQuestions.length) {
        submitQualifiedLead();
      } else {
        renderWebQualifier();
      }
    };

    if (webQualifierBack) {
      webQualifierBack.addEventListener("click", () => {
        if (webQualificationState.index <= 0 || webQualificationState.completed) return;
        webQualificationState.index -= 1;
        const question = currentWebQuestion();
        if (question) delete webQualificationState.answers[question.key];
        renderWebQualifier();
      });
    }

    ["name", "school", "contact"].forEach((fieldName) => {
      requestForm.elements[fieldName].addEventListener("input", () => {
        requestForm.elements[fieldName].setCustomValidity("");
        hideRequestStatus();
        if (submitResult) submitResult.hidden = true;
      });
    });

    requestForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const error = validateRequest();
      if (error) {
        showRequestStatus(error, "is-error");
        requestForm.reportValidity();
        return;
      }

      const data = new FormData(requestForm);
      const name = String(data.get("name") || "New lead").trim();
      const school = String(data.get("school") || "school").trim();
      const need = String(data.get("need") || "lead qualification").trim();
      const contact = String(data.get("contact") || "").trim();

      webQualificationState.lead = { name, school, contact, need };
      webQualificationState.answers = {};
      webQualificationState.index = 0;
      webQualificationState.completed = false;
      showRequestStatus("Answer the short qualification. It takes less than a minute.", "is-warning");
      setText("submit-contact", contact);
      setText("submit-route", need);
      setText("submit-status", "Answering qualification questions.");
      if (submitResult) submitResult.hidden = false;
      if (submitButton) submitButton.disabled = true;
      setFormDisabled(true);
      renderWebQualifier();
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
