'use client';
import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Mic, Trash2, CheckCircle, Upload } from 'lucide-react';

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
    if (!file) return;
    setAudioBlob(file);
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
      alert('Errore durante la clonazione. Riprova.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteVoice() {
    if (!confirm('Eliminare la voce clonata?')) return;
    await api.delete(`/api/voice/clone/${creatorId}`);
    setSuccess(false);
    onUpdate();
  }

  return (
    <div className="mt-3 p-4 bg-gray-800 rounded-lg border border-gray-700">
      <p className="text-gray-300 text-sm font-medium mb-3 flex items-center gap-2">
        <Mic size={14} /> Voice Clone — {creatorName}
      </p>

      {(hasVoice || success) ? (
        <div className="flex items-center justify-between">
          <span className="text-green-400 text-sm flex items-center gap-2">
            <CheckCircle size={14} /> Voce clonata attiva
          </span>
          <button onClick={deleteVoice} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1">
            <Trash2 size={12} /> Elimina
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-gray-500 text-xs">Registra o carica 15-30 secondi di voce</p>

          <div className="flex gap-2 flex-wrap">
            {!recording ? (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm transition"
              >
                <Mic size={14} /> Registra
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded-lg text-sm transition animate-pulse"
              >
                ⏹ Stop
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm transition"
            >
              <Upload size={14} /> Carica file
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {audioBlob && (
              <button
                onClick={cloneVoice}
                disabled={loading}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm transition disabled:opacity-50"
              >
                <Upload size={14} /> {loading ? 'Clonazione...' : 'Clona voce'}
              </button>
            )}
          </div>

          {audioBlob && (
            <p className="text-green-400 text-xs">
              ✓ Audio pronto ({audioBlob instanceof File ? audioBlob.name : 'registrazione'}) — premi Clona voce
            </p>
          )}
        </div>
      )}
    </div>
  );
}