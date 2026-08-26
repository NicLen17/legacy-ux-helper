const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
let errors = 0;

function fail(message) {
  console.error(message);
  errors += 1;
}

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));

if (manifest.version !== "1.4.0") {
  fail("Expected version 1.4.0");
}

const contentCss = manifest.content_scripts?.[0]?.css || [];
if (!contentCss.includes("styles.css")) {
  fail("manifest.json must include styles.css in content_scripts");
}

if (contentCss.includes("styles-modernize.css")) {
  fail("styles-modernize.css is deprecated and must not be injected");
}

const permissions = manifest.permissions || [];
if (!permissions.includes("storage") || !permissions.includes("activeTab")) {
  fail("Must include storage and activeTab permissions");
}

if (permissions.includes("tabs")) {
  fail("tabs permission should be removed");
}

if (!permissions.includes("scripting")) {
  fail("Must include scripting permission to inject highlighting on the active tab");
}

const settingsJs = fs.readFileSync(path.join(ROOT, "shared", "settings.js"), "utf8");
const forbidden = ["domainRules", "getDomainRule", "loadStats", "saveStats", "chrome.storage.sync.set"];

forbidden.forEach((token) => {
  if (settingsJs.includes(token)) {
    fail(`settings.js should not contain: ${token}`);
  }
});

if (!settingsJs.includes('EXPORT_VERSION = "1.4"')) {
  fail('settings.js EXPORT_VERSION must be "1.4"');
}

if (!settingsJs.includes("chrome.storage.local.set")) {
  fail("settings.js must use chrome.storage.local");
}

if (!/const mode = \["all", "legacy", "hover"\]/.test(settingsJs)) {
  fail("settings.js must only allow all / legacy / hover modes");
}

const contentJs = fs.readFileSync(path.join(ROOT, "content.js"), "utf8");
if (contentJs.includes("getDomainRule") || contentJs.includes("hostname")) {
  fail("content.js must not store or use domain rules");
}

if (contentJs.includes("settings.mode === \"modernize\"")) {
  fail("content.js must not activate deprecated modernize mode");
}

const popupHtml = fs.readFileSync(path.join(ROOT, "popup.html"), "utf8");
const optionsHtml = fs.readFileSync(path.join(ROOT, "options.html"), "utf8");

if (popupHtml.includes('data-mode="modernize"') || optionsHtml.includes('data-mode="modernize"')) {
  fail("Modernize mode must be removed from popup and options UI");
}

if (popupHtml.includes("info-tips.js") || optionsHtml.includes("info-tips.js")) {
  fail("popup and options must use CSS hover tooltips, not info-tips.js");
}

if (popupHtml.includes("Qué hace activar el resaltado") || popupHtml.includes("Qué hace el modo Todos")) {
  fail("popup must not show info icons on activate or mode buttons");
}

if (!optionsHtml.includes("Configuración general") || !optionsHtml.includes("Configuración avanzada")) {
  fail("options.html must split general and advanced sections");
}

if (!optionsHtml.includes("advanced-panel") || !optionsHtml.includes('hidden')) {
  fail("advanced section must be collapsed by default");
}

if (!optionsHtml.includes("options-footer") || !optionsHtml.includes("footer-actions")) {
  fail("options.html must include the sticky save/reset footer");
}

["all", "legacy", "hover"].forEach((mode) => {
  if (!popupHtml.includes(`data-mode="${mode}"`) || !optionsHtml.includes(`data-mode="${mode}"`)) {
    fail(`Missing highlight mode "${mode}" in popup or options`);
  }
});

const identityIcons = manifest.icons || {};
const toolbarIcons = manifest.action?.default_icon || {};

if (identityIcons["128"] !== "icons/app-128.png") {
  fail("manifest icons.128 must use the app identifier");
}

if (toolbarIcons["32"] !== "icons/toolbar-32.png") {
  fail("action.default_icon must use the quick-access toolbar artwork");
}

["16", "32", "48", "128"].forEach((size) => {
  const identityPath = identityIcons[size];
  const toolbarPath = toolbarIcons[size];

  if (!identityPath || !fs.existsSync(path.join(ROOT, identityPath))) {
    fail(`Missing identity icon for ${size}px`);
  }

  if (!toolbarPath || !fs.existsSync(path.join(ROOT, toolbarPath))) {
    fail(`Missing toolbar icon for ${size}px`);
  }
});

if (!popupHtml.includes("icons/app-48.png") || !optionsHtml.includes("icons/app-128.png")) {
  fail("popup and options must show the app identifier");
}

if (errors > 0) {
  console.error(`Verification failed with ${errors} error(s).`);
  process.exit(1);
}

console.log("Verification passed: v1.4 local-only extension with 3 highlight modes OK.");
