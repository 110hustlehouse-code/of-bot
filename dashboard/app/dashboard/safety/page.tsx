'use client';
import { useEffect, useState } from 'react';
import { api, Creator } from '@/lib/api';
import { ShieldOff, ShieldCheck } from 'lucide-react';

export default function SafetyPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    api.get('/api/creators').then((r) => {
      setCreators(r.data);
      if (r.data.length > 0) setSelected(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.get(`/api/safety/audit/${selected}`).then((r) => setLogs(r.data));
  }, [selected]);

  async function kill(id: string) {
    await api.post(`/api/safety/kill/${id}`, { reason: 'Manual kill' });
    api.get('/api/creators').then((r) => setCreators(r.data));
  }

  async function revive(id: string) {
    await api.post(`/api/safety/revive/${id}`);
    api.get('/api/creators').then((r) => setCreators(r.data));
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Safety & Compliance</h2>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {creators.map((c) => (
          <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{c.name}</p>
              <span className={`text-xs ${c.isActive ? 'text-green-400' : 'text-red-400'}`}>
                {c.isActive ? '● Attivo' : '● Killato'}
              </span>
            </div>
            {c.isActive ? (
              <button onClick={() => kill(c.id)} className="flex items-center gap-2 bg-red-900 hover:bg-red-800 text-red-300 px-3 py-1.5 rounded-lg text-sm transition">
                <ShieldOff size={14} /> Kill
              </button>
            ) : (
              <button onClick={() => revive(c.id)} className="flex items-center gap-2 bg-green-900 hover:bg-green-800 text-green-300 px-3 py-1.5 rounded-lg text-sm transition">
                <ShieldCheck size={14} /> Riattiva
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Audit Log</h3>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="bg-gray-800 text-white rounded-lg px-3 py-1.5 border border-gray-700 text-sm"
          >
            {creators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-2 max-h-96 overflow-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm">Nessun log.</p>
          ) : logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-800 last:border-0">
              <span className={`text-xs px-2 py-0.5 rounded mt-0.5 ${log.action === 'msg_blocked' ? 'bg-red-900 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
                {log.action}
              </span>
              <div>
                <p className="text-gray-300 text-sm">{log.details?.reason ?? log.details?.textPreview ?? '-'}</p>
                <p className="text-gray-600 text-xs">{new Date(log.timestamp).toLocaleString('it-IT')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}