(function () {
  const form = document.getElementById("login-form");
  const status = document.getElementById("login-status");

  async function checkSession() {
    try {
      const response = await fetch("/api/admin/session", { cache: "no-store" });
      const result = await response.json();
      if (response.ok && result.authenticated) {
        window.location.replace("/apps/admin/");
      }
    } catch {
      // Keep the login form visible when the API is not reachable.
    }
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    const password = String(new FormData(form).get("password") || "");
    if (button) button.disabled = true;
    if (status) status.textContent = "";

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Login failed.");
      window.location.replace("/apps/admin/");
    } catch (error) {
      if (status) status.textContent = error.message || "Login failed.";
    } finally {
      if (button) button.disabled = false;
    }
  });

  checkSession();
})();
