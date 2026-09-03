'use client';
import { useEffect, useState } from 'react';
import { api, Creator } from '@/lib/api';

export default function OverviewPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/creators').then((r) => {
      setCreators(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const active = creators.filter((c) => c.isActive).length;

  return (
    <div>
      {/* Hero */}
      <div className="mb-12">
        <p className="text-[#48484A] text-[12px] tracking-wide mb-3">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-white text-4xl font-medium tracking-tight">Good evening.</h1>
        <p className="text-[#86868B] text-[15px] mt-2">
          {active} of {creators.length} creators active · All systems operational
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-4 gap-3 mb-10">
        <Kpi label="Creators" value={loading ? '—' : creators.length.toString()} sub="total" />
        <Kpi label="Active" value={loading ? '—' : active.toString()} sub="running now" accent />
        <Kpi label="Uptime" value="99.98%" sub="last 30 days" />
        <Kpi label="Response time" value="1.2s" sub="average" />
      </div>

      {/* Active creators */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1F1F1F]">
          <h2 className="text-white text-[15px] font-medium">Active workspaces</h2>
          <span className="text-[#48484A] text-[12px]">Live</span>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-[#48484A] text-[13px]">Loading</div>
        ) : creators.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-[#86868B] text-[14px] mb-1">No creators yet</p>
            <p className="text-[#48484A] text-[12px]">Add your first creator to start</p>
          </div>
        ) : (
          <div>
            {creators.map((c, i) => (
              <div 
                key={c.id} 
                className={`flex items-center justify-between px-6 py-4 hover:bg-[#141414]/40 transition-colors ${i !== creators.length - 1 ? 'border-b border-[#1F1F1F]' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] border border-[#2C2C2E] flex items-center justify-center text-[#C9A961] text-[13px] font-medium">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-[14px] font-medium">{c.name}</p>
                    <p className="text-[#48484A] text-[12px]">@{c.ofUsername}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-[#30D158] aura-live' : 'bg-[#48484A]'}`} />
                  <span className={`text-[12px] ${c.isActive ? 'text-[#30D158]' : 'text-[#48484A]'}`}>
                    {c.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-5">
      <p className="text-[#48484A] text-[11px] tracking-wide mb-3">{label}</p>
      <p className={`text-3xl font-medium tracking-tight ${accent ? 'text-[#C9A961]' : 'text-white'}`}>
        {value}
      </p>
      <p className="text-[#48484A] text-[11px] mt-2">{sub}</p>
    </div>
  );
}