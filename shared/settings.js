/* global LegacyUxSettings */
const LegacyUxSettings = (() => {
  const STORAGE_KEY = "userSettings";
  const LEGACY_COLOR_KEY = "highlightColor";
  const EXPORT_VERSION = "1.3";

  const DEFAULT_COLORS = {
    button: "#22c55e",
    link: "#3b82f6",
    input: "#f59e0b",
    select: "#8b5cf6",
    textarea: "#06b6d4",
    aria: "#ec4899",
    legacy: "#ef4444",
    custom: "#14b8a6",
    table: "#a855f7",
  };

  const COLOR_LABELS = {
    button: "Botones",
    link: "Enlaces",
    input: "Inputs",
    select: "Selects",
    textarea: "Textareas",
    aria: "ARIA / roles",
    legacy: "Legacy (pointer/onclick)",
    custom: "Selectores custom",
    table: "Tablas clickeables",
  };

  const TYPE_LABELS = {
    button: "Botón",
    link: "Enlace",
    input: "Campo editable",
    select: "Select",
    textarea: "Área de texto",
    aria: "Elemento ARIA",
    legacy: "Acción legacy",
    custom: "Selector custom",
    table: "Celda/fila clickeable",
  };

  const PRESETS = {
    default: {
      name: "Predeterminado",
      colors: { ...DEFAULT_COLORS },
    },
    highContrast: {
      name: "Alto contraste",
      colors: {
        button: "#00ff00",
        link: "#00bfff",
        input: "#ffff00",
        select: "#ff00ff",
        textarea: "#00ffff",
        aria: "#ff6600",
        legacy: "#ff0000",
        custom: "#ffffff",
        table: "#ffcc00",
      },
    },
    colorblind: {
      name: "Daltonismo-friendly",
      colors: {
        button: "#0072b2",
        link: "#e69f00",
        input: "#009e73",
        select: "#cc79a7",
        textarea: "#56b4e9",
        aria: "#d55e00",
        legacy: "#000000",
        custom: "#f0e442",
        table: "#882255",
      },
    },
    legacyErp: {
      name: "ERP Legacy",
      colors: {
        button: "#16a34a",
        link: "#2563eb",
        input: "#ca8a04",
        select: "#7c3aed",
        textarea: "#0891b2",
        aria: "#db2777",
        legacy: "#dc2626",
        custom: "#0d9488",
        table: "#9333ea",
      },
    },
  };

  const DEFAULT_APPEARANCE = {
    outlineStyle: "dashed",
    outlineWidth: 2,
    outlineOffset: 2,
    glowIntensity: 0.4,
    glowEnabled: true,
  };

  const DEFAULT_FEATURES = {
    floatingIndicator: true,
    trainingMode: false,
    scanShadowDom: true,
    viewportOnly: false,
    pauseWhenHidden: true,
  };

  const DEFAULTS = {
    mode: "all",
    colors: { ...DEFAULT_COLORS },
    appearance: { ...DEFAULT_APPEARANCE },
    features: { ...DEFAULT_FEATURES },
    globalExclusions: "[aria-hidden='true']",
    customSelectors: "",
  };

  function isValidHex(hex) {
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
  }

  function normalizeHex(hex) {
    if (!hex) {
      return DEFAULT_COLORS.button;
    }

    const trimmed = hex.trim();

    if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
      const chars = trimmed.slice(1).split("");
      return `#${chars.map((char) => char + char).join("")}`.toLowerCase();
    }

    if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
      return trimmed.toLowerCase();
    }

    return DEFAULT_COLORS.button;
  }

  function hexToRgba(hex, alpha) {
    const normalized = normalizeHex(hex).replace("#", "");
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function normalizeAppearance(appearance) {
    const partial =
      typeof appearance === "object" && appearance !== null ? appearance : {};
    const outlineStyle = ["dashed", "solid", "dotted"].includes(
      partial.outlineStyle
    )
      ? partial.outlineStyle
      : DEFAULT_APPEARANCE.outlineStyle;

    return {
      outlineStyle,
      outlineWidth: Math.min(
        6,
        Math.max(1, Number(partial.outlineWidth) || DEFAULT_APPEARANCE.outlineWidth)
      ),
      outlineOffset: Math.min(
        8,
        Math.max(0, Number(partial.outlineOffset) || DEFAULT_APPEARANCE.outlineOffset)
      ),
      glowIntensity: Math.min(
        1,
        Math.max(0, Number(partial.glowIntensity) ?? DEFAULT_APPEARANCE.glowIntensity)
      ),
      glowEnabled:
        typeof partial.glowEnabled === "boolean"
          ? partial.glowEnabled
          : DEFAULT_APPEARANCE.glowEnabled,
    };
  }

  function normalizeFeatures(features) {
    const partial = typeof features === "object" && features !== null ? features : {};

    return {
      floatingIndicator:
        typeof partial.floatingIndicator === "boolean"
          ? partial.floatingIndicator
          : DEFAULT_FEATURES.floatingIndicator,
      trainingMode:
        typeof partial.trainingMode === "boolean"
          ? partial.trainingMode
          : DEFAULT_FEATURES.trainingMode,
      scanShadowDom:
        typeof partial.scanShadowDom === "boolean"
          ? partial.scanShadowDom
          : DEFAULT_FEATURES.scanShadowDom,
      viewportOnly:
        typeof partial.viewportOnly === "boolean"
          ? partial.viewportOnly
          : DEFAULT_FEATURES.viewportOnly,
      pauseWhenHidden:
        typeof partial.pauseWhenHidden === "boolean"
          ? partial.pauseWhenHidden
          : DEFAULT_FEATURES.pauseWhenHidden,
    };
  }

  function mergeWithDefaults(value) {
    const partial = typeof value === "object" && value !== null ? value : {};
    const colors = {
      ...DEFAULT_COLORS,
      ...(partial.colors || {}),
    };

    Object.keys(colors).forEach((key) => {
      colors[key] = normalizeHex(colors[key]);
    });

    const mode = ["all", "legacy", "hover"].includes(partial.mode)
      ? partial.mode
      : DEFAULTS.mode;

    return {
      mode,
      colors,
      appearance: normalizeAppearance(partial.appearance),
      features: normalizeFeatures(partial.features),
      globalExclusions:
        typeof partial.globalExclusions === "string"
          ? partial.globalExclusions
          : DEFAULTS.globalExclusions,
      customSelectors:
        typeof partial.customSelectors === "string"
          ? partial.customSelectors
          : DEFAULTS.customSelectors,
    };
  }

  function load() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY, LEGACY_COLOR_KEY], (result) => {
        if (result[STORAGE_KEY]) {
          resolve(mergeWithDefaults(result[STORAGE_KEY]));
          return;
        }

        chrome.storage.sync.get([STORAGE_KEY, LEGACY_COLOR_KEY], (syncResult) => {
          if (syncResult[STORAGE_KEY]) {
            const migrated = mergeWithDefaults(syncResult[STORAGE_KEY]);
            chrome.storage.local.set({ [STORAGE_KEY]: migrated });
            resolve(migrated);
            return;
          }

          if (syncResult[LEGACY_COLOR_KEY] || result[LEGACY_COLOR_KEY]) {
            const legacyColor = syncResult[LEGACY_COLOR_KEY] || result[LEGACY_COLOR_KEY];
            resolve(
              mergeWithDefaults({
                colors: Object.fromEntries(
                  Object.keys(DEFAULT_COLORS).map((key) => [key, legacyColor])
                ),
              })
            );
            return;
          }

          resolve(mergeWithDefaults({}));
        });
      });
    });
  }

  function save(settings) {
    const normalized = mergeWithDefaults(settings);

    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [STORAGE_KEY]: normalized }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve();
      });
    });
  }

  function exportToJson(settings) {
    return JSON.stringify(
      {
        app: "Legacy UX Helper",
        version: EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        settings: mergeWithDefaults(settings),
      },
      null,
      2
    );
  }

  function importFromJson(raw) {
    const parsed = JSON.parse(raw);
    return mergeWithDefaults(parsed.settings || parsed);
  }

  function applyPreset(presetKey, currentSettings) {
    const preset = PRESETS[presetKey];
    if (!preset) {
      return mergeWithDefaults(currentSettings);
    }

    return mergeWithDefaults({
      ...currentSettings,
      colors: { ...preset.colors },
    });
  }

  function parseSelectors(selectors) {
    return selectors
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function areSelectorsSafe(selectors) {
    const items = parseSelectors(selectors);

    return items.every((selector) => {
      try {
        document.querySelector(selector);
        return true;
      } catch {
        return false;
      }
    });
  }

  return {
    STORAGE_KEY,
    EXPORT_VERSION,
    DEFAULTS,
    DEFAULT_COLORS,
    COLOR_LABELS,
    TYPE_LABELS,
    PRESETS,
    isValidHex,
    normalizeHex,
    hexToRgba,
    mergeWithDefaults,
    load,
    save,
    exportToJson,
    importFromJson,
    applyPreset,
    parseSelectors,
    areSelectorsSafe,
  };
})();
