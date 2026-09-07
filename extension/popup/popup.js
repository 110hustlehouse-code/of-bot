const API_URL = 'https://api.aurafullsuite.it';

document.addEventListener('DOMContentLoaded', async () => {
  const stored = await chrome.storage.local.get(['token', 'creatorId', 'creatorName', 'isRunning']);

  if (stored.token) {
    showControls(stored.creatorName, stored.isRunning);
  }

  document.getElementById('loginBtn').addEventListener('click', login);
  document.getElementById('toggleBtn').addEventListener('click', toggleBot);
  document.getElementById('logoutBtn').addEventListener('click', logout);
});

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Carica creators
    const creatorsRes = await fetch(`${API_URL}/api/creators`, {
      headers: { 'Authorization': `Bearer ${data.token}` },
    });
    const creators = await creatorsRes.json();

    if (creators.length === 0) {
      alert('No creators found. Add one in the dashboard first.');
      return;
    }

    await chrome.storage.local.set({
      token: data.token,
      creatorId: creators[0].id,
      creatorName: creators[0].name,
      isRunning: false,
    });

    showControls(creators[0].name, false);
  } catch (err) {
    alert('Login failed: ' + err.message);
  }
}

function showControls(name, isRunning) {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('controls').style.display = 'block';
  document.getElementById('creatorName').textContent = name;
  document.getElementById('statusDot').className = `dot ${isRunning ? 'on' : 'off'}`;
  document.getElementById('statusText').textContent = isRunning ? 'Active' : 'Paused';
  document.getElementById('toggleBtn').textContent = isRunning ? 'Pause Aura' : 'Start Aura';
}

async function toggleBot() {
  const stored = await chrome.storage.local.get(['isRunning']);
  const newState = !stored.isRunning;
  await chrome.storage.local.set({ isRunning: newState });

  const stored2 = await chrome.storage.local.get(['creatorName']);
  showControls(stored2.creatorName, newState);

  // Notifica content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_AURA', isRunning: newState });
}

async function logout() {
  await chrome.storage.local.clear();
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('controls').style.display = 'none';
  document.getElementById('statusDot').className = 'dot off';
  document.getElementById('statusText').textContent = 'Not connected';
}