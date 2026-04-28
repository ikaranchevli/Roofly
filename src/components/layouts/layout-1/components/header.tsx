import { useEffect, useState } from 'react';
import { Menu, Moon, Sun, Copy, Check, LogOut } from 'lucide-react';
import { useHousehold } from '@/hooks/use-household';
import { supabase } from '@/lib/supabase';
import { useTheme } from 'next-themes';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SidebarMenu } from './sidebar-menu';

export function Header() {
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);
  const { data: household } = useHousehold();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (household?.join_code) {
      navigator.clipboard.writeText(household.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const { pathname } = useLocation();
  const mobileMode = useIsMobile();
  const scrollPosition = useScrollPosition();
  const headerSticky: boolean = scrollPosition > 0;

  useEffect(() => {
    setIsSidebarSheetOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'header fixed top-0 z-50 start-0 flex items-stretch shrink-0 border-b border-transparent bg-background end-0 pe-[var(--removed-body-scroll-bar-size,0px)]',
        headerSticky && 'border-b border-border',
      )}
    >
      <div className="container-fluid flex items-center h-[64px] relative">
        {/* Mobile View: Hamburger Left, Logo Center */}
        <div className="flex lg:hidden items-center w-full relative">
          {/* Hamburger Menu (Left) */}
          <div className="flex items-center z-20">
            {mobileMode && (
              <Sheet
                open={isSidebarSheetOpen}
                onOpenChange={setIsSidebarSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button variant="ghost" mode="icon">
                    <Menu className="text-muted-foreground/70" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  className="p-0 gap-0 w-[285px] border-0 flex flex-col"
                  side="left"
                  close={false}
                  style={{
                    background: 'linear-gradient(160deg, #E67E22 0%, #C0392B 100%)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Decorative blobs */}
                  <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
                    <div style={{ position: 'absolute', top: '-15%', right: '-20%', width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', filter: 'blur(40px)' }} />
                    <div style={{ position: 'absolute', bottom: '5%', left: '-20%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(0,0,0,0.07)', filter: 'blur(35px)' }} />
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05 }} xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="mobile-menu-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="1" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#mobile-menu-grid)" />
                    </svg>
                  </div>

                  {/* Sheet header — logo */}
                  <SheetHeader className="p-0 space-y-0" style={{ position: 'relative', zIndex: 1 }}>
                    <div className="flex items-center gap-3 px-5" style={{ height: 64 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(8px)',
                        padding: 6,
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}>
                        <img
                          src={toAbsoluteUrl('/logo-white.png')}
                          alt="Roofly"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = toAbsoluteUrl('/roofly-logo.svg');
                          }}
                        />
                      </div>
                      <div className="flex flex-col leading-none">
                        <span style={{ fontFamily: "'Zolo', sans-serif", fontWeight: 400, fontSize: 29, color: 'white', letterSpacing: '0.5px' }}>
                          roofly
                        </span>
                      </div>
                    </div>
                    {/* Divider */}
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', marginInline: 20 }} />
                  </SheetHeader>

                  {/* House Key Card (New for Mobile) */}
                  <div className="px-5 mb-4 mt-6" style={{ position: 'relative', zIndex: 1 }}>
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

                  <SheetBody className="p-0 overflow-y-auto flex-1" style={{ position: 'relative', zIndex: 1 }}>
                    <SidebarMenu />
                  </SheetBody>

                  {/* Mobile Logout (New) */}
                  <div className="p-5 mt-auto border-t border-white/10" style={{ position: 'relative', zIndex: 1 }}>
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        setIsSidebarSheetOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10 font-medium"
                    >
                      <LogOut className="size-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>

          {/* Logo (Centered) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Link to="/dashboard" className="shrink-0 flex items-center gap-2 pointer-events-auto">
              <div className="flex items-center justify-center size-9 rounded-lg bg-[#E67E22] p-2 shadow-sm">
                <img
                  src={toAbsoluteUrl('/logo-white.png')}
                  alt="Roofly"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = toAbsoluteUrl('/roofly-logo.svg');
                  }}
                />
              </div>
              <span style={{ fontFamily: "'Zolo', sans-serif", fontWeight: 400, fontSize: 28 }} className="text-foreground">
                roofly
              </span>
            </Link>
          </div>
        </div>

        {/* Desktop View: (Add logic if needed, currently empty right actions) */}
        <div className="hidden lg:flex items-center justify-between w-full">
          {/* Add desktop topbar elements here if needed */}
        </div>
      </div>
    </header>
  );
}
