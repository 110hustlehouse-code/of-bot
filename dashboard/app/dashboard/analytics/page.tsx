'use client';
import { useEffect, useState } from 'react';
import { api, Creator, Analytics } from '@/lib/api';

export default function AnalyticsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    api.get('/api/creators').then((r) => {
      setCreators(r.data);
      if (r.data.length > 0) setSelected(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.get(`/api/analytics/creator/${selected}`).then((r) => setAnalytics(r.data));
  }, [selected]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Analytics</h2>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 text-sm"
        >
          {creators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {analytics && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Fan Totali', value: analytics.fanStats.totalFans },
            { label: 'Revenue Totale', value: `€${analytics.fanStats.totalRevenue ?? 0}` },
            { label: 'Spesa Media Fan', value: `€${Number(analytics.fanStats.avgSpend ?? 0).toFixed(2)}` },
            { label: 'Messaggi Totali', value: analytics.msgStats.totalMessages },
            { label: 'PPV Inviati', value: analytics.ppvStats.totalSent },
            { label: 'PPV Conversion', value: `${(analytics.ppvStats.conversionRate * 100).toFixed(1)}%` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-2">{label}</p>
              <p className="text-3xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}