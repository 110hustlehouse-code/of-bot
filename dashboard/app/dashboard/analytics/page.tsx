'use client';
import { useEffect, useState } from 'react';
import { api, Creator } from '@/lib/api';

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

  const metrics = analytics ? [
    { label: 'Fan Totali', value: analytics.fanStats.totalFans, suffix: '' },
    { label: 'Revenue Totale', value: `€${analytics.fanStats.totalRevenue.toFixed(0)}`, suffix: '' },
    { label: 'Revenue 30gg', value: `€${analytics.fanStats.revenue30d.toFixed(0)}`, suffix: '' },
    { label: 'Spesa Media Fan', value: `€${analytics.fanStats.avgSpend.toFixed(2)}`, suffix: '' },
    { label: 'Messaggi AI', value: analytics.msgStats.aiMessages, suffix: `/ ${analytics.msgStats.totalMessages} totali` },
    { label: 'Automazione', value: `${analytics.msgStats.aiPercentage}%`, suffix: 'messaggi gestiti dal bot' },
    { label: 'PPV Inviati', value: analytics.ppvStats.totalSent, suffix: '' },
    { label: 'PPV Conversion', value: `${(analytics.ppvStats.conversionRate * 100).toFixed(1)}%`, suffix: '' },
    { label: 'Vendite AI', value: analytics.ppvStats.aiGenerated, suffix: `(${analytics.ppvStats.aiContribution}% del totale)` },
  ] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Analytics & Revenue</h2>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 text-sm"
        >
          {creators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading && <p className="text-gray-500">Caricamento...</p>}

      {analytics && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {metrics.map(({ label, value, suffix }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-gray-400 text-sm mb-1">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
                {suffix && <p className="text-gray-500 text-xs mt-1">{suffix}</p>}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">Fan per Tier</h3>
              {analytics.tierBreakdown.map((t) => (
                <div key={t.tier} className="flex justify-between py-2 border-b border-gray-800 last:border-0">
                  <span className={`text-sm capitalize ${
                    t.tier === 'whale' ? 'text-yellow-400' :
                    t.tier === 'hot' ? 'text-red-400' :
                    t.tier === 'warm' ? 'text-orange-400' : 'text-gray-400'
                  }`}>{t.tier}</span>
                  <div className="text-right">
                    <span className="text-white text-sm">{t.count} fan</span>
                    <span className="text-gray-500 text-xs ml-2">€{Number(t.revenue ?? 0).toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">ROI del Bot</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Vendite generate dall'AI</span>
                  <span className="text-green-400 font-bold">{analytics.ppvStats.aiGenerated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Contributo AI sul totale</span>
                  <span className="text-green-400 font-bold">{analytics.ppvStats.aiContribution}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Messaggi automatizzati</span>
                  <span className="text-purple-400 font-bold">{analytics.msgStats.aiPercentage}%</span>
                </div>
                <div className="mt-4 p-3 bg-green-900/20 border border-green-800 rounded-lg">
                  <p className="text-green-400 text-sm font-medium">
                    Il bot gestisce {analytics.msgStats.aiPercentage}% delle conversazioni
                    e genera {analytics.ppvStats.aiContribution}% delle vendite PPV.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}