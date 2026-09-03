'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Creator } from '@/lib/api';
import { Users, Bot, TrendingUp, AlertTriangle } from 'lucide-react';

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
      <h2 className="text-2xl font-bold text-white mb-6">Overview</h2>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Creator Totali', value: creators.length, icon: Users, color: 'purple' },
          { label: 'Bot Attivi', value: active, icon: Bot, color: 'green' },
          { label: 'Inattivi', value: creators.length - active, icon: AlertTriangle, color: 'yellow' },
          { label: 'Uptime', value: '99.9%', icon: TrendingUp, color: 'blue' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">{label}</span>
              <Icon size={16} className={`text-${color}-400`} />
            </div>
            <p className="text-3xl font-bold text-white">{loading ? '...' : value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Creator Attive</h3>
        {loading ? (
          <p className="text-gray-500">Caricamento...</p>
        ) : creators.length === 0 ? (
          <p className="text-gray-500">Nessuna creator. Aggiungine una dalla sezione Creator.</p>
        ) : (
          <div className="space-y-3">
            {creators.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-white font-medium">{c.name}</p>
                  <p className="text-gray-500 text-sm">@{c.ofUsername}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full ${c.isActive ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                  {c.isActive ? 'Attivo' : 'Inattivo'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}