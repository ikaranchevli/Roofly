import { useEffect, useState } from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
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
        'header fixed top-0 z-10 start-0 flex items-stretch shrink-0 border-b border-transparent bg-background end-0 pe-[var(--removed-body-scroll-bar-size,0px)]',
        headerSticky && 'border-b border-border',
      )}
    >
      <div className="container-fluid flex justify-between items-stretch lg:gap-4">
        {/* Mobile: Logo + Sidebar toggle */}
        <div className="flex lg:hidden items-center gap-2.5">
          <Link to="/dashboard" className="shrink-0 flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-lg bg-[#E67E22] p-1.5">
              <img
                src={toAbsoluteUrl('/logo-white.png')}
                alt="Roofly"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = toAbsoluteUrl('/roofly-logo.svg');
                }}
              />
            </div>
            <span style={{ fontFamily: "'Zolo', sans-serif", fontWeight: 400, fontSize: 18 }} className="text-foreground">
              roofly
            </span>
          </Link>
          <div className="flex items-center">
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
                  className="p-0 gap-0 w-[275px] border-0"
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

                  <SheetBody className="p-0 overflow-y-auto" style={{ position: 'relative', zIndex: 1 }}>
                    <SidebarMenu />
                  </SheetBody>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 ms-auto">
        </div>
      </div>
    </header>
  );
}
