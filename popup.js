const toggleBtn = document.getElementById("toggle-btn");
const statusPill = document.getElementById("status-pill");
const modeButtons = document.querySelectorAll("#mode-segmented button");
const trainingToggle = document.getElementById("training-toggle");
const indicatorToggle = document.getElementById("indicator-toggle");

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
  chrome.runtime.sendMessage({ action: "popup_toggle" }, (response) => {
    if (response?.status === "success") {
      updateToggleUi(Boolean(response.state));
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
