// === SELECTORS ===
const SELECTORS = {
  unreadChat: '.b-chats__item--unread, [class*="chat"] [class*="unread"]',
  chatUserIdAttr: 'data-user-id',
  chatUserLink: 'a',
  fanMessage: '.b-chat__message:not(.m-from-me), [class*="message"]:not([class*="own"])',
  chatHeaderName: '.b-chat__header__name, [class*="chat-header"] [class*="name"]',
  chatTextarea: '.b-chat__input textarea, [class*="chat-input"] textarea, textarea[placeholder*="message"], textarea[placeholder*="Message"]',
  sendButton: 'button[type="submit"], button[class*="send"], .b-chat__btn-submit',
};

// === CONFIG ===
const CONFIG = {
  API_URL: 'https://api.aurafullsuite.it',
  POLL_INTERVAL: 10000,
  MIN_REPLY_DELAY: 2000,
  MAX_REPLY_DELAY: 5000,
  TYPING_SPEED_MIN: 20,
  TYPING_SPEED_MAX: 60,
  PAUSE_BETWEEN_CHATS: 3000,
  DEDUP_TIMEOUT: 300000,
  MAX_RETRIES: 3,
  RETRY_BASE_DELAY: 2000,
};

// === STATE ===
let isRunning = false;
let pollInterval = null;
const processedMessages = new Set();
let stats = { processed: 0, errors: 0, lastActivity: null };
let lastHeat = 0;
let lastPhase = "-";

// === LOGGING ===
function log(level, msg, data) {
  const ts = new Date().toISOString().slice(11, 19);
  const prefix = `[Aura:${level}][${ts}]`;
  if (level === 'ERROR') console.error(prefix, msg, data || '');
  else if (level === 'WARN') console.warn(prefix, msg, data || '');
  else console.log(prefix, msg, data || '');
}

// === LIFECYCLE ===
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'TOGGLE_AURA') {
    isRunning = msg.isRunning;
    if (isRunning) startPolling();
    else stopPolling();
  }
  if (msg.type === 'GET_STATUS') {
    sendResponse({ isRunning, stats });
    return true;
  }
  if (msg.type === 'TAKEOVER_ON') {
    takeoverFans.add(msg.fanId);
    log('INFO', `Human takeover ON for fan ${msg.fanId}`);
  }
  if (msg.type === 'TAKEOVER_OFF') {
    takeoverFans.delete(msg.fanId);
    log('INFO', `Human takeover OFF for fan ${msg.fanId}`);
  }
});

const takeoverFans = new Set();

chrome.storage.local.get(['isRunning'], (data) => {
  isRunning = data.isRunning || false;
  if (isRunning) startPolling();
  log('INFO', `Init — bot ${isRunning ? 'ACTIVE' : 'PAUSED'}`);
});

function startPolling() {
  log('INFO', 'Started polling');
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(checkNewMessages, CONFIG.POLL_INTERVAL);
  checkNewMessages();
  chrome.runtime.sendMessage({ type: 'BOT_STATE', active: true });
}

function stopPolling() {
  log('INFO', 'Stopped polling');
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = null;
  chrome.runtime.sendMessage({ type: 'BOT_STATE', active: false });
}

// === CORE LOOP ===
async function checkNewMessages() {
  if (!isRunning) return;

  try {
    const chatItems = document.querySelectorAll(SELECTORS.unreadChat);

    for (const item of chatItems) {
      const userId = item.getAttribute(SELECTORS.chatUserIdAttr) ||
        item.querySelector(SELECTORS.chatUserLink)?.href?.match(/\/(\d+)\/?$/)?.[1];

      if (!userId || processedMessages.has(userId)) continue;
      if (takeoverFans.has(userId)) {
        log('INFO', `Skipping fan ${userId} — human takeover active`);
        continue;
      }

      processedMessages.add(userId);

      // Open chat
      item.click();
      await sleep(CONFIG.MIN_REPLY_DELAY);

      // Extract last fan message
      const msgs = document.querySelectorAll(SELECTORS.fanMessage);
      const lastMsg = msgs[msgs.length - 1];
      if (!lastMsg) {
        log('WARN', `No fan message found for ${userId}`);
        continue;
      }

      const fanMessage = lastMsg.textContent?.trim();
      if (!fanMessage) continue;

      const fanName = document.querySelector(SELECTORS.chatHeaderName)?.textContent?.trim() || 'Fan';

      log('INFO', `New message from ${fanName}: "${fanMessage.slice(0, 60)}"`);

      // Get AI reply with retry
      const reply = await getAIReplyWithRetry(userId, fanName, fanMessage);
      if (!reply) continue;

      // Type and send with human-like delay
      const delay = randomBetween(CONFIG.MIN_REPLY_DELAY, CONFIG.MAX_REPLY_DELAY);
      await sleep(delay);
      await typeReply(reply);

      // Update stats
      stats.processed++;
      stats.lastActivity = new Date().toISOString();
      chrome.storage.local.set({ auraStats: stats });
      chrome.runtime.sendMessage({ type: 'MSG_PROCESSED', stats });

      log('INFO', `Reply sent to ${fanName} (${reply.length} chars, ${delay}ms delay)`);

      // Update sidebar
      if (typeof window.__auraUpdateFan === 'function') {
        window.__auraUpdateFan(userId, { name: fanName, lastMsg: fanMessage.slice(0, 80), heat: lastHeat, phase: lastPhase, unread: false });
      }
      
            // Update sidebar with heat/phase data
      if (typeof window.__auraUpdateFan === 'function') {
        window.__auraUpdateFan(userId, {
          name: fanName,
          lastMsg: fanMessage.slice(0, 80),
          heat: reply.__heat || 0,
          phase: reply.__phase || '-',
          unread: false,
        });
      }

      // Pause between chats
      await sleep(CONFIG.PAUSE_BETWEEN_CHATS);

      // Allow reprocessing after timeout
      setTimeout(() => processedMessages.delete(userId), CONFIG.DEDUP_TIMEOUT);
    }
  } catch (err) {
    stats.errors++;
    log('ERROR', 'Poll cycle failed', err.message);
  }
}

// === API WITH RETRY ===
async function getAIReplyWithRetry(fanId, fanName, fanMessage) {
  const stored = await chrome.storage.local.get(['token', 'creatorId']);
  if (!stored.token) {
    log('WARN', 'No token configured');
    return null;
  }

  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${CONFIG.API_URL}/api/extension/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${stored.token}`,
        },
        body: JSON.stringify({
          creatorId: stored.creatorId,
          fanId,
          fanName,
          fanMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      if (!data.reply) {
        log('INFO', `No reply — reason: ${data.reason || 'unknown'}`);
        return null;
      }

      log('INFO', `AI reply [${data.model}] phase:${data.phase} heat:${data.heat}`);
      lastHeat = data.heat || 0;
      lastPhase = data.phase || '-';
      return data.reply;

    } catch (err) {
      log('WARN', `API attempt ${attempt}/${CONFIG.MAX_RETRIES} failed: ${err.message}`);
      if (attempt < CONFIG.MAX_RETRIES) {
        await sleep(CONFIG.RETRY_BASE_DELAY * attempt);
      }
    }
  }

  log('ERROR', `API failed after ${CONFIG.MAX_RETRIES} attempts for fan ${fanId}`);
  stats.errors++;
  return null;
}

// === DOM INTERACTION ===
async function typeReply(text) {
  const input = document.querySelector(SELECTORS.chatTextarea);
  if (!input) {
    log('ERROR', 'Chat textarea not found');
    return;
  }

  input.focus();
  await sleep(300);

  // Human-like typing
  for (const char of text) {
    input.value += char;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(randomBetween(CONFIG.TYPING_SPEED_MIN, CONFIG.TYPING_SPEED_MAX));
  }

  await sleep(500);

  // Send
  const sendBtn = document.querySelector(SELECTORS.sendButton);
  if (sendBtn) {
    sendBtn.click();
  } else {
    log('WARN', 'Send button not found, using Enter key');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  }

  await sleep(300);
  input.value = '';
}

// === UTILS ===
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}