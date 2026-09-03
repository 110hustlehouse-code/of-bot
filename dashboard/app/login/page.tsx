'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      setError('Credenziali non valide');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex overflow-hidden relative">
      {/* Ambient glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[#C9A961] opacity-[0.08] blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-[#C9A961] opacity-[0.04] blur-[100px]" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      {/* LEFT — hero brand */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-16 relative z-10">
        <div className={`flex items-center gap-3 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#E8C577] via-[#C9A961] to-[#8B7439]" />
            <div className="absolute inset-[3px] rounded-full bg-black flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A961] aura-live" />
            </div>
          </div>
          <span className="text-white text-lg font-medium tracking-tight">Aura</span>
        </div>

        <div className={`space-y-8 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div>
            <p className="text-[#C9A961] text-[13px] font-medium mb-6 tracking-wider uppercase">
              Enterprise · Q4 2026
            </p>
            <h1 className="text-white text-6xl xl:text-7xl font-medium tracking-[-0.04em] leading-[0.95]">
              The intelligence<br/>
              behind every<br/>
              <span className="italic font-light text-[#C9A961]">conversation.</span>
            </h1>
          </div>
          
          <p className="text-[#86868B] text-lg max-w-md leading-relaxed">
            Aura learns each creator's voice, senses every fan's mood, and speaks — 24 hours a day, in any language.
          </p>

          <div className="flex items-center gap-8 pt-4">
            <Stat value="98.4%" label="Human-detection bypass" />
            <div className="w-px h-8 bg-[#1F1F1F]" />
            <Stat value="+340%" label="PPV conversion" />
            <div className="w-px h-8 bg-[#1F1F1F]" />
            <Stat value="0" label="Ban incidents" />
          </div>
        </div>

        <div className={`flex items-center justify-between text-[#48484A] text-[12px] transition-opacity duration-1000 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <span>© Aura Systems</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#30D158] aura-live" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>

      {/* RIGHT — login card */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className={`w-full max-w-[380px] transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#E8C577] via-[#C9A961] to-[#8B7439]" />
              <div className="absolute inset-[3px] rounded-full bg-black flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A961] aura-live" />
              </div>
            </div>
            <span className="text-white text-xl font-medium tracking-tight">Aura</span>
          </div>

          <div className="bg-[#0A0A0A]/80 backdrop-blur-2xl border border-[#1F1F1F] rounded-3xl p-10 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-white text-2xl font-medium tracking-tight mb-1">Welcome back</h2>
              <p className="text-[#86868B] text-[14px]">Sign in to your workspace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[#86868B] text-[12px] block mb-2 tracking-wide">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#141414] text-white text-[15px] rounded-xl px-4 py-3.5 border border-[#1F1F1F] focus:border-[#C9A961] focus:bg-[#1C1C1E] focus:outline-none transition-all placeholder:text-[#48484A]"
                  placeholder="you@agency.com"
                  required
                  autoFocus
                />
              </div>
              
              <div>
                <label className="text-[#86868B] text-[12px] block mb-2 tracking-wide">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#141414] text-white text-[15px] rounded-xl px-4 py-3.5 border border-[#1F1F1F] focus:border-[#C9A961] focus:bg-[#1C1C1E] focus:outline-none transition-all placeholder:text-[#48484A]"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="w-1 h-1 rounded-full bg-[#FF453A]" />
                  <p className="text-[#FF453A] text-[13px]">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-b from-[#C9A961] to-[#B08F4A] hover:from-[#D4B570] hover:to-[#BC9955] text-black text-[15px] font-semibold rounded-xl py-3.5 mt-6 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#C9A961]/10"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Signing in
                  </span>
                ) : 'Sign in to Aura'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#1F1F1F] flex items-center justify-between text-[12px]">
              <span className="text-[#48484A]">Need access?</span>
              <a href="#" className="text-[#C9A961] hover:text-[#D4B570] transition-colors">Request invite →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-white text-2xl font-medium tracking-tight">{value}</div>
      <div className="text-[#48484A] text-[11px] mt-0.5 tracking-wide">{label}</div>
    </div>
  );
}