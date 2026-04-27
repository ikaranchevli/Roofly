import { ChevronFirst } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLayout } from './context';

export function SidebarHeader() {
  const { sidebarCollapse, setSidebarCollapse } = useLayout();

  const handleToggleClick = () => {
    setSidebarCollapse(!sidebarCollapse);
  };

  return (
    <div className="sidebar-header hidden lg:flex items-center relative justify-between px-3 lg:px-5 shrink-0">
      <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden min-w-0">
        {/* Logo icon — always visible, orange bg so white strokes show up */}
        <div className="flex items-center justify-center size-9 rounded-xl bg-[#E67E22] shrink-0 p-1.5">
          <img
            src={toAbsoluteUrl('/roofly-logo.svg')}
            alt="Roofly logo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Wordmark — hidden when sidebar collapsed */}
        <div className="default-logo flex flex-col leading-none min-w-0">
          <span className="text-base font-extrabold tracking-tight text-foreground">
            Roofly
          </span>
          <span className="text-[10px] font-medium text-muted-foreground tracking-wide mt-0.5 truncate">
            Cozy. Connected. Confirmed.
          </span>
        </div>
      </Link>

      <Button
        onClick={handleToggleClick}
        size="sm"
        mode="icon"
        variant="outline"
        className={cn(
          'size-7 absolute start-full top-2/4 rtl:translate-x-2/4 -translate-x-2/4 -translate-y-2/4',
          sidebarCollapse ? 'ltr:rotate-180' : 'rtl:rotate-180',
        )}
      >
        <ChevronFirst className="size-4!" />
      </Button>
    </div>
  );
}
