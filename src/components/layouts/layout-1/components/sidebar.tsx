import { useState } from 'react';
import { Copy, Check, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useHousehold } from '@/hooks/use-household';
import { useLayout } from './context';
import { SidebarHeader } from './sidebar-header';
import { SidebarMenu } from './sidebar-menu';

export function Sidebar() {
  const { } = useLayout();
  const { pathname: _pathname } = useLocation();
  const { data: household } = useHousehold();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (household?.join_code) {
      navigator.clipboard.writeText(household.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="sidebar lg:fixed lg:top-0 lg:bottom-0 lg:z-20 lg:flex flex-col items-stretch shrink-0"
      style={{
        background: 'linear-gradient(160deg, #E67E22 0%, #C0392B 100%)',
        borderRight: 'none',
      }}
    >
      {/* Decorative layer — absolutely positioned, own overflow:hidden, never clips siblings */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <div style={{ position: 'absolute', top: '-15%', right: '-20%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '-20%', width: 250, height: 250, borderRadius: '50%', background: 'rgba(0,0,0,0.07)', filter: 'blur(40px)' }} />
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05 }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="sidebar-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sidebar-grid)" />
        </svg>
      </div>

      {/* Sidebar content — normal flow, z-index above decorative layer */}
      <SidebarHeader />

      <div className="px-5 mb-4 mt-2" style={{ position: 'relative', zIndex: 1 }}>
        <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 px-1">
          House Roofly Key
        </div>
        <div
          onClick={handleCopy}
          className="group relative flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 cursor-pointer transition-all active:scale-[0.98]"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div className="flex flex-col">
            <span className="text-white font-mono text-lg font-bold tracking-[0.1em] leading-none">
              {household?.join_code || '------'}
            </span>
          </div>
          <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 group-hover:text-white transition-colors">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
        <div className="w-(--sidebar-default-width)">
          <SidebarMenu />
        </div>
      </div>

      {/* Logout Button at the bottom */}
      <div className="p-4 mt-auto" style={{ position: 'relative', zIndex: 1 }}>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
          }}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10 font-medium"
        >
          <LogOut className="size-4" />
          <span>Log out</span>
        </button>
      </div>

    </div>
  );
}
