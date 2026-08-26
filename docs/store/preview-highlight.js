(() => {
  const params = new URLSearchParams(location.search);
  const mode = document.body.dataset.luxhMode || params.get("mode") || "all";
  const training = params.get("training") === "1";

  document.body.classList.add("legacy-ux-helper-active");
  if (mode === "legacy") {
    document.body.classList.add("legacy-ux-helper-legacy-only");
  }
  if (training) {
    document.body.classList.add("legacy-ux-helper-training");
  }

  const semantic = new Set(["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "SUMMARY"]);

  document.querySelectorAll("div, span, td, th, tr, font, [role], [tabindex], [onclick]").forEach((el) => {
    const isSemantic = semantic.has(el.tagName) || el.hasAttribute("role") || (el.hasAttribute("tabindex") && el.getAttribute("tabindex") !== "-1");
    const cursor = getComputedStyle(el).cursor === "pointer";

    if (["TD", "TH", "TR"].includes(el.tagName) && (el.hasAttribute("onclick") || cursor)) {
      el.setAttribute("data-luxh-type", "table");
      el.setAttribute("data-legacy-ux-helper-table", "true");
      return;
    }

    if (!isSemantic && (el.hasAttribute("onclick") || cursor)) {
      el.setAttribute("data-legacy-ux-helper-pointer", "true");
      if (el.hasAttribute("onclick")) {
        el.setAttribute("data-legacy-ux-helper-onclick", "true");
      }
      el.setAttribute("data-luxh-type", "legacy");
    }
  });

  document.querySelectorAll(".legacy-custom-action").forEach((el) => {
    el.setAttribute("data-legacy-ux-helper-custom", "true");
    el.setAttribute("data-luxh-type", "custom");
  });

  const modeLabel = mode === "legacy" ? "Solo legacy" : "Todos";
  const indicator = document.createElement("div");
  indicator.id = "luxh-floating-indicator";
  indicator.textContent = `Legacy UX Helper · ${modeLabel}`;
  document.body.appendChild(indicator);

  if (training) {
    const root = document.createElement("div");
    root.id = "luxh-labels-root";
    document.body.appendChild(root);
    const labels = {
      button: "Botón",
      link: "Enlace",
      input: "Campo",
      select: "Select",
      textarea: "Área de texto",
      aria: "ARIA",
      legacy: "Acción legacy",
      custom: "Custom",
      table: "Tabla clickeable",
    };
    document.querySelectorAll("[data-luxh-type], a[href], button, input, select, textarea, [role]").forEach((el) => {
      const type =
        el.getAttribute("data-luxh-type") ||
        (el.matches("button, input[type=button], [role=button]") ? "button" : null) ||
        (el.matches("a[href], [role=link]") ? "link" : null) ||
        (el.matches("select") ? "select" : null) ||
        (el.matches("textarea") ? "textarea" : null) ||
        (el.matches("input") ? "input" : null) ||
        (el.matches("[role], [tabindex]") ? "aria" : null);
      if (!type || !labels[type]) {
        return;
      }
      const rect = el.getBoundingClientRect();
      const tag = document.createElement("span");
      tag.className = "luxh-training-label";
      tag.textContent = labels[type];
      tag.style.top = `${Math.max(4, rect.top - 16)}px`;
      tag.style.left = `${rect.left}px`;
      root.appendChild(tag);
    });
  }
})();
