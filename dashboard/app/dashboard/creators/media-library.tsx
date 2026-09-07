'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Image, Film, Music, Upload, Trash2 } from 'lucide-react';

interface Media {
  id: string;
  type: string;
  filename: string;
  category: string;
  usageCount: number;
}

interface Props {
  creatorId: string;
}

export default function MediaLibrary({ creatorId }: Props) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('general');
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchMedia() {
    const r = await api.get(`/api/media/${creatorId}`);
    setMedia(r.data);
  }

  useEffect(() => { fetchMedia(); }, [creatorId]);

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      await api.post(`/api/media/${creatorId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchMedia();
    } catch {
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  }

  async function deleteMedia(id: string) {
    await api.delete(`/api/media/${creatorId}/${id}`);
    fetchMedia();
  }

  const icons: Record<string, any> = { photo: Image, video: Film, audio: Music };

  return (
    <div className="mt-4 pt-4 border-t border-[#1F1F1F]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[#86868B] text-[11px] tracking-wide flex items-center gap-2">
          <Image size={11} /> Media ({media.length})
        </p>
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#141414] text-white text-[10px] rounded-lg px-2 py-1 border border-[#1F1F1F] focus:outline-none"
          >
            <option value="casual">Casual</option>
            <option value="teasing">Teasing</option>
            <option value="explicit">Explicit</option>
            <option value="ppv">PPV</option>
          </select>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-1 bg-[#141414] hover:bg-[#1C1C1E] text-white text-[11px] px-2 py-1 rounded-lg border border-[#1F1F1F] transition-all disabled:opacity-40"
          >
            <Upload size={10} /> {loading ? '...' : 'Upload'}
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*,audio/*" onChange={uploadFile} className="hidden" />
        </div>
      </div>

      {media.length > 0 && (
        <div className="space-y-1 max-h-32 overflow-auto">
          {media.map((m) => {
            const Icon = icons[m.type] ?? Image;
            return (
              <div key={m.id} className="flex items-center justify-between py-1 group">
                <div className="flex items-center gap-2 text-[11px] min-w-0">
                  <Icon size={11} className="text-[#48484A] flex-shrink-0" />
                  <span className="text-white truncate">{m.filename}</span>
                  <span className="text-[#48484A]">{m.category}</span>
                  <span className="text-[#48484A]">×{m.usageCount}</span>
                </div>
                <button onClick={() => deleteMedia(m.id)} className="text-[#48484A] hover:text-[#FF453A] opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={11} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}