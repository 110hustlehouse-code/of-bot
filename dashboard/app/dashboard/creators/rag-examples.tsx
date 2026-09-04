'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Plus, Trash2, Upload, MessageSquare } from 'lucide-react';

interface Example {
  id: string;
  fanMessage: string;
  creatorReply: string;
  category: string;
}

interface Props {
  creatorId: string;
  creatorName: string;
}

export default function RagExamples({ creatorId, creatorName }: Props) {
  const [examples, setExamples] = useState<Example[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [fan, setFan] = useState('');
  const [reply, setReply] = useState('');
  const [category, setCategory] = useState('general');
  const [bulkText, setBulkText] = useState('');
  const [loading, setLoading] = useState(false);

  async function fetchExamples() {
    const r = await api.get(`/api/examples/${creatorId}`);
    setExamples(r.data);
  }

  useEffect(() => { fetchExamples(); }, [creatorId]);

  async function addExample(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/api/examples/${creatorId}`, { fanMessage: fan, creatorReply: reply, category });
      setFan('');
      setReply('');
      setShowForm(false);
      fetchExamples();
    } catch {
      alert('Error adding example');
    } finally {
      setLoading(false);
    }
  }

  async function uploadBulk() {
    setLoading(true);
    try {
      const lines = bulkText.trim().split('\n');
      const parsed = lines.map(line => {
        const [fanMessage, creatorReply] = line.split('|').map(s => s.trim());
        return { fanMessage, creatorReply, category: 'general' };
      }).filter(e => e.fanMessage && e.creatorReply);

      if (parsed.length === 0) {
        alert('Format: fan message | creator reply (one per line)');
        return;
      }

      await api.post(`/api/examples/${creatorId}/bulk`, { examples: parsed });
      setBulkText('');
      setShowBulk(false);
      fetchExamples();
    } catch {
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  }

  async function deleteExample(id: string) {
    await api.delete(`/api/examples/${creatorId}/${id}`);
    fetchExamples();
  }

  return (
    <div className="mt-4 pt-4 border-t border-[#1F1F1F]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[#86868B] text-[11px] tracking-wide flex items-center gap-2">
          <MessageSquare size={11} /> Training examples ({examples.length})
        </p>
        <div className="flex gap-2">
          <button onClick={() => { setShowBulk(!showBulk); setShowForm(false); }} className="text-[#48484A] hover:text-white text-[11px] transition-colors flex items-center gap-1">
            <Upload size={10} /> Bulk
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowBulk(false); }} className="text-[#48484A] hover:text-white text-[11px] transition-colors flex items-center gap-1">
            <Plus size={10} /> Add
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={addExample} className="space-y-2 mb-3">
          <input
            value={fan}
            onChange={(e) => setFan(e.target.value)}
            placeholder="Fan message"
            className="w-full bg-[#141414] text-white text-[12px] rounded-lg px-3 py-2 border border-[#1F1F1F] focus:border-[#C9A961] focus:outline-none placeholder:text-[#48484A]"
            required
          />
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Creator reply"
            className="w-full bg-[#141414] text-white text-[12px] rounded-lg px-3 py-2 border border-[#1F1F1F] focus:border-[#C9A961] focus:outline-none placeholder:text-[#48484A]"
            required
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#141414] text-white text-[12px] rounded-lg px-3 py-2 border border-[#1F1F1F] focus:border-[#C9A961] focus:outline-none"
          >
            <option value="general">General</option>
            <option value="flirt">Flirt</option>
            <option value="ppv_pitch">PPV Pitch</option>
            <option value="sexting">Sexting</option>
            <option value="casual">Casual</option>
          </select>
          <button type="submit" disabled={loading} className="bg-gradient-to-b from-[#C9A961] to-[#B08F4A] text-black text-[12px] font-medium px-3 py-2 rounded-lg disabled:opacity-40">
            {loading ? 'Saving...' : 'Save'}
          </button>
        </form>
      )}

      {showBulk && (
        <div className="space-y-2 mb-3">
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={5}
            placeholder={"hey babe how are you | hey cutie! im great, just thinking about you 💕\nwhat are you wearing | wouldn't you like to know 😘 maybe I'll show you..."}
            className="w-full bg-[#141414] text-white text-[11px] font-mono rounded-lg px-3 py-2 border border-[#1F1F1F] focus:border-[#C9A961] focus:outline-none resize-none placeholder:text-[#48484A]"
          />
          <p className="text-[#48484A] text-[10px]">Format: fan message | creator reply (one per line)</p>
          <button onClick={uploadBulk} disabled={loading} className="bg-gradient-to-b from-[#C9A961] to-[#B08F4A] text-black text-[12px] font-medium px-3 py-2 rounded-lg disabled:opacity-40">
            {loading ? 'Uploading...' : `Upload ${bulkText.trim().split('\n').filter(l => l.includes('|')).length} examples`}
          </button>
        </div>
      )}

      {examples.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-auto">
          {examples.map((ex) => (
            <div key={ex.id} className="flex items-start justify-between py-1.5 group">
              <div className="text-[11px] flex-1 min-w-0">
                <p className="text-[#86868B] truncate">Fan: {ex.fanMessage}</p>
                <p className="text-white truncate">Reply: {ex.creatorReply}</p>
              </div>
              <button onClick={() => deleteExample(ex.id)} className="text-[#48484A] hover:text-[#FF453A] opacity-0 group-hover:opacity-100 transition-all ml-2 mt-1">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}