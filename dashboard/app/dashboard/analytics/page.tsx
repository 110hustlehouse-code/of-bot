'use client';
import { useEffect, useState } from 'react';
import { api, Creator } from '@/lib/api';
import { ChevronDown } from 'lucide-react';

interface Analytics {
  fanStats: { totalFans: number; totalRevenue: number; avgSpend: number; revenue30d: number };
  tierBreakdown: { tier: string; count: number; revenue: number }[];
  msgStats: { totalMessages: number; aiMessages: number; aiPercentage: string };
  ppvStats: { totalSent: number; totalPurchased: number; conversionRate: number; aiGenerated: number; aiContribution: string };
  churnBreakdown: { tier: string; count: number }[];
}

export default function AnalyticsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/creators').then((r) => {
      setCreators(r.data);
      if (r.data.length > 0) setSelected(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api.get(`/api/analytics/creator/${selected}`)
      .then((r) => setAnalytics(r.data))
      .finally(() => setLoading(false));
  }, [selected]);

  const selectedCreator = creators.find(c => c.id === selected);

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-white text-4xl font-medium tracking-tight">Analytics</h1>
          <p className="text-[#86868B] text-[14px] mt-2">
            Revenue attribution and performance signals
          </p>
        </div>
        <div className="relative">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="appearance-none bg-[#141414] hover:bg-[#1C1C1E] text-white text-[13px] rounded-xl pl-4 pr-10 py-2.5 border border-[#1F1F1F] focus:border-[#C9A961] focus:outline-none transition-all cursor-pointer"
          >
            {creators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#48484A] pointer-events-none" />
        </div>
      </div>

      {loading && (
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-16 text-center text-[#48484A] text-[13px]">
          Loading
        </div>
      )}

      {!loading && !analytics && (
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-16 text-center">
          <p className="text-[#86868B] text-[14px]">Select a creator to see analytics</p>
        </div>
      )}

      {analytics && (
        <>
          {/* Revenue hero */}
          <div className="bg-gradient-to-br from-[#0A0A0A] to-[#141414] border border-[#1F1F1F] rounded-2xl p-8 mb-3">
            <p className="text-[#48484A] text-[11px] tracking-wide mb-3">Total revenue generated</p>
            <div className="flex items-baseline gap-3">
              <p className="text-white text-6xl font-medium tracking-tight">
                €{analytics.fanStats.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-[#C9A961] text-[15px]">
                +€{analytics.fanStats.revenue30d.toFixed(0)} <span className="text-[#48484A] text-[13px]">last 30 days</span>
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-[#1F1F1F] flex items-center gap-8">
              <MicroStat label="Fans" value={analytics.fanStats.totalFans.toString()} />
              <div className="w-px h-8 bg-[#1F1F1F]" />
              <MicroStat label="Avg spend" value={`€${analytics.fanStats.avgSpend.toFixed(0)}`} />
              <div className="w-px h-8 bg-[#1F1F1F]" />
              <MicroStat label="PPV conversion" value={`${(analytics.ppvStats.conversionRate * 100).toFixed(1)}%`} />
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <MetricCard label="Automation" value={`${analytics.msgStats.aiPercentage}%`} sub={`${analytics.msgStats.aiMessages} of ${analytics.msgStats.totalMessages} messages`} />
            <MetricCard label="AI-driven sales" value={analytics.ppvStats.aiGenerated.toString()} sub={`${analytics.ppvStats.aiContribution}% of all PPV revenue`} accent />
            <MetricCard label="PPV sent" value={analytics.ppvStats.totalSent.toString()} sub={`${analytics.ppvStats.totalPurchased} purchased`} />
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-2 gap-3">
            {/* Tier breakdown */}
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-white text-[14px] font-medium">Fan segments</p>
                <span className="text-[#48484A] text-[11px]">By tier</span>
              </div>
              <div className="space-y-3">
                {analytics.tierBreakdown.length === 0 && (
                  <p className="text-[#48484A] text-[13px]">No fans yet</p>
                )}
                {analytics.tierBreakdown.map((t) => (
                  <TierRow key={t.tier} tier={t.tier} count={t.count} revenue={Number(t.revenue ?? 0)} />
                ))}
              </div>
            </div>

            {/* ROI card */}
            <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#C9A961]/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[#C9A961] text-[14px] font-medium">Aura ROI</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C9A961] aura-live" />
                  <span className="text-[#C9A961] text-[11px]">Live</span>
                </div>
              </div>
              <div className="space-y-4">
                <RoiRow label="Messages handled" value={`${analytics.msgStats.aiPercentage}%`} />
                <RoiRow label="Revenue attributed to Aura" value={`${analytics.ppvStats.aiContribution}%`} />
                <RoiRow label="Sales generated" value={analytics.ppvStats.aiGenerated.toString()} />
              </div>
              <div className="mt-6 pt-5 border-t border-[#1F1F1F]">
                <p className="text-white text-[13px] leading-relaxed">
                  Aura handled <span className="text-[#C9A961] font-medium">{analytics.msgStats.aiPercentage}%</span> of conversations
                  and generated <span className="text-[#C9A961] font-medium">{analytics.ppvStats.aiContribution}%</span> of PPV revenue.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MicroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[#48484A] text-[11px] tracking-wide mb-1">{label}</p>
      <p className="text-white text-[18px] font-medium">{value}</p>
    </div>
  );
}

function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
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

function TierRow({ tier, count, revenue }: { tier: string; count: number; revenue: number }) {
  const colors: Record<string, string> = {
    whale: 'text-[#C9A961]',
    hot: 'text-[#FF453A]',
    warm: 'text-[#FF9F0A]',
    cold: 'text-[#48484A]',
  };
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2.5">
        <div className={`w-1.5 h-1.5 rounded-full ${
          tier === 'whale' ? 'bg-[#C9A961]' :
          tier === 'hot' ? 'bg-[#FF453A]' :
          tier === 'warm' ? 'bg-[#FF9F0A]' : 'bg-[#48484A]'
        }`} />
        <span className={`text-[13px] capitalize ${colors[tier] ?? 'text-[#86868B]'}`}>{tier}</span>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-white text-[13px]">{count}</span>
        <span className="text-[#48484A] text-[12px]">€{revenue.toFixed(0)}</span>
      </div>
    </div>
  );
}

function RoiRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#86868B] text-[13px]">{label}</span>
      <span className="text-white text-[14px] font-medium">{value}</span>
    </div>
  );
}