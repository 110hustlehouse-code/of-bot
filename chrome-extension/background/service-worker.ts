import { AuraApiClient } from "../utils/api-client";

interface FanMessagePayload {
  fanId: string;
  fanUsername: string;
  text: string;
  timestamp: number;
  chatUrl: string;
  creatorId: string;
}

interface FanStats {
  heatScore: number;
  phase: string;
  lastMessage: number;
  username: string;
}

let botActive = true;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ botActive: true });
  console.log("Aura OF Assistant installed");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "NEW_FAN_MESSAGE") {
    handleNewFanMessage(message.payload as FanMessagePayload, sender.tab?.id ?? null)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ error: String(err) }));
    return true;
  }

  if (message.type === "TOGGLE_BOT") {
    botActive = !botActive;
    chrome.storage.local.set({ botActive });
    sendResponse({ botActive });
    return false;
  }

  if (message.type === "GET_BOT_STATE") {
    chrome.storage.local.get(["botActive", "creatorId", "messagesProcessed"], (result) => {
      sendResponse({
        botActive: result.botActive ?? true,
        creatorId: result.creatorId ?? "",
        messagesProcessed: result.messagesProcessed ?? 0,
      });
    });
    return true;
  }

  if (message.type === "SET_CREATOR_ID") {
    chrome.storage.local.set({ creatorId: message.creatorId });
    sendResponse({ success: true });
    return false;
  }

  if (message.type === "ACTIVATE_TAKEOVER") {
    handleActivateTakeover(message.fanId, message.creatorId)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ error: String(err) }));
    return true;
  }

  if (message.type === "DEACTIVATE_TAKEOVER") {
    handleDeactivateTakeover(message.fanId, message.creatorId)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ error: String(err) }));
    return true;
  }

  if (message.type === "GET_STATS") {
    handleGetStats(message.creatorId)
      .then((stats) => sendResponse(stats))
      .catch((err) => sendResponse({ error: String(err) }));
    return true;
  }

  if (message.type === "GET_ACTIVE_CHATS") {
    chrome.storage.local.get(null, (all) => {
      const chats: Record<string, FanStats> = {};
      for (const [key, value] of Object.entries(all)) {
        if (key.startsWith("fan_stats_")) {
          const fanId = key.replace("fan_stats_", "");
          chats[fanId] = value as FanStats;
        }
      }
      sendResponse({ chats });
    });
    return true;
  }

  return false;
});

async function handleNewFanMessage(
  payload: FanMessagePayload,
  tabId: number | null
): Promise<{ processed: boolean }> {
  const isTakeover = await checkTakeover(payload.fanId);
  if (isTakeover) {
    console.log(`[Aura] Takeover active for fan ${payload.fanId}, skipping`);
    return { processed: false };
  }

  if (!botActive) {
    console.log("[Aura] Bot paused, skipping");
    return { processed: false };
  }

  try {
    const client = await AuraApiClient.create();
    const result = await client.processMessage({
      fanId: payload.fanId,
      creatorId: payload.creatorId,
      messageText: payload.text,
      chatUrl: payload.chatUrl,
    });

    const statsKey = `fan_stats_${payload.fanId}`;
    const fanStats: FanStats = {
      heatScore: result.heatScore,
      phase: result.phase,
      lastMessage: Date.now(),
      username: payload.fanUsername,
    };
    await chrome.storage.local.set({ [statsKey]: fanStats });

    await incrementMessageCount();

    if (result.shouldSend && result.reply && tabId) {
      chrome.tabs.sendMessage(tabId, {
        type: "INJECT_REPLY",
        text: result.reply,
      });
    }

    return { processed: true };
  } catch (err) {
    console.error("[Aura] Error processing message:", err);
    return { processed: false };
  }
}

async function checkTakeover(fanId: string): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get([`takeover_${fanId}`], (result) => {
      resolve(result[`takeover_${fanId}`] === true);
    });
  });
}

async function incrementMessageCount(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["messagesProcessed"], (result) => {
      const count = ((result.messagesProcessed as number) || 0) + 1;
      chrome.storage.local.set({ messagesProcessed: count }, resolve);
    });
  });
}

async function handleActivateTakeover(fanId: string, creatorId: string): Promise<void> {
  await chrome.storage.local.set({ [`takeover_${fanId}`]: true });
  const tabs = await chrome.tabs.query({ url: "https://onlyfans.com/my/chats*" });
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: "TAKEOVER_ON", fanId });
    }
  }
  try {
    const client = await AuraApiClient.create();
    await client.activateTakeover(fanId, creatorId);
  } catch (err) {
    console.error("[Aura] Failed to notify API of takeover:", err);
  }
}

async function handleDeactivateTakeover(fanId: string, creatorId: string): Promise<void> {
  await chrome.storage.local.set({ [`takeover_${fanId}`]: false });
  const tabs = await chrome.tabs.query({ url: "https://onlyfans.com/my/chats*" });
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: "TAKEOVER_OFF", fanId });
    }
  }
  try {
    const client = await AuraApiClient.create();
    await client.deactivateTakeover(fanId, creatorId);
  } catch (err) {
    console.error("[Aura] Failed to notify API of takeover deactivation:", err);
  }
}

async function handleGetStats(
  creatorId: string
): Promise<{ messagesProcessed: number; conversions: number; revenue: number }> {
  try {
    const client = await AuraApiClient.create();
    return await client.getSessionStats(creatorId);
  } catch {
    return new Promise((resolve) => {
      chrome.storage.local.get(["messagesProcessed"], (result) => {
        resolve({
          messagesProcessed: (result.messagesProcessed as number) || 0,
          conversions: 0,
          revenue: 0,
        });
      });
    });
  }
}
