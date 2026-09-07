'use client';
import { useEffect, useState, useRef } from 'react';
import { api, Creator } from '@/lib/api';
import { Send, UserCheck, Bot, ChevronDown } from 'lucide-react';

interface Message {
  id: string;
  direction: string;
  content: string;
  isAi: boolean;
  sentAt: string;
  salesPhase: string;
}

interface Fan {
  id: string;
  displayName: string;
  ofFanId: string;
  tier: string;
  totalSpent: number;
}

export default function TakeoverPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [fans, setFans] = useState<Fan[]>([]);
  const [selectedFan, setSelectedFan] = useState<Fan | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTakeover, setIsTakeover] = useState(false);
  const [sending, setSending] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/api/creators').then((r) => {
      setCreators(r.data);
      if (r.data.length > 0) setSelectedCreator(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedCreator) return;
    api.get(`/api/fans/${selectedCreator}`).then((r) => setFans(r.data));
  }, [selectedCreator]);

  useEffect(() => {
    if (!selectedCreator || !selectedFan) return;
    api.get(`/api/takeover/chat/${selectedCreator}/${selectedFan.id}`).then((r) => {
      setMessages(r.data);
      setTimeout(() => chatEnd.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    // Polling ogni 5 secondi
    const interval = setInterval(() => {
      api.get(`/api/takeover/chat/${selectedCreator}/${selectedFan.id}`).then((r) => setMessages(r.data));
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedCreator, selectedFan]);

  async function startTakeover() {
    if (!selectedFan) return;
    await api.post('/api/takeover/start', { creatorId: selectedCreator, fanId: selectedFan.id });
    setIsTakeover(true);
  }

  async function stopTakeover() {
    if (!selectedFan) return;
    await api.post('/api/takeover/stop', { creatorId: selectedCreator, fanId: selectedFan.id });
    setIsTakeover(false);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !selectedFan) return;
    setSending(true);
    try {
      await api.post('/api/takeover/send', {
        creatorId: selectedCreator,
        fanId: selectedFan.id,
        text: input,
      });
      setInput('');
      // Refresh messages
      const r = await api.get(`/api/takeover/chat/${selectedCreator}/${selectedFan.id}`);
      setMessages(r.data);
      setTimeout(() => chatEnd.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      alert('Send failed');
    } finally {
      setSending(false);
    }
  }

  const tierColors: Record<string, string> = {
    whale: 'text-[#C9A961]', hot: 'text-[#FF453A]', warm: 'text-[#FF9F0A]', cold: 'text-[#48484A]',
  };

  return (
    <div className="h-[calc(100vh-5rem)]">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-white text-4xl font-medium tracking-tight">Live Chat</h1>
          <p className="text-[#86868B] text-[14px] mt-2">Take over conversations in real-time</p>
        </div>
        <div className="relative">
          <select
            value={selectedCreator}
            onChange={(e) => { setSelectedCreator(e.target.value); setSelectedFan(null); }}
            className="appearance-none bg-[#141414] text-white text-[13px] rounded-xl pl-4 pr-10 py-2.5 border border-[#1F1F1F] focus:border-[#C9A961] focus:outline-none cursor-pointer"
          >
            {creators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#48484A] pointer-events-none" />
        </div>
      </div>

      <div className="flex gap-3 h-[calc(100%-4rem)]">
        {/* Fan list */}
        <div className="w-64 bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#1F1F1F]">
            <p className="text-white text-[13px] font-medium">Fans ({fans.length})</p>
          </div>
          <div className="flex-1 overflow-auto">
            {fans.map((fan) => (
              <button
                key={fan.id}
                onClick={() => setSelectedFan(fan)}
                className={`w-full text-left px-4 py-3 border-b border-[#1F1F1F] hover:bg-[#141414] transition-colors ${
                  selectedFan?.id === fan.id ? 'bg-[#141414]' : ''
                }`}
              >
                <p className="text-white text-[13px]">{fan.displayName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] capitalize ${tierColors[fan.tier] ?? 'text-[#48484A]'}`}>{fan.tier}</span>
                  <span className="text-[#48484A] text-[10px]">${fan.totalSpent.toFixed(0)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl overflow-hidden flex flex-col">
          {!selectedFan ? (
            <div className="flex-1 flex items-center justify-center text-[#48484A] text-[13px]">
              Select a fan to view the conversation
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-5 py-3 border-b border-[#1F1F1F] flex items-center justify-between">
                <div>
                  <p className="text-white text-[14px] font-medium">{selectedFan.displayName}</p>
                  <p className={`text-[11px] capitalize ${tierColors[selectedFan.tier]}`}>{selectedFan.tier} · ${selectedFan.totalSpent.toFixed(0)} spent</p>
                </div>
                {isTakeover ? (
                  <button onClick={stopTakeover} className="flex items-center gap-1.5 bg-[#30D158]/10 text-[#30D158] text-[12px] px-3 py-1.5 rounded-lg border border-[#30D158]/20 transition-all">
                    <Bot size={12} /> Resume AI
                  </button>
                ) : (
                  <button onClick={startTakeover} className="flex items-center gap-1.5 bg-[#C9A961]/10 text-[#C9A961] text-[12px] px-3 py-1.5 rounded-lg border border-[#C9A961]/20 transition-all">
                    <UserCheck size={12} /> Take Over
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                      msg.direction === 'out'
                        ? msg.isAi
                          ? 'bg-[#1C1C1E] text-white'
                          : 'bg-gradient-to-br from-[#C9A961] to-[#8B7439] text-black'
                        : 'bg-[#141414] text-white'
                    }`}>
                      <p className="text-[13px]">{msg.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] opacity-50">
                          {new Date(msg.sentAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.isAi && <span className="text-[9px] opacity-50">AI</span>}
                        {msg.salesPhase === 'takeover' && <span className="text-[9px] opacity-50">Human</span>}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEnd} />
              </div>

              {/* Input — solo durante takeover */}
              {isTakeover && (
                <form onSubmit={sendMessage} className="px-5 py-3 border-t border-[#1F1F1F] flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-[#141414] text-white text-[13px] rounded-xl px-4 py-2.5 border border-[#1F1F1F] focus:border-[#C9A961] focus:outline-none placeholder:text-[#48484A]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="bg-gradient-to-b from-[#C9A961] to-[#B08F4A] text-black rounded-xl px-4 py-2.5 disabled:opacity-40"
                  >
                    <Send size={14} />
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}