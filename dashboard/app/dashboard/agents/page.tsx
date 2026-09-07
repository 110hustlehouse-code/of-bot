'use client';
import { useEffect, useState } from 'react';
import { api, Creator } from '@/lib/api';
import { Trophy, TrendingUp, MessageSquare, DollarSign } from 'lucide-react';

interface AgentScore {
  creatorId: string;
  creatorName: string;
  totalRevenue: number;
  totalConversions: number;
  conversionRate: number;
  avgRevenuePerFan: number;
  totalMessages: number;
  aiMessages: number;
  automationRate: number;
  score: number;
}

export default function AgentsPage() {
  const [ranking, setRanking] = useState<AgentScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/reinforcement/ranking')
      .then((r) => setRanking(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-white text-4xl font-medium tracking-tight">Agents</h1>
        <p className="text-[#86868B] text-[14px] mt-2">
          Performance ranking and value scoring
        </p>
      </div>

      {loading ? (
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-16 text-center text-[#48484A] text-[13px]">Loading</div>
      ) : ranking.length === 0 ? (
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-16 text-center">
          <p className="text-[#86868B] text-[14px]">No agents yet</p>
          <p className="text-[#48484A] text-[12px] mt-1">Add creators to see their performance</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ranking.map((agent, i) => (
            <div key={agent.creatorId} className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-6 hover:border-[#2C2C2E] transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold ${
                    i === 0 ? 'bg-gradient-to-br from-[#C9A961] to-[#8B7439] text-black' :
                    i === 1 ? 'bg-[#C0C0C0]/20 text-[#C0C0C0]' :
                    i === 2 ? 'bg-[#CD7F32]/20 text-[#CD7F32]' :
                    'bg-[#1C1C1E] text-[#48484A]'
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-white text-[15px] font-medium">{agent.creatorName}</p>
                    <p className="text-[#48484A] text-[12px]">Score: {agent.score}/100</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-24 h-2 bg-[#1C1C1E] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#C9A961] to-[#8B7439] rounded-full"
                      style={{ width: `${agent.score}%` }}
                    />
                  </div>
                  <span className="text-[#C9A961] text-[12px] font-medium ml-2">{agent.score}</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <Metric icon={DollarSign} label="Revenue" value={`€${agent.totalRevenue.toFixed(0)}`} />
                <Metric icon={Trophy} label="Conversions" value={agent.totalConversions.toString()} />
                <Metric icon={TrendingUp} label="Conv. Rate" value={`${(agent.conversionRate * 100).toFixed(1)}%`} />
                <Metric icon={MessageSquare} label="Automation" value={`${(agent.automationRate * 100).toFixed(0)}%`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-[#141414] rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={11} className="text-[#48484A]" />
        <span className="text-[#48484A] text-[10px]">{label}</span>
      </div>
      <p className="text-white text-[15px] font-medium">{value}</p>
    </div>
  );
}