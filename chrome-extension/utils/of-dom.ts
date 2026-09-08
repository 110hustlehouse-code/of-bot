export interface OFMessage {
  fanId: string;
  fanUsername: string;
  text: string;
  timestamp: number;
  chatUrl: string;
}

export function extractFanIdFromUrl(): string | null {
  const match = window.location.pathname.match(/\/my\/chats\/(\d+)/);
  return match ? match[1] : null;
}

export function extractLatestFanMessage(): OFMessage | null {
  const fanId = extractFanIdFromUrl();
  if (!fanId) return null;

  const selectors = [
    ".b-chat__message--incoming",
    '[data-type="incoming"]',
    ".m-chat-message--incoming",
    ".b-chat__message[data-incoming='true']",
  ];

  let messageElements: NodeListOf<Element> | null = null;
  for (const selector of selectors) {
    const found = document.querySelectorAll(selector);
    if (found.length > 0) {
      messageElements = found;
      break;
    }
  }

  if (!messageElements || messageElements.length === 0) return null;

  const lastMessage = messageElements[messageElements.length - 1];

  const textSelectors = [
    ".b-chat__message__text",
    ".m-chat-message__text",
    '[data-role="message-text"]',
    ".message-text",
  ];

  let text = "";
  for (const sel of textSelectors) {
    const el = lastMessage.querySelector(sel);
    if (el?.textContent?.trim()) {
      text = el.textContent.trim();
      break;
    }
  }

  if (!text) return null;

  const usernameSelectors = [
    ".b-chat__message__username",
    ".m-chat-message__username",
    '[data-role="username"]',
    ".username",
  ];

  let fanUsername = "Unknown";
  for (const sel of usernameSelectors) {
    const el = lastMessage.querySelector(sel);
    if (el?.textContent?.trim()) {
      fanUsername = el.textContent.trim();
      break;
    }
  }

  const timeSelectors = [
    ".b-chat__message__time",
    ".m-chat-message__time",
    "time",
    '[data-role="timestamp"]',
  ];

  let timestamp = Date.now();
  for (const sel of timeSelectors) {
    const el = lastMessage.querySelector(sel);
    if (el) {
      const dt = el.getAttribute("datetime");
      if (dt) {
        timestamp = new Date(dt).getTime();
        break;
      }
    }
  }

  return {
    fanId,
    fanUsername,
    text,
    timestamp,
    chatUrl: window.location.href,
  };
}

export async function injectReplyText(text: string): Promise<boolean> {
  const textareaSelectors = [
    "textarea.b-chat__input",
    'textarea[data-role="chat-input"]',
    ".b-chat__input textarea",
    ".m-chat-input textarea",
    "textarea",
  ];

  let textarea: HTMLTextAreaElement | null = null;
  const maxWait = 5000;
  const interval = 200;
  let elapsed = 0;

  while (!textarea && elapsed < maxWait) {
    for (const sel of textareaSelectors) {
      const el = document.querySelector(sel) as HTMLTextAreaElement | null;
      if (el && el.tagName === "TEXTAREA") {
        textarea = el;
        break;
      }
    }
    if (!textarea) {
      await new Promise((r) => setTimeout(r, interval));
      elapsed += interval;
    }
  }

  if (!textarea) return false;

  textarea.focus();

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value"
  )?.set;

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(textarea, text);
  } else {
    textarea.value = text;
  }

  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.dispatchEvent(new Event("change", { bubbles: true }));
  textarea.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: text,
    })
  );
  textarea.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "a" }));
  textarea.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "a" }));

  return true;
}

export async function clickSendButton(): Promise<boolean> {
  const buttonSelectors = [
    'button.b-chat__btn-submit',
    'button[type="submit"]',
    '[data-role="send-button"]',
    ".b-chat__send-btn",
    'button[aria-label="Send"]',
    'button[aria-label="Invia"]',
  ];

  for (const sel of buttonSelectors) {
    const btn = document.querySelector(sel) as HTMLButtonElement | null;
    if (btn && !btn.disabled) {
      btn.click();
      return true;
    }
  }

  return false;
}

const BADGE_ID = "aura-human-mode-badge";

export function showHumanModeBadge(active: boolean): void {
  let badge = document.getElementById(BADGE_ID);

  if (active) {
    if (!badge) {
      badge = document.createElement("div");
      badge.id = BADGE_ID;
      badge.style.cssText = [
        "position:fixed",
        "top:8px",
        "right:8px",
        "z-index:999999",
        "background:#ff4444",
        "color:#fff",
        "padding:6px 12px",
        "border-radius:20px",
        "font-family:sans-serif",
        "font-size:13px",
        "font-weight:700",
        "box-shadow:0 2px 8px rgba(0,0,0,0.3)",
        "pointer-events:none",
      ].join(";");
      document.body.appendChild(badge);
    }
    badge.textContent = "🔴 HUMAN MODE";
    badge.style.display = "block";
  } else {
    if (badge) {
      badge.style.display = "none";
    }
  }
}
