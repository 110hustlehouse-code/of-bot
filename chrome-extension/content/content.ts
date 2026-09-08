import {
  OFMessage,
  extractFanIdFromUrl,
  extractLatestFanMessage,
  injectReplyText,
  clickSendButton,
  showHumanModeBadge,
  debugInspectChat,
} from "../utils/of-dom";

interface ChatState {
  takeover: boolean;
  lastProcessed: number;
}

const chatStateMap = new Map<string, ChatState>();
const processedMessages = new Set<string>();
const DEBOUNCE_MS = 3000;
let creatorId = "";

function messageHash(msg: OFMessage): string {
  return `${msg.fanId}:${msg.timestamp}:${msg.text.slice(0, 50)}`;
}

function getChatState(fanId: string): ChatState {
  let state = chatStateMap.get(fanId);
  if (!state) {
    state = { takeover: false, lastProcessed: 0 };
    chatStateMap.set(fanId, state);
  }
  return state;
}

function randomDelay(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((r) => setTimeout(r, ms));
}

function handleNewMessage(): void {
  const msg = extractLatestFanMessage();
  if (!msg) return;

  const hash = messageHash(msg);
  if (processedMessages.has(hash)) return;

  const state = getChatState(msg.fanId);
  const now = Date.now();
  if (now - state.lastProcessed < DEBOUNCE_MS) return;

  processedMessages.add(hash);
  state.lastProcessed = now;

  if (state.takeover) return;

  chrome.runtime.sendMessage({
    type: "NEW_FAN_MESSAGE",
    payload: {
      fanId: msg.fanId,
      fanUsername: msg.fanUsername,
      text: msg.text,
      timestamp: msg.timestamp,
      chatUrl: msg.chatUrl,
      creatorId,
    },
  });
}

function startObserver(): void {
  const containerSelectors = [
    ".b-chats__messages-list",
    ".b-chat__messages",
    ".m-chat-messages",
    '[data-role="chat-messages"]',
  ];

  let container: Element | null = null;
  for (const sel of containerSelectors) {
    container = document.querySelector(sel);
    if (container) break;
  }

  if (!container) {
    setTimeout(startObserver, 500);
    return;
  }

  const observer = new MutationObserver(() => {
    handleNewMessage();
  });

  observer.observe(container, { childList: true, subtree: true });
  handleNewMessage();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const fanId = extractFanIdFromUrl();

  if (message.type === "INJECT_REPLY" && message.text) {
    (async () => {
      await randomDelay(800, 2000);
      const injected = await injectReplyText(message.text);
      if (injected) {
        await randomDelay(300, 600);
        const sent = await clickSendButton();
        sendResponse({ success: sent });
      } else {
        sendResponse({ success: false });
      }
    })();
    return true;
  }

  if (message.type === "TAKEOVER_ON" && message.fanId) {
    const state = getChatState(message.fanId);
    state.takeover = true;
    chrome.storage.local.set({ [`takeover_${message.fanId}`]: true });
    if (fanId === message.fanId) showHumanModeBadge(true);
    sendResponse({ success: true });
    return false;
  }

  if (message.type === "TAKEOVER_OFF" && message.fanId) {
    const state = getChatState(message.fanId);
    state.takeover = false;
    chrome.storage.local.set({ [`takeover_${message.fanId}`]: false });
    if (fanId === message.fanId) showHumanModeBadge(false);
    sendResponse({ success: true });
    return false;
  }

  if (message.type === "GET_STATUS") {
    const currentFanId = fanId;
    const state = currentFanId ? getChatState(currentFanId) : null;
    sendResponse({
      fanId: currentFanId,
      creatorId,
      takeover: state?.takeover ?? false,
      chatsTracked: chatStateMap.size,
      messagesProcessed: processedMessages.size,
    });
    return false;
  }

  return false;
});

async function init(): Promise<void> {
  const result = await chrome.storage.local.get(["creatorId"]);
  creatorId = (result.creatorId as string) || "";

  const fanId = extractFanIdFromUrl();
  if (fanId) {
    const takeoverResult = await chrome.storage.local.get([`takeover_${fanId}`]);
    const isTakeover = takeoverResult[`takeover_${fanId}`] === true;
    const state = getChatState(fanId);
    state.takeover = isTakeover;
    if (isTakeover) showHumanModeBadge(true);
  }

  debugInspectChat();
  startObserver();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => init());
} else {
  init();
}
