'use client';
import { useEffect, useState } from 'react';
import { api, Creator } from '@/lib/api';
import { ShieldOff, ShieldCheck, ChevronDown, AlertCircle } from 'lucide-react';

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
      <div className="mb-10">
        <h1 className="text-white text-4xl font-medium tracking-tight">Safety</h1>
        <p className="text-[#86868B] text-[14px] mt-2">
          Compliance shield status and kill switches
        </p>
      </div>

      {/* Kill switches */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white text-[13px] font-medium">Workspace controls</p>
          <span className="text-[#48484A] text-[11px]">{creators.filter(c => c.isActive).length} active</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {creators.map((c) => (
            <div key={c.id} className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-5 flex items-center justify-between hover:border-[#2C2C2E] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] border border-[#2C2C2E] flex items-center justify-center text-[#C9A961] text-[13px] font-medium">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-[14px] font-medium">{c.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-[#30D158] aura-live' : 'bg-[#FF453A]'}`} />
                    <span className={`text-[11px] ${c.isActive ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>
                      {c.isActive ? 'Protected' : 'Killed'}
                    </span>
                  </div>
                </div>
              </div>
              {c.isActive ? (
                <button 
                  onClick={() => kill(c.id)} 
                  className="flex items-center gap-1.5 bg-[#FF453A]/10 hover:bg-[#FF453A]/20 text-[#FF453A] text-[12px] px-3 py-2 rounded-lg border border-[#FF453A]/20 transition-all"
                >
                  <ShieldOff size={12} /> Kill
                </button>
              ) : (
                <button 
                  onClick={() => revive(c.id)} 
                  className="flex items-center gap-1.5 bg-[#30D158]/10 hover:bg-[#30D158]/20 text-[#30D158] text-[12px] px-3 py-2 rounded-lg border border-[#30D158]/20 transition-all"
                >
                  <ShieldCheck size={12} /> Revive
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Audit log */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl overflow-hidden mt-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F1F1F]">
          <div>
            <p className="text-white text-[14px] font-medium">Audit log</p>
            <p className="text-[#48484A] text-[11px] mt-0.5">Every action, every block, every recovery</p>
          </div>
          <div className="relative">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="appearance-none bg-[#141414] hover:bg-[#1C1C1E] text-white text-[12px] rounded-lg pl-3 pr-8 py-2 border border-[#1F1F1F] focus:border-[#C9A961] focus:outline-none transition-all cursor-pointer"
            >
              {creators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#48484A] pointer-events-none" />
          </div>
        </div>

        <div className="max-h-[500px] overflow-auto">
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[#86868B] text-[13px]">No events yet</p>
              <p className="text-[#48484A] text-[11px] mt-1">Aura will log every action here</p>
            </div>
          ) : (
            logs.map((log, i) => (
              <div 
                key={log.id} 
                className={`flex items-start gap-3 px-6 py-3.5 hover:bg-[#141414]/40 transition-colors ${i !== logs.length - 1 ? 'border-b border-[#1F1F1F]' : ''}`}
              >
                <ActionBadge action={log.action} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[13px] truncate">
                    {log.details?.reason ?? log.details?.textPreview ?? '—'}
                  </p>
                  <p className="text-[#48484A] text-[11px] mt-0.5">
                    {new Date(log.timestamp).toLocaleString('en-US')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    msg_blocked: 'bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/20',
    msg_sent: 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20',
    kill_switch: 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/20',
  };
  const style = styles[action] ?? 'bg-[#141414] text-[#86868B] border-[#1F1F1F]';
  return (
    <span className={`text-[10px] px-2 py-1 rounded-md border tracking-wide font-medium ${style} whitespace-nowrap mt-0.5`}>
      {action.replace('_', ' ')}
    </span>
  );
}