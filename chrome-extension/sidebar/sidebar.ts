const creatorInput = document.getElementById("creator-input") as HTMLInputElement;
const setCreatorBtn = document.getElementById("set-creator") as HTMLButtonElement;
const chatListEl = document.getElementById("chat-list") as HTMLDivElement;
const statMessages = document.getElementById("stat-messages") as HTMLDivElement;
const statConversions = document.getElementById("stat-conversions") as HTMLDivElement;
const statRevenue = document.getElementById("stat-revenue") as HTMLDivElement;

interface FanStats {
  heatScore: number;
  phase: string;
  lastMessage: number;
  username: string;
}

let currentCreatorId = "";

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function heatClass(score: number): string {
  if (score >= 70) return "heat-high";
  if (score >= 40) return "heat-mid";
  return "heat-low";
}

function renderChats(chats: Record<string, FanStats>): void {
  const entries = Object.entries(chats).sort(
    ([, a], [, b]) => b.lastMessage - a.lastMessage
  );

  if (entries.length === 0) {
    chatListEl.innerHTML = '<div class="empty-state">Nessuna chat attiva</div>';
    return;
  }

  chatListEl.innerHTML = entries
    .map(
      ([fanId, stats]) => `
    <div class="chat-item" data-fan-id="${escapeHtml(fanId)}">
      <div class="chat-header">
        <span class="chat-fan-id">${escapeHtml(stats.username || fanId)}</span>
        <span class="heat-score ${heatClass(stats.heatScore)}">${stats.heatScore}</span>
      </div>
      <div class="chat-meta">
        <span>Fase: ${escapeHtml(stats.phase)}</span>
      </div>
      <div class="takeover-toggle">
        <input type="checkbox" id="takeover-${escapeHtml(fanId)}" data-fan-id="${escapeHtml(fanId)}" class="takeover-cb" />
        <label for="takeover-${escapeHtml(fanId)}">Human Takeover</label>
      </div>
    </div>
  `
    )
    .join("");

  document.querySelectorAll<HTMLInputElement>(".takeover-cb").forEach((cb) => {
    chrome.storage.local.get([`takeover_${cb.dataset.fanId}`], (result) => {
      cb.checked = result[`takeover_${cb.dataset.fanId}`] === true;
    });

    cb.addEventListener("change", () => {
      const fanId = cb.dataset.fanId!;
      const type = cb.checked ? "ACTIVATE_TAKEOVER" : "DEACTIVATE_TAKEOVER";
      chrome.runtime.sendMessage({
        type,
        fanId,
        creatorId: currentCreatorId,
      });
    });
  });
}

function updateStats(): void {
  chrome.runtime.sendMessage(
    { type: "GET_STATS", creatorId: currentCreatorId },
    (response) => {
      if (chrome.runtime.lastError || !response) return;
      statMessages.textContent = String(response.messagesProcessed ?? 0);
      statConversions.textContent = String(response.conversions ?? 0);
      statRevenue.textContent = `$${response.revenue ?? 0}`;
    }
  );
}

function refreshData(): void {
  chrome.runtime.sendMessage({ type: "GET_ACTIVE_CHATS" }, (response) => {
    if (chrome.runtime.lastError || !response) return;
    renderChats(response.chats ?? {});
  });
  updateStats();
}

chrome.storage.local.get(["creatorId"], (result) => {
  currentCreatorId = (result.creatorId as string) || "";
  if (currentCreatorId) {
    creatorInput.value = currentCreatorId;
  }
});

setCreatorBtn.addEventListener("click", () => {
  const id = creatorInput.value.trim();
  if (!id) return;
  currentCreatorId = id;
  chrome.runtime.sendMessage({ type: "SET_CREATOR_ID", creatorId: id });
  refreshData();
});

refreshData();
setInterval(refreshData, 5000);
