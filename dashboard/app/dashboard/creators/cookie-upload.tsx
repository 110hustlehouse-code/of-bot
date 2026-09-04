'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Cookie, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  creatorId: string;
  creatorName: string;
}

export default function CookieUpload({ creatorId, creatorName }: Props) {
  const [cookiesJson, setCookiesJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function upload() {
    if (!cookiesJson.trim()) return;
    setLoading(true);
    try {
      await api.post(`/api/cookies/${creatorId}`, { cookiesJson });
      setStatus('ok');
      setMessage('Session active');
      setCookiesJson('');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.response?.data?.error ?? 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function check() {
    setLoading(true);
    try {
      const r = await api.get(`/api/cookies/${creatorId}/check`);
      setStatus(r.data.valid ? 'ok' : 'error');
      setMessage(r.data.message);
    } catch {
      setStatus('error');
      setMessage('Check failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-[#1F1F1F]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[#86868B] text-[11px] tracking-wide flex items-center gap-2">
          <Cookie size={11} /> OF Session
        </p>
        <button
          onClick={check}
          disabled={loading}
          className="text-[#48484A] hover:text-white text-[11px] transition-colors"
        >
          Check status
        </button>
      </div>

      {status === 'ok' && (
        <div className="flex items-center gap-2 text-[#30D158] text-[12px] mb-3">
          <CheckCircle2 size={13} /> {message}
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 text-[#FF453A] text-[12px] mb-3">
          <AlertCircle size={13} /> {message}
        </div>
      )}

      <div className="space-y-2">
        <textarea
          value={cookiesJson}
          onChange={(e) => setCookiesJson(e.target.value)}
          rows={3}
          className="w-full bg-[#141414] text-white text-[11px] font-mono rounded-lg px-3 py-2 border border-[#1F1F1F] focus:border-[#C9A961] focus:outline-none resize-none placeholder:text-[#48484A]"
          placeholder="Paste cookies JSON from browser"
        />
        <button
          onClick={upload}
          disabled={loading || !cookiesJson.trim()}
          className="flex items-center gap-2 bg-[#141414] hover:bg-[#1C1C1E] text-white text-[12px] px-3 py-2 rounded-lg border border-[#1F1F1F] transition-all disabled:opacity-40"
        >
          <Cookie size={12} /> {loading ? 'Validating...' : 'Upload session'}
        </button>
      </div>
    </div>
  );
}