// === Aura Sidebar Panel ===
// Injected into OnlyFans pages — shows chat list, heat scores, takeover toggles

(function () {
  if (document.getElementById('aura-sidebar')) return;

  // === STYLES ===
  const style = document.createElement('style');
  style.textContent = `
    #aura-sidebar {
      position: fixed;
      top: 0;
      right: 0;
      width: 300px;
      height: 100vh;
      background: #0A0A0A;
      border-left: 1px solid #1F1F1F;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      color: #fff;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      font-size: 13px;
    }
    #aura-sidebar.open { transform: translateX(0); }
    #aura-sidebar * { box-sizing: border-box; }

    #aura-toggle-btn {
      position: fixed;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 999998;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #E8C577, #8B7439);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      transition: right 0.3s ease;
    }
    #aura-toggle-btn.shifted { right: 312px; }
    #aura-toggle-btn:hover { opacity: 0.9; }
    #aura-toggle-btn::after {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #000;
    }

    .aura-header {
      padding: 16px;
      border-bottom: 1px solid #1F1F1F;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .aura-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .aura-logo {
      width: 22px; height: 22px; border-radius: 50%;
      background: linear-gradient(135deg, #E8C577, #8B7439);
      display: flex; align-items: center; justify-content: center;
    }
    .aura-logo::after {
      content: '';
      width: 4px; height: 4px; border-radius: 50%; background: #000;
    }
    .aura-title { font-weight: 600; font-size: 14px; }
    .aura-status-badge {
      padding: 3px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
    }
    .aura-status-badge.on { background: #0A2A10; color: #30D158; }
    .aura-status-badge.off { background: #2A0A0A; color: #FF453A; }

    .aura-stats-bar {
      padding: 10px 16px;
      background: #111;
      border-bottom: 1px solid #1F1F1F;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #86868B;
    }
    .aura-stat-val { color: #C9A961; font-weight: 600; }

    .aura-search {
      padding: 10px 16px;
      border-bottom: 1px solid #1F1F1F;
    }
    .aura-search input {
      width: 100%;
      background: #141414;
      border: 1px solid #1F1F1F;
      border-radius: 8px;
      padding: 7px 10px;
      color: #fff;
      font-size: 12px;
      outline: none;
    }
    .aura-search input:focus { border-color: #C9A961; }
    .aura-search input::placeholder { color: #48484A; }

    .aura-chat-list {
      flex: 1;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #333 transparent;
    }
    .aura-chat-list::-webkit-scrollbar { width: 4px; }
    .aura-chat-list::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }

    .aura-chat-item {
      padding: 12px 16px;
      border-bottom: 1px solid #1A1A1A;
      cursor: pointer;
      transition: background 0.15s;
    }
    .aura-chat-item:hover { background: #141414; }
    .aura-chat-item.unread { border-left: 3px solid #C9A961; }

    .aura-chat-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .aura-fan-name { font-weight: 600; font-size: 13px; }
    .aura-heat {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 6px;
      min-width: 28px;
      text-align: center;
    }
    .aura-heat.cold { background: #1A1A2E; color: #5B7FFF; }
    .aura-heat.warm { background: #2E2A1A; color: #FFB84D; }
    .aura-heat.hot { background: #2E1A1A; color: #FF5B5B; }

    .aura-chat-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: #86868B;
    }
    .aura-last-msg {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 160px;
    }
    .aura-takeover-btn {
      background: none;
      border: 1px solid #333;
      color: #86868B;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .aura-takeover-btn:hover { border-color: #C9A961; color: #C9A961; }
    .aura-takeover-btn.active { background: #FF453A; border-color: #FF453A; color: #fff; }

    .aura-empty {
      padding: 40px 20px;
      text-align: center;
      color: #48484A;
      font-size: 12px;
    }

    .aura-footer {
      padding: 10px 16px;
      border-top: 1px solid #1F1F1F;
      font-size: 10px;
      color: #48484A;
      text-align: center;
    }
  `;
  document.head.appendChild(style);

  // === TOGGLE BUTTON ===
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'aura-toggle-btn';
  toggleBtn.title = 'Aura Panel';
  document.body.appendChild(toggleBtn);

  // === SIDEBAR HTML ===
  const sidebar = document.createElement('div');
  sidebar.id = 'aura-sidebar';
  sidebar.innerHTML = `
    <div class="aura-header">
      <div class="aura-header-left">
        <div class="aura-logo"></div>
        <span class="aura-title">Aura</span>
      </div>
      <span class="aura-status-badge off" id="aura-badge">OFF</span>
    </div>
    <div class="aura-stats-bar">
      <span>Msgs: <span class="aura-stat-val" id="aura-s-msgs">0</span></span>
      <span>Errors: <span class="aura-stat-val" id="aura-s-errs">0</span></span>
      <span>Phase: <span class="aura-stat-val" id="aura-s-phase">-</span></span>
    </div>
    <div class="aura-search">
      <input type="text" id="aura-search-input" placeholder="Search fans..." />
    </div>
    <div class="aura-chat-list" id="aura-chat-list">
      <div class="aura-empty">No chats detected yet.<br>Open a conversation on OF.</div>
    </div>
    <div class="aura-footer">Aura v1.0 · Sidebar Panel</div>
  `;
  document.body.appendChild(sidebar);

  // === STATE ===
  let sidebarOpen = false;
  const chatData = new Map(); // fanId -> { name, lastMsg, heat, phase, unread, takeover }

  // Toggle sidebar
  toggleBtn.addEventListener('click', () => {
    sidebarOpen = !sidebarOpen;
    sidebar.classList.toggle('open', sidebarOpen);
    toggleBtn.classList.toggle('shifted', sidebarOpen);
  });

  // Search filter
  document.getElementById('aura-search-input').addEventListener('input', (e) => {
    renderChatList(e.target.value.toLowerCase());
  });

  // === RENDER ===
  function renderChatList(filter) {
    const list = document.getElementById('aura-chat-list');
    const entries = [...chatData.entries()];

    const filtered = filter
      ? entries.filter(([, d]) => d.name.toLowerCase().includes(filter))
      : entries;

    // Sort: unread first, then by heat desc
    filtered.sort((a, b) => {
      if (a[1].unread !== b[1].unread) return b[1].unread ? 1 : -1;
      return (b[1].heat || 0) - (a[1].heat || 0);
    });

    if (filtered.length === 0) {
      list.innerHTML = '<div class="aura-empty">No chats detected yet.<br>Open a conversation on OF.</div>';
      return;
    }

    list.innerHTML = filtered.map(([fanId, d]) => {
      const heatClass = (d.heat || 0) >= 70 ? 'hot' : (d.heat || 0) >= 40 ? 'warm' : 'cold';
      return `
        <div class="aura-chat-item ${d.unread ? 'unread' : ''}" data-fan-id="${fanId}">
          <div class="aura-chat-row">
            <span class="aura-fan-name">${escHtml(d.name)}</span>
            <span class="aura-heat ${heatClass}">${d.heat || 0}</span>
          </div>
          <div class="aura-chat-meta">
            <span class="aura-last-msg">${escHtml(d.lastMsg || '...')}</span>
            <button class="aura-takeover-btn ${d.takeover ? 'active' : ''}" data-fan="${fanId}">
              ${d.takeover ? 'HUMAN' : 'BOT'}
            </button>
          </div>
        </div>`;
    }).join('');

    // Takeover toggle handlers
    list.querySelectorAll('.aura-takeover-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fid = btn.dataset.fan;
        const fan = chatData.get(fid);
        if (!fan) return;
        fan.takeover = !fan.takeover;
        chrome.runtime.sendMessage({
          type: fan.takeover ? 'ACTIVATE_TAKEOVER' : 'DEACTIVATE_TAKEOVER',
          fanId: fid,
        });
        renderChatList(document.getElementById('aura-search-input').value.toLowerCase());
      });
    });

    // Click chat to navigate
    list.querySelectorAll('.aura-chat-item').forEach(item => {
      item.addEventListener('click', () => {
        const fid = item.dataset.fanId;
        const chatEl = document.querySelector(`[data-user-id="${fid}"], a[href*="/${fid}"]`);
        if (chatEl) chatEl.click();
      });
    });
  }

  // === STATUS UPDATES ===
  function updateBadge(active) {
    const badge = document.getElementById('aura-badge');
    badge.textContent = active ? 'ON' : 'OFF';
    badge.className = `aura-status-badge ${active ? 'on' : 'off'}`;
  }

  function updateSidebarStats(s) {
    document.getElementById('aura-s-msgs').textContent = s.processed || 0;
    document.getElementById('aura-s-errs').textContent = s.errors || 0;
  }

  // Listen for messages from content.js / background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'BOT_STATE') updateBadge(msg.active);
    if (msg.type === 'MSG_PROCESSED' && msg.stats) updateSidebarStats(msg.stats);
  });

  // === SCAN DOM FOR CHATS ===
  function scanChats() {
    const items = document.querySelectorAll('.b-chats__item, [class*="chat-list"] [class*="item"]');
    items.forEach(item => {
      const userId = item.getAttribute('data-user-id') ||
        item.querySelector('a')?.href?.match(/\/(\d+)\/?$/)?.[1];
      if (!userId) return;

      const name = item.querySelector('.b-chats__item__name, [class*="name"]')?.textContent?.trim() || `Fan ${userId}`;
      const lastMsg = item.querySelector('.b-chats__item__text, [class*="text"], [class*="preview"]')?.textContent?.trim() || '';
      const isUnread = item.matches('.b-chats__item--unread, [class*="unread"]');

      const existing = chatData.get(userId) || {};
      chatData.set(userId, {
        name: name,
        lastMsg: lastMsg || existing.lastMsg || '',
        heat: existing.heat || 0,
        phase: existing.phase || '-',
        unread: isUnread,
        takeover: existing.takeover || false,
      });
    });
    renderChatList(document.getElementById('aura-search-input')?.value?.toLowerCase() || '');
  }

  // Expose function so content.js can update heat/phase after API response
  window.__auraUpdateFan = function (fanId, data) {
    const existing = chatData.get(fanId) || { name: `Fan ${fanId}`, lastMsg: '', unread: false, takeover: false };
    chatData.set(fanId, { ...existing, ...data });
    renderChatList(document.getElementById('aura-search-input')?.value?.toLowerCase() || '');
  };

  // Poll DOM for chat list changes
  setInterval(scanChats, 5000);
  scanChats();

  // Init status
  chrome.storage.local.get(['isRunning', 'auraStats'], (data) => {
    updateBadge(data.isRunning || false);
    if (data.auraStats) updateSidebarStats(data.auraStats);
  });

  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
})();