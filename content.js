const ACTIVE_CLASS = "legacy-ux-helper-active";
const LEGACY_ONLY_CLASS = "legacy-ux-helper-legacy-only";
const HOVER_MODE_CLASS = "legacy-ux-helper-hover-mode";
const TRAINING_CLASS = "legacy-ux-helper-training";
const HOVER_FOCUS_CLASS = "legacy-ux-helper-hover-focus";
const POINTER_ATTR = "data-legacy-ux-helper-pointer";
const ONCLICK_ATTR = "data-legacy-ux-helper-onclick";
const CUSTOM_ATTR = "data-legacy-ux-helper-custom";
const TABLE_ATTR = "data-luxh-type";
const TYPE_ATTR = "data-luxh-type";
const EXCLUSION_STYLE_ID = "legacy-ux-helper-exclusions-style";
const INDICATOR_ID = "luxh-floating-indicator";
const LABELS_ROOT_ID = "luxh-labels-root";

const SEMANTIC_TAGS = new Set([
  "A", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "SUMMARY", "AREA",
]);

const ARIA_ROLES = new Set([
  "button", "link", "checkbox", "radio", "menuitem", "tab", "switch",
  "textbox", "listbox", "combobox",
]);

const TABLE_TAGS = new Set(["TD", "TH", "TR"]);

const MARK_ATTRS = [POINTER_ATTR, ONCLICK_ATTR, CUSTOM_ATTR, TYPE_ATTR];

let isActive = false;
let currentSettings = LegacyUxSettings.mergeWithDefaults({});
let mutationObserver = null;
let scanTimeoutId = null;
let labelUpdateTimeoutId = null;
let hoveredElement = null;
let scrollResizeBound = false;

/**
 * @param {Element} element
 * @returns {boolean}
 */
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.top <= window.innerHeight &&
    rect.left <= window.innerWidth
  );
}

/**
 * @param {Element} element
 * @returns {boolean}
 */
function isSemanticElement(element) {
  if (SEMANTIC_TAGS.has(element.tagName)) {
    return true;
  }

  const role = element.getAttribute("role");
  if (role && ARIA_ROLES.has(role)) {
    return true;
  }

  const tabindex = element.getAttribute("tabindex");
  if (tabindex !== null && tabindex !== "-1") {
    return true;
  }

  return false;
}

/**
 * @param {Element} element
 * @returns {string | null}
 */
function resolveElementType(element) {
  if (element.hasAttribute(CUSTOM_ATTR)) {
    return "custom";
  }

  if (element.getAttribute(TYPE_ATTR) === "table" || element.hasAttribute("data-legacy-ux-helper-table")) {
    return "table";
  }

  if (element.hasAttribute(POINTER_ATTR) || element.hasAttribute(ONCLICK_ATTR)) {
    return "legacy";
  }

  if (element.matches('button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"]')) {
    return "button";
  }

  if (element.matches('a[href], area[href], [role="link"]')) {
    return "link";
  }

  if (element.matches('select, [role="listbox"], [role="combobox"]')) {
    return "select";
  }

  if (element.matches('textarea, [role="textbox"]')) {
    return "textarea";
  }

  if (element.matches('input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]), [role="checkbox"], [role="radio"], [role="switch"]')) {
    return "input";
  }

  if (element.matches('summary, [role="menuitem"], [role="tab"], [tabindex]:not([tabindex="-1"])')) {
    return "aria";
  }

  return null;
}

/**
 * @param {Element} element
 */
function applyElementType(element) {
  const type = resolveElementType(element);
  if (type) {
    element.setAttribute(TYPE_ATTR, type);
  } else {
    element.removeAttribute(TYPE_ATTR);
  }
}

/**
 * @param {Element} element
 * @returns {boolean}
 */
function hasPointerCursor(element) {
  return window.getComputedStyle(element).cursor === "pointer";
}

/**
 * @param {Element} element
 */
function markLegacyPointer(element) {
  if (isSemanticElement(element)) {
    element.removeAttribute(POINTER_ATTR);
    return;
  }

  if (hasPointerCursor(element)) {
    element.setAttribute(POINTER_ATTR, "true");
  } else {
    element.removeAttribute(POINTER_ATTR);
  }
}

/**
 * @param {Element} element
 */
function markLegacyOnclick(element) {
  if (!element.hasAttribute("onclick") || isSemanticElement(element)) {
    element.removeAttribute(ONCLICK_ATTR);
    return;
  }

  element.setAttribute(ONCLICK_ATTR, "true");
}

/**
 * @param {Element} element
 */
function markTableActionable(element) {
  if (!TABLE_TAGS.has(element.tagName)) {
    return;
  }

  const hasHandler =
    element.hasAttribute("onclick") ||
    element.hasAttribute("onmousedown") ||
    element.hasAttribute("ondblclick") ||
    hasPointerCursor(element);

  if (hasHandler) {
    element.setAttribute("data-legacy-ux-helper-table", "true");
    element.setAttribute(TYPE_ATTR, "table");
  } else {
    element.removeAttribute("data-legacy-ux-helper-table");
    if (element.getAttribute(TYPE_ATTR) === "table") {
      element.removeAttribute(TYPE_ATTR);
    }
  }
}

/**
 * @param {Document | ShadowRoot} root
 * @param {(element: Element) => void} callback
 */
function walkElements(root, callback) {
  const viewportOnly = currentSettings.features.viewportOnly;
  const scanShadowDom = currentSettings.features.scanShadowDom;
  const nodes = root.querySelectorAll(
    "div, span, td, th, tr, li, img, label, p, font, b, i, a, button, input, select, textarea, summary, [role], [tabindex], [onclick]"
  );

  nodes.forEach((element) => {
    if (viewportOnly && !isInViewport(element)) {
      return;
    }

    callback(element);

    if (scanShadowDom && element.shadowRoot) {
      walkElements(element.shadowRoot, callback);
    }
  });
}

/**
 * Limpia marcas dinámicas del escaneo.
 */
function clearDynamicMarks() {
  document.querySelectorAll(
    `[${POINTER_ATTR}], [${ONCLICK_ATTR}], [${CUSTOM_ATTR}], [data-legacy-ux-helper-table], [${TYPE_ATTR}]`
  ).forEach((element) => {
    MARK_ATTRS.forEach((attr) => element.removeAttribute(attr));
    element.removeAttribute("data-legacy-ux-helper-table");
    element.classList.remove(HOVER_FOCUS_CLASS);
  });
}

/**
 * @param {object} settings
 */
function applyCustomSelectorMarks(settings) {
  const parsed = LegacyUxSettings.parseSelectors(settings.customSelectors || "");

  parsed.forEach((selector) => {
    try {
      document.querySelectorAll(selector).forEach((element) => {
        element.setAttribute(CUSTOM_ATTR, "true");
        element.setAttribute(TYPE_ATTR, "custom");
      });
    } catch {
      // Selector inválido.
    }
  });
}

/**
 * @param {object} settings
 */
function applyColorVariables(settings) {
  const root = document.documentElement;
  const { colors, appearance } = settings;

  Object.entries(colors).forEach(([key, color]) => {
    root.style.setProperty(`--luxh-color-${key}`, color);
    root.style.setProperty(
      `--luxh-glow-${key}`,
      LegacyUxSettings.hexToRgba(color, appearance.glowIntensity)
    );
  });

  root.style.setProperty("--luxh-outline-style", appearance.outlineStyle);
  root.style.setProperty("--luxh-outline-width", `${appearance.outlineWidth}px`);
  root.style.setProperty("--luxh-outline-offset", `${appearance.outlineOffset}px`);
  root.style.setProperty(
    "--luxh-glow-size",
    appearance.glowEnabled ? `${4 + appearance.glowIntensity * 12}px` : "0px"
  );
}

/**
 * @param {string} selectors
 */
function applyExclusionStyles(selectors) {
  let styleEl = document.getElementById(EXCLUSION_STYLE_ID);

  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = EXCLUSION_STYLE_ID;
    document.documentElement.appendChild(styleEl);
  }

  const parsed = LegacyUxSettings.parseSelectors(selectors);

  styleEl.textContent = parsed.length
    ? parsed
        .map(
          (selector) =>
            `body.${ACTIVE_CLASS} ${selector} { outline: none !important; box-shadow: none !important; }`
        )
        .join("\n")
    : "";
}

/**
 * @param {object} settings
 */
function applyModeClasses(settings) {
  if (!document.body) {
    return;
  }

  document.body.classList.toggle(LEGACY_ONLY_CLASS, settings.mode === "legacy");
  document.body.classList.toggle(HOVER_MODE_CLASS, settings.mode === "hover");
  document.body.classList.toggle(TRAINING_CLASS, settings.features.trainingMode);
}

function scanLegacyElements() {
  if (!isActive || !document.body) {
    return;
  }

  walkElements(document, (element) => {
    markTableActionable(element);
    markLegacyPointer(element);
    markLegacyOnclick(element);
    applyElementType(element);
  });

  applyCustomSelectorMarks(currentSettings);
  scheduleLabelUpdate();
}

/**
 * Programa un escaneo con debounce.
 */
function scheduleScan() {
  if (scanTimeoutId !== null) {
    window.clearTimeout(scanTimeoutId);
  }

  scanTimeoutId = window.setTimeout(() => {
    clearDynamicMarks();
    scanLegacyElements();
    scanTimeoutId = null;
  }, 300);
}

/**
 * @param {Element | null} element
 */
function setHoverFocus(element) {
  if (hoveredElement) {
    hoveredElement.classList.remove(HOVER_FOCUS_CLASS);
  }

  hoveredElement = element;

  if (hoveredElement) {
    applyElementType(hoveredElement);
    hoveredElement.classList.add(HOVER_FOCUS_CLASS);
    scheduleLabelUpdate();
  }
}

/**
 * @param {Element | null} target
 * @returns {Element | null}
 */
function findActionableAncestor(target) {
  let current = target;

  while (current && current !== document.body) {
    applyElementType(current);
    if (resolveElementType(current)) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

/**
 * @param {MouseEvent} event
 */
function handleMouseMove(event) {
  if (!isActive || currentSettings.mode !== "hover") {
    return;
  }

  const actionable = findActionableAncestor(event.target instanceof Element ? event.target : null);
  if (actionable !== hoveredElement) {
    setHoverFocus(actionable);
  }
}

function ensureHoverListeners() {
  if (currentSettings.mode === "hover") {
    document.addEventListener("mousemove", handleMouseMove, true);
  } else {
    document.removeEventListener("mousemove", handleMouseMove, true);
    setHoverFocus(null);
  }
}

function ensureScrollResizeListeners() {
  if (scrollResizeBound) {
    return;
  }

  const handler = () => scheduleLabelUpdate();
  window.addEventListener("scroll", handler, true);
  window.addEventListener("resize", handler, true);
  scrollResizeBound = true;
}

function scheduleLabelUpdate() {
  if (labelUpdateTimeoutId !== null) {
    window.clearTimeout(labelUpdateTimeoutId);
  }

  labelUpdateTimeoutId = window.setTimeout(() => {
    updateTrainingLabels();
    labelUpdateTimeoutId = null;
  }, 100);
}

function updateTrainingLabels() {
  let root = document.getElementById(LABELS_ROOT_ID);

  if (!root) {
    root = document.createElement("div");
    root.id = LABELS_ROOT_ID;
    document.documentElement.appendChild(root);
  }

  root.innerHTML = "";

  if (!isActive || !currentSettings.features.trainingMode) {
    return;
  }

  const elements = currentSettings.mode === "hover" && hoveredElement
    ? [hoveredElement]
    : Array.from(document.querySelectorAll(`[${TYPE_ATTR}]`));

  elements.forEach((element) => {
    if (currentSettings.features.viewportOnly && !isInViewport(element)) {
      return;
    }

    const type = element.getAttribute(TYPE_ATTR);
    if (!type) {
      return;
    }

    const label = document.createElement("div");
    label.className = "luxh-training-label";
    label.textContent = LegacyUxSettings.TYPE_LABELS[type] || type;

    const rect = element.getBoundingClientRect();
    label.style.left = `${Math.max(4, rect.left)}px`;
    label.style.top = `${Math.max(4, rect.top - 18)}px`;
    root.appendChild(label);
  });
}

function updateFloatingIndicator() {
  let indicator = document.getElementById(INDICATOR_ID);

  if (!indicator) {
    indicator = document.createElement("div");
    indicator.id = INDICATOR_ID;
    document.documentElement.appendChild(indicator);
  }

  const visible = isActive && currentSettings.features.floatingIndicator;
  indicator.style.display = visible ? "block" : "none";
  indicator.textContent = `UX Helper: ON · ${currentSettings.mode}`;
}

/**
 * Inicia observación de mutaciones del DOM.
 */
function startMutationObserver() {
  if (mutationObserver || !document.body) {
    return;
  }

  if (currentSettings.features.pauseWhenHidden && document.hidden) {
    return;
  }

  mutationObserver = new MutationObserver(() => {
    scheduleScan();
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class", "onclick", "role", "tabindex", "href"],
  });
}

/**
 * Detiene observación de mutaciones del DOM.
 */
function stopMutationObserver() {
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }

  if (scanTimeoutId !== null) {
    window.clearTimeout(scanTimeoutId);
    scanTimeoutId = null;
  }
}

/**
 * @param {object} settings
 */
function applySettings(settings) {
  currentSettings = LegacyUxSettings.mergeWithDefaults(settings);
  applyColorVariables(currentSettings);
  applyExclusionStyles(currentSettings.globalExclusions);
  applyModeClasses(currentSettings);
  ensureHoverListeners();
  updateFloatingIndicator();

  if (isActive) {
    scheduleScan();
    scheduleLabelUpdate();
  }
}

async function activateHighlight() {
  if (!document.body) {
    return;
  }

  const settings = await LegacyUxSettings.load();
  applySettings(settings);
  document.body.classList.add(ACTIVE_CLASS);
  isActive = true;
  ensureScrollResizeListeners();
  scanLegacyElements();
  startMutationObserver();
  updateFloatingIndicator();
}

function deactivateHighlight() {
  if (!document.body) {
    return;
  }

  document.body.classList.remove(ACTIVE_CLASS);
  document.body.classList.remove(LEGACY_ONLY_CLASS);
  document.body.classList.remove(HOVER_MODE_CLASS);
  document.body.classList.remove(TRAINING_CLASS);
  isActive = false;
  stopMutationObserver();
  clearDynamicMarks();
  setHoverFocus(null);
  updateFloatingIndicator();

  const labelsRoot = document.getElementById(LABELS_ROOT_ID);
  if (labelsRoot) {
    labelsRoot.innerHTML = "";
  }
}

async function toggleHighlight() {
  if (isActive) {
    deactivateHighlight();
  } else {
    await activateHighlight();
  }

  return isActive;
}

document.addEventListener("visibilitychange", () => {
  if (!isActive || !currentSettings.features.pauseWhenHidden) {
    return;
  }

  if (document.hidden) {
    stopMutationObserver();
  } else {
    startMutationObserver();
    scheduleScan();
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "toggle_highlight") {
    toggleHighlight().then((state) => {
      sendResponse({ status: "success", state });
    });
    return true;
  }

  if (request.action === "get_state") {
    sendResponse({ status: "success", state: isActive });
    return false;
  }

  return false;
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes[LegacyUxSettings.STORAGE_KEY]) {
    applySettings(changes[LegacyUxSettings.STORAGE_KEY].newValue);
  }
});

LegacyUxSettings.load().then((settings) => {
  applySettings(settings);
});
