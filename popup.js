const toggleBtn = document.getElementById("toggle-btn");
const toggleError = document.getElementById("toggle-error");
const statusPill = document.getElementById("status-pill");
const modeButtons = document.querySelectorAll("#mode-segmented [data-mode]");
const trainingToggle = document.getElementById("training-toggle");
const indicatorToggle = document.getElementById("indicator-toggle");

function showToggleError(message) {
  toggleError.textContent = message || "";
  toggleError.classList.toggle("is-visible", Boolean(message));
}

function updateToggleUi(isActive) {
  statusPill.textContent = isActive ? "ON" : "OFF";
  statusPill.classList.toggle("on", isActive);
  toggleBtn.textContent = isActive ? "Desactivar resaltado" : "Activar resaltado";
}

function updateModeUi(mode) {
  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
}

async function saveFeatureToggle() {
  const settings = await LegacyUxSettings.load();
  settings.features.trainingMode = trainingToggle.checked;
  settings.features.floatingIndicator = indicatorToggle.checked;
  await LegacyUxSettings.save(settings);
}

async function loadPopupState() {
  const [settings, tabState] = await Promise.all([
    LegacyUxSettings.load(),
    new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "popup_get_state" }, (response) => {
        resolve(Boolean(response?.state));
      });
    }),
  ]);

  updateModeUi(settings.mode);
  updateToggleUi(tabState);
  trainingToggle.checked = settings.features.trainingMode;
  indicatorToggle.checked = settings.features.floatingIndicator;
}

toggleBtn.addEventListener("click", () => {
  showToggleError("");
  chrome.runtime.sendMessage({ action: "popup_toggle" }, (response) => {
    if (chrome.runtime.lastError) {
      showToggleError("No se pudo comunicar con la extensión. Recargala en chrome://extensions.");
      return;
    }

    updateToggleUi(Boolean(response?.state));
    if (response?.status !== "success") {
      showToggleError(response?.error || "No se pudo activar el resaltado.");
    }
  });
});

modeButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const settings = await LegacyUxSettings.load();
    settings.mode = button.dataset.mode;
    await LegacyUxSettings.save(settings);
    updateModeUi(settings.mode);
  });
});

trainingToggle.addEventListener("change", saveFeatureToggle);
indicatorToggle.addEventListener("change", saveFeatureToggle);

loadPopupState();
