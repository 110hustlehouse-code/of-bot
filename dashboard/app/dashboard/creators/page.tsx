'use client';
import { useEffect, useState } from 'react';
import { api, Creator } from '@/lib/api';
import { Plus, Trash2, Power, X } from 'lucide-react';
import VoiceClone from './voice-clone';
import CookieUpload from './cookie-upload';
import RagExamples from './rag-examples';

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', ofUsername: '', email: '', password: '', personaPrompt: '' });
  const [loading, setLoading] = useState(false);

  async function fetchCreators() {
    const r = await api.get('/api/creators');
    setCreators(r.data);
  }

  useEffect(() => { fetchCreators(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/creators', form);
      setShowForm(false);
      setForm({ name: '', ofUsername: '', email: '', password: '', personaPrompt: '' });
      fetchCreators();
    } catch {
      alert('Error creating creator');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(c: Creator) {
    await api.put(`/api/creators/${c.id}`, { isActive: !c.isActive, personaPrompt: c.personaPrompt });
    fetchCreators();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this creator?')) return;
    await api.delete(`/api/creators/${id}`);
    fetchCreators();
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-white text-4xl font-medium tracking-tight">Creators</h1>
          <p className="text-[#86868B] text-[14px] mt-2">
            Manage the workspaces Aura runs for you
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-white hover:bg-[#F5F5F7] text-black px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} /> Add creator
        </button>
      </div>

      {showForm && (
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white text-[15px] font-medium">New creator</h3>
            <button onClick={() => setShowForm(false)} className="text-[#48484A] hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'name', label: 'Display name', type: 'text', placeholder: 'Sofia' },
                { key: 'ofUsername', label: 'OnlyFans username', type: 'text', placeholder: 'sofia_of' },
                { key: 'email', label: 'OF email', type: 'email', placeholder: 'sofia@email.com' },
                { key: 'password', label: 'OF password', type: 'password', placeholder: '••••••••' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="text-[#86868B] text-[11px] tracking-wide block mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full bg-[#141414] text-white text-[14px] rounded-xl px-4 py-3 border border-[#1F1F1F] focus:border-[#C9A961] focus:bg-[#1C1C1E] focus:outline-none transition-all placeholder:text-[#48484A]"
                    required
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-[#86868B] text-[11px] tracking-wide block mb-1.5">Persona prompt</label>
              <textarea
                value={form.personaPrompt}
                onChange={(e) => setForm({ ...form, personaPrompt: e.target.value })}
                rows={3}
                className="w-full bg-[#141414] text-white text-[14px] rounded-xl px-4 py-3 border border-[#1F1F1F] focus:border-[#C9A961] focus:bg-[#1C1C1E] focus:outline-none transition-all placeholder:text-[#48484A] resize-none"
                placeholder="You are Sofia, a 25yo Italian girl, playful and flirty..."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                type="submit" 
                disabled={loading} 
                className="bg-gradient-to-b from-[#C9A961] to-[#B08F4A] hover:from-[#D4B570] hover:to-[#BC9955] text-black text-[13px] font-medium px-5 py-2.5 rounded-xl transition-all disabled:opacity-40"
              >
                {loading ? 'Saving' : 'Save creator'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="bg-[#141414] hover:bg-[#1C1C1E] text-[#86868B] text-[13px] px-5 py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {creators.length === 0 && !showForm && (
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-16 text-center">
            <p className="text-[#86868B] text-[14px] mb-1">No creators yet</p>
            <p className="text-[#48484A] text-[12px]">Add your first creator to start</p>
          </div>
        )}

        {creators.map((c) => (
          <div key={c.id} className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-6 hover:border-[#2C2C2E] transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] border border-[#2C2C2E] flex items-center justify-center text-[#C9A961] text-[15px] font-medium">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-[15px] font-medium">{c.name}</p>
                  <p className="text-[#48484A] text-[12px]">@{c.ofUsername}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-[#30D158] aura-live' : 'bg-[#48484A]'}`} />
                  <span className={`text-[12px] ${c.isActive ? 'text-[#30D158]' : 'text-[#48484A]'}`}>
                    {c.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>
                <button onClick={() => toggleActive(c)} className="text-[#48484A] hover:text-white transition-colors p-1">
                  <Power size={15} strokeWidth={2} />
                </button>
                <button onClick={() => handleDelete(c.id)} className="text-[#48484A] hover:text-[#FF453A] transition-colors p-1">
                  <Trash2 size={15} strokeWidth={2} />
                </button>
              </div>
            </div>
            <VoiceClone
              creatorId={c.id}
              creatorName={c.name}
              hasVoice={!!(c as any).elevenLabsVoiceId}
              onUpdate={fetchCreators}
            />
          </div>
        ))}
      </div>
    </div>
  );
}