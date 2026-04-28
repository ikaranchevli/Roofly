import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';

export function SidebarHeader() {

  return (
    <div className="sidebar-header hidden lg:flex items-center relative justify-between px-3 lg:px-5 shrink-0">
      <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden min-w-0">
        {/* Frosted glass logo container — matches login page */}
        <div
          className="shrink-0"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            padding: 6,
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          <img
            src={toAbsoluteUrl('/logo-white.png')}
            alt="Roofly logo"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = toAbsoluteUrl('/roofly-logo.svg');
            }}
          />
        </div>

        {/* Wordmark — hidden when sidebar is collapsed */}
        <div className="default-logo flex flex-col leading-none min-w-0 overflow-hidden">
          <span
            className="truncate"
            style={{ fontFamily: "'Zolo', sans-serif", fontWeight: 400, fontSize: 28, color: 'white', letterSpacing: '0.5px' }}
          >
            roofly
          </span>
          <span
            className="truncate"
            style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.7px', marginTop: 2 }}
          >
          </span>
        </div>
      </Link>
    </div>
  );
}
