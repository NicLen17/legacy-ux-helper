const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
let errors = 0;

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));

if (manifest.version !== "1.3.0") {
  console.error("Expected version 1.3.0");
  errors += 1;
}

const permissions = manifest.permissions || [];
if (!permissions.includes("storage") || !permissions.includes("activeTab")) {
  console.error("Must include storage and activeTab permissions");
  errors += 1;
}

if (permissions.includes("tabs") || permissions.includes("scripting")) {
  console.error("tabs and scripting permissions should be removed");
  errors += 1;
}

const settingsJs = fs.readFileSync(path.join(ROOT, "shared", "settings.js"), "utf8");
const forbidden = ["domainRules", "getDomainRule", "loadStats", "saveStats", "chrome.storage.sync.set"];

forbidden.forEach((token) => {
  if (settingsJs.includes(token)) {
    console.error(`settings.js should not contain: ${token}`);
    errors += 1;
  }
});

if (!settingsJs.includes("chrome.storage.local.set")) {
  console.error("settings.js must use chrome.storage.local");
  errors += 1;
}

const contentJs = fs.readFileSync(path.join(ROOT, "content.js"), "utf8");
if (contentJs.includes("getDomainRule") || contentJs.includes("hostname")) {
  console.error("content.js must not store or use domain rules");
  errors += 1;
}

if (errors > 0) {
  console.error(`Verification failed with ${errors} error(s).`);
  process.exit(1);
}

console.log("Verification passed: v1.3 local-only extension OK.");
