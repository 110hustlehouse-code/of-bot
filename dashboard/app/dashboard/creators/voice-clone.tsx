'use client';
import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Mic, Trash2, CheckCircle2, Upload } from 'lucide-react';

interface Props {
  creatorId: string;
  creatorName: string;
  hasVoice: boolean;
  onUpdate: () => void;
}

export default function VoiceClone({ creatorId, creatorName, hasVoice, onUpdate }: Props) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setAudioBlob(blob);
      stream.getTracks().forEach(t => t.stop());
    };
    recorder.start();
    mediaRef.current = recorder;
    setRecording(true);
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setAudioBlob(file);
  }

  async function cloneVoice() {
    if (!audioBlob) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice.webm');
      await api.post(`/api/voice/clone/${creatorId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
      setAudioBlob(null);
      onUpdate();
    } catch {
      alert('Cloning failed');
    } finally {
      setLoading(false);
    }
  }

  async function deleteVoice() {
    if (!confirm('Delete cloned voice?')) return;
    await api.delete(`/api/voice/clone/${creatorId}`);
    setSuccess(false);
    onUpdate();
  }

  return (
    <div className="mt-5 pt-5 border-t border-[#1F1F1F]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[#86868B] text-[11px] tracking-wide flex items-center gap-2">
          <Mic size={11} /> Voice
        </p>
        {(hasVoice || success) && (
          <button onClick={deleteVoice} className="text-[#48484A] hover:text-[#FF453A] text-[11px] transition-colors">
            Remove
          </button>
        )}
      </div>

      {(hasVoice || success) ? (
        <div className="flex items-center gap-2 text-[#30D158] text-[13px]">
          <CheckCircle2 size={14} />
          <span>Voice cloned and active</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          {!recording ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 bg-[#141414] hover:bg-[#1C1C1E] text-white text-[12px] px-3 py-2 rounded-lg border border-[#1F1F1F] transition-all"
            >
              <Mic size={12} /> Record
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 bg-[#FF453A]/10 text-[#FF453A] text-[12px] px-3 py-2 rounded-lg border border-[#FF453A]/30 transition-all"
            >
              <div className="w-2 h-2 rounded-sm bg-[#FF453A] animate-pulse" /> Recording — stop
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-[#141414] hover:bg-[#1C1C1E] text-white text-[12px] px-3 py-2 rounded-lg border border-[#1F1F1F] transition-all"
          >
            <Upload size={12} /> Upload
          </button>

          <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />

          {audioBlob && (
            <button
              onClick={cloneVoice}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-b from-[#C9A961] to-[#B08F4A] hover:from-[#D4B570] text-black text-[12px] font-medium px-3 py-2 rounded-lg transition-all disabled:opacity-40"
            >
              {loading ? 'Cloning' : 'Clone voice'}
            </button>
          )}

          {audioBlob && !loading && (
            <span className="text-[#30D158] text-[11px]">✓ Ready</span>
          )}
        </div>
      )}
    </div>
  );
}