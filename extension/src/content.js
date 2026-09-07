const API_URL = 'https://api.aurafullsuite.it';
let isRunning = false;
let pollInterval = null;
let processedMessages = new Set();

// Ascolta toggle dal popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'TOGGLE_AURA') {
    isRunning = msg.isRunning;
    if (isRunning) startPolling();
    else stopPolling();
  }
});

// Controlla stato all'avvio
chrome.storage.local.get(['isRunning'], (data) => {
  isRunning = data.isRunning || false;
  if (isRunning) startPolling();
});

function startPolling() {
  console.log('[Aura] Started');
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(checkNewMessages, 10000);
  checkNewMessages();
}

function stopPolling() {
  console.log('[Aura] Stopped');
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = null;
}

async function checkNewMessages() {
  if (!isRunning) return;

  try {
    // Trova chat non lette nel DOM
    const chatItems = document.querySelectorAll('[class*="chat"] [class*="unread"], .b-chats__item--unread');
    
    for (const item of chatItems) {
      const userId = item.getAttribute('data-user-id') ||
        item.querySelector('a')?.href?.match(/\/(\d+)\/?$/)?.[1];

      if (!userId || processedMessages.has(userId)) continue;
      processedMessages.add(userId);

      // Apri la chat
      item.click();
      await sleep(2000);

      // Leggi ultimo messaggio del fan
      const msgs = document.querySelectorAll('.b-chat__message:not(.m-from-me), [class*="message"]:not([class*="own"])');
      const lastMsg = msgs[msgs.length - 1];
      if (!lastMsg) continue;

      const fanMessage = lastMsg.textContent?.trim();
      if (!fanMessage) continue;

      const fanName = document.querySelector('.b-chat__header__name, [class*="chat-header"] [class*="name"]')?.textContent?.trim() || 'Fan';

      console.log(`[Aura] New message from ${fanName}: ${fanMessage.slice(0, 50)}`);

      // Manda al backend
      const reply = await getAIReply(userId, fanName, fanMessage);
      if (!reply) continue;

      // Digita la risposta
      await typeReply(reply);

      // Delay umano prima del prossimo
      await sleep(3000);

      // Rimuovi dalla lista processati dopo 5 minuti (per permettere nuovi messaggi)
      setTimeout(() => processedMessages.delete(userId), 300000);
    }
  } catch (err) {
    console.error('[Aura] Error:', err);
  }
}

async function getAIReply(fanId, fanName, fanMessage) {
  const stored = await chrome.storage.local.get(['token', 'creatorId']);
  if (!stored.token) return null;

  try {
    // Invia il messaggio al backend per elaborazione AI
    const res = await fetch(`${API_URL}/api/extension/process`, {
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
    if (!res.ok) throw new Error(data.error);

    return data.reply;
  } catch (err) {
    console.error('[Aura] API error:', err);
    return null;
  }
}

async function typeReply(text) {
  const input = document.querySelector(
    '.b-chat__input textarea, ' +
    '[class*="chat-input"] textarea, ' +
    'textarea[placeholder*="message"], ' +
    'textarea[placeholder*="Message"]'
  );

  if (!input) {
    console.error('[Aura] Chat input not found');
    return;
  }

  input.focus();
  await sleep(300);

  // Simula typing umano
  for (const char of text) {
    input.value += char;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(20 + Math.random() * 40);
  }

  await sleep(500);

  // Invia
  const sendBtn = document.querySelector(
    'button[type="submit"], ' +
    'button[class*="send"], ' +
    '.b-chat__btn-submit'
  );

  if (sendBtn) {
    sendBtn.click();
  } else {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  }

  await sleep(300);
  input.value = '';
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}