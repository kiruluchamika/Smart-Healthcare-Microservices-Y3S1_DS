import { BarChart3, Settings, ShieldCheck, UserCog, Users, X, LogOut, Video } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuthSession } from '../../services/authSession';

interface AdminSidebarProps {
  expanded: boolean;
  mobile?: boolean;
  onClose?: () => void;
}

type NavItem = {
  label: string;
  to: string;
  icon: JSX.Element;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: <ShieldCheck className="h-5 w-5" /> },
  { label: 'Doctor Verification', to: '/admin/verification', icon: <UserCog className="h-5 w-5" /> },
  { label: 'Users', to: '/admin/users', icon: <Users className="h-5 w-5" /> },
  { label: 'Analytics', to: '/admin/analytics', icon: <BarChart3 className="h-5 w-5" /> },
  { label: 'Telemedicine', to: '/admin/telemedicine', icon: <Video className="h-5 w-5" /> },
  { label: 'System Settings', to: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
];

export function AdminSidebar({ expanded, mobile = false, onClose }: AdminSidebarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthSession();
    navigate('/admin/login');
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#10356a] via-[#18457d] to-[#1f4f88] text-white">
      <div className="flex h-16 items-center justify-between border-b border-white/20 px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className={`whitespace-nowrap text-sm font-semibold tracking-wide transition-opacity ${expanded ? 'opacity-100' : 'opacity-0'} ${mobile ? 'opacity-100' : ''}`}>
            Admin Console
          </span>
        </div>

        {mobile && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <span className="shrink-0">{item.icon}</span>
            <span className={`whitespace-nowrap transition-opacity ${expanded ? 'opacity-100' : 'opacity-0'} ${mobile ? 'opacity-100' : ''}`}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/20 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className={`whitespace-nowrap transition-opacity ${expanded ? 'opacity-100' : 'opacity-0'} ${mobile ? 'opacity-100' : ''}`}>
            Sign out
          </span>
        </button>
      </div>
    </div>
  );
}
