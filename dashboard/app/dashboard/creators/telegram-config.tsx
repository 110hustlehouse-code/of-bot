'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Bot, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  creatorId: string;
  creatorName: string;
}

export default function TelegramConfig({ creatorId, creatorName }: Props) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  async function save() {
    if (!token.trim()) return;
    setLoading(true);
    try {
      await api.put(`/api/creators/${creatorId}/telegram`, { telegramBotToken: token });
      setStatus('ok');
      setToken('');
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-[#1F1F1F]">
      <p className="text-[#86868B] text-[11px] tracking-wide flex items-center gap-2 mb-3">
        <Bot size={11} /> Telegram Bot
      </p>

      {status === 'ok' ? (
        <div className="flex items-center gap-2 text-[#30D158] text-[12px]">
          <CheckCircle2 size={13} /> Bot connected
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste bot token from @BotFather"
            className="flex-1 bg-[#141414] text-white text-[11px] font-mono rounded-lg px-3 py-2 border border-[#1F1F1F] focus:border-[#C9A961] focus:outline-none placeholder:text-[#48484A]"
          />
          <button
            onClick={save}
            disabled={loading || !token.trim()}
            className="bg-[#141414] hover:bg-[#1C1C1E] text-white text-[12px] px-3 py-2 rounded-lg border border-[#1F1F1F] transition-all disabled:opacity-40"
          >
            {loading ? '...' : 'Connect'}
          </button>
        </div>
      )}
      {status === 'error' && (
        <p className="text-[#FF453A] text-[11px] mt-1 flex items-center gap-1"><AlertCircle size={11} /> Invalid token</p>
      )}
    </div>
  );
}