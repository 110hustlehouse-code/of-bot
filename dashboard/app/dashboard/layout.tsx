'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, logout } from '@/lib/auth';
import { LayoutDashboard, Users, BarChart3, Shield, Settings, LogOut, MessageSquare, Trophy } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  const links = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/creators', label: 'Creators', icon: Users },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/safety', label: 'Safety', icon: Shield },
    { href: '/dashboard/takeover', label: 'Live Chat', icon: MessageSquare },
    { href: '/dashboard/agents', label: 'Agents', icon: Trophy },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <aside className="w-60 bg-[#0A0A0A] border-r border-[#1F1F1F] flex flex-col fixed h-screen">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-[#1F1F1F]">
          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#E8C577] via-[#C9A961] to-[#8B7439]" />
              <div className="absolute inset-[2px] rounded-full bg-black flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-[#C9A961] aura-live" />
              </div>
            </div>
            <span className="text-white text-[15px] font-medium tracking-tight">Aura</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all group ${
                  active
                    ? 'bg-[#141414] text-white'
                    : 'text-[#86868B] hover:text-white hover:bg-[#141414]/50'
                }`}
              >
                <Icon size={15} className={active ? 'text-[#C9A961]' : 'text-[#48484A] group-hover:text-[#86868B]'} strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[#1F1F1F]">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-[#86868B] hover:text-white hover:bg-[#141414] transition-all"
          >
            <LogOut size={15} className="text-[#48484A]" strokeWidth={2} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 min-h-screen">
        <div className="max-w-7xl mx-auto px-10 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}