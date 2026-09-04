'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Save, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [telegramChatId, setTelegramChatId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/api/settings').then((r) => {
      setTelegramChatId(r.data.telegramChatId ?? '');
    });
  }, []);

  async function save() {
    setLoading(true);
    try {
      await api.put('/api/settings', { telegramChatId: telegramChatId || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Failed to save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-white text-4xl font-medium tracking-tight">Settings</h1>
        <p className="text-[#86868B] text-[14px] mt-2">Configure your workspace</p>
      </div>

      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-6 max-w-xl">
        <h3 className="text-white text-[15px] font-medium mb-1">Telegram Notifications</h3>
        <p className="text-[#48484A] text-[12px] mb-5">
          Receive alerts for compliance blocks, whale activity, and human handoff requests.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-[#86868B] text-[11px] tracking-wide block mb-1.5">Telegram Chat ID</label>
            <input
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="e.g. -1001234567890"
              className="w-full bg-[#141414] text-white text-[14px] rounded-xl px-4 py-3 border border-[#1F1F1F] focus:border-[#C9A961] focus:outline-none transition-all placeholder:text-[#48484A]"
            />
            <p className="text-[#48484A] text-[11px] mt-2">
              Send /start to @useAuraBot on Telegram, then paste the chat ID here.
            </p>
          </div>

          <button
            onClick={save}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-b from-[#C9A961] to-[#B08F4A] hover:from-[#D4B570] text-black text-[13px] font-medium px-4 py-2.5 rounded-xl transition-all disabled:opacity-40"
          >
            {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {loading ? 'Saving...' : saved ? 'Saved' : 'Save settings'}
          </button>
        </div>
      </div>
    </div>
  );
}