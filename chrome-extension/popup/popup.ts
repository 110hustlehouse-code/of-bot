const botToggle = document.getElementById("bot-toggle") as HTMLInputElement;
const toggleLabel = document.getElementById("toggle-label") as HTMLSpanElement;
const creatorNameEl = document.getElementById("creator-name") as HTMLElement;
const msgCountEl = document.getElementById("msg-count") as HTMLElement;
const openSidebarLink = document.getElementById("open-sidebar") as HTMLAnchorElement;
const tokenSection = document.getElementById("token-section") as HTMLDivElement;
const tokenInput = document.getElementById("token-input") as HTMLInputElement;
const saveTokenBtn = document.getElementById("save-token") as HTMLButtonElement;
const tokenMsg = document.getElementById("token-msg") as HTMLDivElement;

function updateToggleLabel(active: boolean): void {
  toggleLabel.textContent = active ? "Bot attivo" : "Pausa";
}

chrome.runtime.sendMessage({ type: "GET_BOT_STATE" }, (response) => {
  if (chrome.runtime.lastError) return;
  botToggle.checked = response.botActive;
  updateToggleLabel(response.botActive);
  creatorNameEl.textContent = response.creatorId || "Non configurato";
  msgCountEl.textContent = String(response.messagesProcessed ?? 0);
});

chrome.storage.local.get(["aura_token"], (result) => {
  if (result.aura_token) {
    tokenSection.style.display = "none";
  }
});

botToggle.addEventListener("change", () => {
  chrome.runtime.sendMessage({ type: "TOGGLE_BOT" }, (response) => {
    if (chrome.runtime.lastError) return;
    updateToggleLabel(response.botActive);
  });
});

openSidebarLink.addEventListener("click", async (e) => {
  e.preventDefault();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
  window.close();
});

saveTokenBtn.addEventListener("click", () => {
  const token = tokenInput.value.trim();
  if (!token) {
    tokenMsg.textContent = "Inserisci un token valido";
    tokenMsg.style.color = "#ff4444";
    return;
  }
  chrome.storage.local.set({ aura_token: token }, () => {
    tokenMsg.textContent = "Token salvato!";
    tokenMsg.style.color = "#44ff44";
    setTimeout(() => {
      tokenSection.style.display = "none";
    }, 1500);
  });
});
