// === Aura Background Service Worker ===

// On install
chrome.runtime.onInstalled.addListener((details) => {
  console.log(`[Aura] Installed v${chrome.runtime.getManifest().version} (${details.reason})`);
  chrome.storage.local.set({
    isRunning: false,
    auraStats: { processed: 0, errors: 0, lastActivity: null },
  });
  updateBadge(false);
});

// On startup
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['isRunning'], (data) => {
    updateBadge(data.isRunning || false);
  });
});

// Message router
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case 'BOT_STATE':
      updateBadge(msg.active);
      break;

    case 'MSG_PROCESSED':
      if (msg.stats) {
        chrome.storage.local.set({ auraStats: msg.stats });
        updateBadgeCount(msg.stats.processed);
      }
      break;

    case 'GET_STATS':
      chrome.storage.local.get(['auraStats'], (data) => {
        sendResponse(data.auraStats || { processed: 0, errors: 0, lastActivity: null });
      });
      return true;

    case 'CLEAR_STATS':
      const fresh = { processed: 0, errors: 0, lastActivity: null };
      chrome.storage.local.set({ auraStats: fresh });
      sendResponse(fresh);
      return true;

    case 'ACTIVATE_TAKEOVER':
      forwardToContentScript(sender, { type: 'TAKEOVER_ON', fanId: msg.fanId });
      break;

    case 'DEACTIVATE_TAKEOVER':
      forwardToContentScript(sender, { type: 'TAKEOVER_OFF', fanId: msg.fanId });
      break;
  }
});

// Forward message to the active OF tab
async function forwardToContentScript(sender, message) {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://onlyfans.com/*' });
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, message);
    }
  } catch (err) {
    console.error('[Aura] Forward to content script failed:', err);
  }
}

// Badge: green ON / red OFF
function updateBadge(active) {
  chrome.action.setBadgeText({ text: active ? 'ON' : 'OFF' });
  chrome.action.setBadgeBackgroundColor({
    color: active ? '#30D158' : '#FF453A',
  });
  chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
}

// Badge: show message count
function updateBadgeCount(count) {
  if (count > 0) {
    chrome.action.setBadgeText({ text: String(count) });
    chrome.action.setBadgeBackgroundColor({ color: '#C9A961' });
  }
}