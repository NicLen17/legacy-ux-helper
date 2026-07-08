const optionsForm = document.getElementById("options-form");
const colorGrid = document.getElementById("color-grid");
const previewGrid = document.getElementById("preview-grid");
const presetRow = document.getElementById("preset-row");
const modeButtons = document.querySelectorAll("#mode-segmented button");
const globalExclusionsInput = document.getElementById("global-exclusions");
const customSelectorsInput = document.getElementById("custom-selectors");
const resetBtn = document.getElementById("reset-btn");
const statusEl = document.getElementById("status");
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const importInput = document.getElementById("import-input");

const outlineStyle = document.getElementById("outline-style");
const outlineWidth = document.getElementById("outline-width");
const outlineOffset = document.getElementById("outline-offset");
const glowIntensity = document.getElementById("glow-intensity");
const glowEnabled = document.getElementById("glow-enabled");
const trainingMode = document.getElementById("training-mode");
const floatingIndicator = document.getElementById("floating-indicator");
const scanShadowDom = document.getElementById("scan-shadow-dom");
const viewportOnly = document.getElementById("viewport-only");
const pauseWhenHidden = document.getElementById("pause-when-hidden");

const outlineWidthValue = document.getElementById("outline-width-value");
const outlineOffsetValue = document.getElementById("outline-offset-value");
const glowIntensityValue = document.getElementById("glow-intensity-value");

let draftSettings = LegacyUxSettings.mergeWithDefaults({});

const PREVIEW_LABELS = {
  button: "Botón",
  link: "Enlace",
  input: "Input",
  select: "Select",
  textarea: "Textarea",
  aria: "ARIA",
  legacy: "Legacy",
  custom: "Custom",
  table: "Tabla",
};

function showStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function updateModeUi(mode) {
  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
}

function renderPresets() {
  presetRow.innerHTML = "";
  Object.entries(LegacyUxSettings.PRESETS).forEach(([key, preset]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-btn";
    button.textContent = preset.name;
    button.addEventListener("click", () => {
      draftSettings = LegacyUxSettings.applyPreset(key, draftSettings);
      renderColorGrid();
      showStatus(`Preset "${preset.name}" aplicado.`);
    });
    presetRow.appendChild(button);
  });
}

function renderColorGrid() {
  colorGrid.innerHTML = "";
  previewGrid.innerHTML = "";

  Object.entries(LegacyUxSettings.COLOR_LABELS).forEach(([key, label]) => {
    const color = draftSettings.colors[key];
    const row = document.createElement("div");
    row.className = "color-row";
    row.innerHTML = `
      <span class="color-row-label">${label}</span>
      <input type="color" data-color-key="${key}" value="${color}" />
      <span class="color-swatch" data-swatch-key="${key}" style="background:${color}"></span>
    `;
    colorGrid.appendChild(row);

    const chip = document.createElement("div");
    chip.className = "preview-chip";
    chip.dataset.previewKey = key;
    chip.innerHTML = `${PREVIEW_LABELS[key]}<br /><span>${label}</span>`;
    previewGrid.appendChild(chip);
    applyPreviewStyles(key, color);
  });

  colorGrid.querySelectorAll('input[type="color"]').forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.colorKey;
      const normalized = LegacyUxSettings.normalizeHex(input.value);
      draftSettings.colors[key] = normalized;
      const swatch = colorGrid.querySelector(`[data-swatch-key="${key}"]`);
      if (swatch) swatch.style.background = normalized;
      applyPreviewStyles(key, normalized);
    });
  });
}

function applyPreviewStyles(key, color) {
  const chip = previewGrid.querySelector(`[data-preview-key="${key}"] span`);
  if (!chip) return;
  const appearance = draftSettings.appearance;
  chip.style.outline = `${appearance.outlineWidth}px ${appearance.outlineStyle} ${color}`;
  chip.style.outlineOffset = `${appearance.outlineOffset}px`;
  chip.style.boxShadow = appearance.glowEnabled
    ? `0 0 ${4 + appearance.glowIntensity * 12}px ${LegacyUxSettings.hexToRgba(color, appearance.glowIntensity)}`
    : "none";
}

function bindAppearanceControls() {
  outlineStyle.value = draftSettings.appearance.outlineStyle;
  outlineWidth.value = String(draftSettings.appearance.outlineWidth);
  outlineOffset.value = String(draftSettings.appearance.outlineOffset);
  glowIntensity.value = String(Math.round(draftSettings.appearance.glowIntensity * 100));
  glowEnabled.checked = draftSettings.appearance.glowEnabled;
  outlineWidthValue.textContent = `${draftSettings.appearance.outlineWidth}px`;
  outlineOffsetValue.textContent = `${draftSettings.appearance.outlineOffset}px`;
  glowIntensityValue.textContent = `${Math.round(draftSettings.appearance.glowIntensity * 100)}%`;
}

function bindFeatureControls() {
  trainingMode.checked = draftSettings.features.trainingMode;
  floatingIndicator.checked = draftSettings.features.floatingIndicator;
  scanShadowDom.checked = draftSettings.features.scanShadowDom;
  viewportOnly.checked = draftSettings.features.viewportOnly;
  pauseWhenHidden.checked = draftSettings.features.pauseWhenHidden;
}

function collectFormValues() {
  draftSettings.globalExclusions = globalExclusionsInput.value.trim();
  draftSettings.customSelectors = customSelectorsInput.value.trim();
  draftSettings.appearance = {
    outlineStyle: outlineStyle.value,
    outlineWidth: Number(outlineWidth.value),
    outlineOffset: Number(outlineOffset.value),
    glowIntensity: Number(glowIntensity.value) / 100,
    glowEnabled: glowEnabled.checked,
  };
  draftSettings.features = {
    trainingMode: trainingMode.checked,
    floatingIndicator: floatingIndicator.checked,
    scanShadowDom: scanShadowDom.checked,
    viewportOnly: viewportOnly.checked,
    pauseWhenHidden: pauseWhenHidden.checked,
  };
  return LegacyUxSettings.mergeWithDefaults(draftSettings);
}

function validateSettings(settings) {
  const allSelectors = [settings.globalExclusions, settings.customSelectors].join(", ");
  if (allSelectors.trim() && !LegacyUxSettings.areSelectorsSafe(allSelectors)) {
    showStatus("Hay selectores CSS inválidos.", true);
    return false;
  }
  return true;
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    draftSettings.mode = button.dataset.mode;
    updateModeUi(draftSettings.mode);
  });
});

[outlineStyle, outlineWidth, outlineOffset, glowIntensity, glowEnabled].forEach((control) => {
  control.addEventListener("input", () => {
    draftSettings.appearance.outlineStyle = outlineStyle.value;
    draftSettings.appearance.outlineWidth = Number(outlineWidth.value);
    draftSettings.appearance.outlineOffset = Number(outlineOffset.value);
    draftSettings.appearance.glowIntensity = Number(glowIntensity.value) / 100;
    draftSettings.appearance.glowEnabled = glowEnabled.checked;
    bindAppearanceControls();
    Object.keys(draftSettings.colors).forEach((key) => {
      applyPreviewStyles(key, draftSettings.colors[key]);
    });
  });
});

optionsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const settings = collectFormValues();
  if (!validateSettings(settings)) return;
  try {
    await LegacyUxSettings.save(settings);
    draftSettings = settings;
    showStatus("Configuración guardada correctamente.");
  } catch {
    showStatus("No se pudo guardar la configuración.", true);
  }
});

resetBtn.addEventListener("click", async () => {
  draftSettings = LegacyUxSettings.mergeWithDefaults({});
  globalExclusionsInput.value = draftSettings.globalExclusions;
  customSelectorsInput.value = draftSettings.customSelectors;
  updateModeUi(draftSettings.mode);
  bindAppearanceControls();
  bindFeatureControls();
  renderColorGrid();
  try {
    await LegacyUxSettings.save(draftSettings);
    showStatus("Configuración restablecida.");
  } catch {
    showStatus("No se pudo restablecer.", true);
  }
});

exportBtn.addEventListener("click", () => {
  const json = LegacyUxSettings.exportToJson(collectFormValues());
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "legacy-ux-helper-config.json";
  anchor.click();
  URL.revokeObjectURL(url);
  showStatus("Configuración exportada a tu equipo.");
});

importBtn.addEventListener("click", () => importInput.click());

importInput.addEventListener("change", async () => {
  const file = importInput.files?.[0];
  if (!file) return;
  try {
    draftSettings = LegacyUxSettings.importFromJson(await file.text());
    globalExclusionsInput.value = draftSettings.globalExclusions;
    customSelectorsInput.value = draftSettings.customSelectors;
    updateModeUi(draftSettings.mode);
    bindAppearanceControls();
    bindFeatureControls();
    renderColorGrid();
    await LegacyUxSettings.save(draftSettings);
    showStatus("Configuración importada correctamente.");
  } catch {
    showStatus("Archivo JSON inválido.", true);
  } finally {
    importInput.value = "";
  }
});

async function init() {
  draftSettings = await LegacyUxSettings.load();
  globalExclusionsInput.value = draftSettings.globalExclusions;
  customSelectorsInput.value = draftSettings.customSelectors;
  updateModeUi(draftSettings.mode);
  bindAppearanceControls();
  bindFeatureControls();
  renderPresets();
  renderColorGrid();
}

init();
