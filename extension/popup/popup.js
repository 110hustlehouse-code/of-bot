const API_URL = 'https://api.aurafullsuite.it';

document.addEventListener('DOMContentLoaded', async () => {
  const stored = await chrome.storage.local.get(['token', 'creatorId', 'creatorName', 'isRunning', 'auraStats']);

  if (stored.token) {
    showControls(stored.creatorName, stored.isRunning);
    updateStats(stored.auraStats);
  }

  document.getElementById('loginBtn').addEventListener('click', login);
  document.getElementById('toggleBtn').addEventListener('click', toggleBot);
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Poll stats every 3s while popup is open
  setInterval(async () => {
    const data = await chrome.storage.local.get(['auraStats']);
    updateStats(data.auraStats);
  }, 3000);
});

async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('loginBtn');

  if (!email || !password) return;

  btn.textContent = 'Connecting...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    const creatorsRes = await fetch(`${API_URL}/api/creators`, {
      headers: { 'Authorization': `Bearer ${data.token}` },
    });
    const creators = await creatorsRes.json();

    if (!creators || creators.length === 0) {
      throw new Error('No creators found. Add one in the dashboard first.');
    }

    await chrome.storage.local.set({
      token: data.token,
      creatorId: creators[0].id,
      creatorName: creators[0].name,
      isRunning: false,
    });

    showControls(creators[0].name, false);
  } catch (err) {
    showError(err.message);
  } finally {
    btn.textContent = 'Connect';
    btn.disabled = false;
  }
}

function showControls(name, isRunning) {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('controls').style.display = 'block';
  document.getElementById('errorMsg').style.display = 'none';
  document.getElementById('creatorName').textContent = name || 'Unknown';
  updateToggleUI(isRunning);
}

function updateToggleUI(isRunning) {
  document.getElementById('statusDot').className = `dot ${isRunning ? 'on' : 'off'}`;
  document.getElementById('statusText').textContent = isRunning ? 'Active' : 'Paused';
  const btn = document.getElementById('toggleBtn');
  btn.textContent = isRunning ? 'Pause Aura' : 'Start Aura';
  btn.className = isRunning ? 'secondary' : '';
}

function updateStats(stats) {
  const el = document.getElementById('statsLine');
  if (!el || !stats) return;
  const parts = [];
  parts.push(`${stats.processed || 0} msgs`);
  if (stats.errors > 0) parts.push(`${stats.errors} errors`);
  if (stats.lastActivity) {
    const ago = Math.round((Date.now() - new Date(stats.lastActivity).getTime()) / 60000);
    parts.push(ago < 1 ? 'just now' : `${ago}m ago`);
  }
  el.textContent = parts.join(' · ');
}

async function toggleBot() {
  const stored = await chrome.storage.local.get(['isRunning', 'creatorName']);
  const newState = !stored.isRunning;
  await chrome.storage.local.set({ isRunning: newState });
  updateToggleUI(newState);

  // Notify content script
  const tabs = await chrome.tabs.query({ url: 'https://onlyfans.com/*' });
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_AURA', isRunning: newState });
  }
}

async function logout() {
  await chrome.storage.local.clear();
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('controls').style.display = 'none';
  document.getElementById('statusDot').className = 'dot off';
  document.getElementById('statusText').textContent = 'Not connected';
  document.getElementById('statsLine').textContent = '';
}

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}