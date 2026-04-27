import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useMenu } from '@/hooks/use-menu';

const NAV_LINKS = [
  { title: 'Dashboard', path: '/dashboard' },
  { title: 'Tenants', path: '/tenants' },
];

export function MegaMenuMobile() {
  const { pathname } = useLocation();
  const { isActive } = useMenu(pathname);

  return (
    <nav className="flex flex-col gap-1 p-4">
      {NAV_LINKS.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive(item.path)
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
