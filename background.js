const TAB_STATE_PREFIX = "tabState_";

function getTabStateKey(tabId) {
  return `${TAB_STATE_PREFIX}${tabId}`;
}

function isRestrictedUrl(url) {
  if (!url) {
    return true;
  }

  return /^(chrome|chrome-extension|edge|about|devtools|moz-extension):/i.test(url)
    || url.startsWith("https://chrome.google.com/webstore")
    || url.startsWith("https://chromewebstore.google.com");
}

async function setTabBadge(tabId, isActive) {
  await chrome.action.setBadgeText({
    tabId,
    text: isActive ? "ON" : "",
  });
  await chrome.action.setBadgeBackgroundColor({
    tabId,
    color: "#2563eb",
  });
  await chrome.action.setTitle({
    tabId,
    title: isActive
      ? "Legacy UX Helper: Resaltado activado"
      : "Legacy UX Helper: Resaltado desactivado",
  });
}

async function getTabState(tabId) {
  const key = getTabStateKey(tabId);
  const result = await chrome.storage.session.get(key);
  return Boolean(result[key]);
}

async function saveTabState(tabId, isActive) {
  const key = getTabStateKey(tabId);
  await chrome.storage.session.set({ [key]: isActive });
}

async function pingContentScript(tabId) {
  try {
    return await chrome.tabs.sendMessage(tabId, { action: "get_state" });
  } catch {
    return null;
  }
}

async function injectContentScript(tabId) {
  try {
    await chrome.scripting.insertCSS({
      target: { tabId, allFrames: true },
      files: ["styles.css"],
    });
  } catch {
    // El CSS ya puede estar inyectado por el content_script del manifest.
  }

  await chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    files: ["shared/settings.js", "content.js"],
  });
}

async function ensureContentScript(tabId) {
  if (await pingContentScript(tabId)) {
    return true;
  }

  try {
    await injectContentScript(tabId);
    return Boolean(await pingContentScript(tabId));
  } catch (error) {
    console.warn("Legacy UX Helper: no se pudo inyectar el content script.", error);
    return false;
  }
}

async function toggleHighlightInTab(tabId) {
  const ready = await ensureContentScript(tabId);
  if (!ready) {
    return { ok: false, state: false, error: "Recargá esta pestaña e intentá de nuevo. No se puede resaltar esta página." };
  }

  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      action: "toggle_highlight",
    });

    if (response?.status === "success") {
      const isActive = Boolean(response.state);
      await saveTabState(tabId, isActive);
      await setTabBadge(tabId, isActive);
      return { ok: true, state: isActive };
    }
  } catch (error) {
    console.warn("Legacy UX Helper: no se pudo comunicar con la pestaña.", error);
  }

  return { ok: false, state: false, error: "No se pudo activar el resaltado en esta pestaña." };
}

async function getHighlightStateFromTab(tabId) {
  const response = await pingContentScript(tabId);
  if (response) {
    return Boolean(response.state);
  }
  return getTabState(tabId);
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-highlight") {
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return;
  }

  if (isRestrictedUrl(tab.url)) {
    return;
  }

  await toggleHighlightInTab(tab.id);
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "popup_toggle") {
    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      if (!tab?.id) {
        sendResponse({ status: "error", state: false, error: "No hay una pestaña activa." });
        return;
      }

      if (isRestrictedUrl(tab.url)) {
        sendResponse({
          status: "error",
          state: false,
          error: "Esta página no permite extensiones. Abrí un sitio http/https.",
        });
        return;
      }

      const result = await toggleHighlightInTab(tab.id);
      sendResponse({
        status: result.ok ? "success" : "error",
        state: result.state,
        error: result.error,
      });
    });
    return true;
  }

  if (request.action === "popup_get_state") {
    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      if (!tab?.id) {
        sendResponse({ status: "error", state: false });
        return;
      }

      const state = await getHighlightStateFromTab(tab.id);
      sendResponse({ status: "success", state });
    });
    return true;
  }

  return false;
});
