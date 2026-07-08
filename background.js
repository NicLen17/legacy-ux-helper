const TAB_STATE_PREFIX = "tabState_";

function getTabStateKey(tabId) {
  return `${TAB_STATE_PREFIX}${tabId}`;
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

async function toggleHighlightInTab(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      action: "toggle_highlight",
    });

    if (response?.status === "success") {
      const isActive = Boolean(response.state);
      await saveTabState(tabId, isActive);
      await setTabBadge(tabId, isActive);
      return isActive;
    }
  } catch {
    console.warn(
      "Legacy UX Helper: No se pudo comunicar con la pestaña. Puede ser una página restringida."
    );
  }

  return false;
}

async function getHighlightStateFromTab(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      action: "get_state",
    });
    return Boolean(response?.state);
  } catch {
    return getTabState(tabId);
  }
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-highlight") {
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return;
  }

  await toggleHighlightInTab(tab.id);
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "popup_toggle") {
    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      if (!tab?.id) {
        sendResponse({ status: "error", state: false });
        return;
      }

      const state = await toggleHighlightInTab(tab.id);
      sendResponse({ status: "success", state });
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
