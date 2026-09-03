'use client';
import { useEffect, useState } from 'react';
import { api, Creator } from '@/lib/api';
import { Plus, Trash2, Power } from 'lucide-react';
import VoiceClone from './voice-clone';

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
    } catch (err) {
      alert('Errore durante la creazione');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(c: Creator) {
    await api.put(`/api/creators/${c.id}`, { isActive: !c.isActive, personaPrompt: c.personaPrompt });
    fetchCreators();
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questa creator?')) return;
    await api.delete(`/api/creators/${id}`);
    fetchCreators();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Creator</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition"
        >
          <Plus size={16} /> Aggiungi Creator
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 space-y-4">
          <h3 className="text-white font-semibold">Nuova Creator</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Nome', type: 'text' },
              { key: 'ofUsername', label: 'Username OF', type: 'text' },
              { key: 'email', label: 'Email OF', type: 'email' },
              { key: 'password', label: 'Password OF', type: 'password' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="text-gray-300 text-sm block mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-purple-500 focus:outline-none text-sm"
                  required
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Persona Prompt</label>
            <textarea
              value={form.personaPrompt}
              onChange={(e) => setForm({ ...form, personaPrompt: e.target.value })}
              rows={3}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-purple-500 focus:outline-none text-sm"
              placeholder="You are Sofia, a 25yo Italian girl..."
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50">
              {loading ? 'Salvataggio...' : 'Salva'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-800 text-gray-300 px-4 py-2 rounded-lg text-sm">
              Annulla
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {creators.map((c) => (
          <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{c.name}</p>
                <p className="text-gray-500 text-sm">@{c.ofUsername}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded-full ${c.isActive ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                  {c.isActive ? 'Attivo' : 'Inattivo'}
                </span>
                <button onClick={() => toggleActive(c)} className="text-gray-400 hover:text-white transition">
                  <Power size={16} />
                </button>
                <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-400 transition">
                  <Trash2 size={16} />
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