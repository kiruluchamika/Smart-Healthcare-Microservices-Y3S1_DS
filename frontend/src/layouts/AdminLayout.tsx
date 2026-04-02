import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Menu } from 'lucide-react';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { getAuthUser } from '../services/authSession';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const user = getAuthUser();

  const userName = useMemo(() => {
    const firstName = typeof user?.firstName === 'string' ? user.firstName : '';
    const lastName = typeof user?.lastName === 'string' ? user.lastName : '';
    const full = `${firstName} ${lastName}`.trim();
    return full || user?.email || 'Admin';
  }, [user]);

  const handleDesktopBlur = (event: React.FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsExpanded(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen overflow-hidden shadow-xl transition-[width] duration-300 md:flex ${
          isExpanded ? 'w-64' : 'w-20'
        }`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        onFocusCapture={() => setIsExpanded(true)}
        onBlurCapture={handleDesktopBlur}
      >
        <AdminSidebar expanded={isExpanded} />
      </aside>

      <div className={`transition-[margin] duration-300 ${isExpanded ? 'md:ml-64' : 'md:ml-20'}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="rounded-xl border border-slate-200 p-2 text-slate-700 md:hidden"
                aria-label="Open admin navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-sm font-semibold text-slate-500">Smart Healthcare</h1>
                <p className="text-lg font-bold text-[#0f3769]">Admin Panel</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
              {userName}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>

      <div
        className={`fixed inset-0 z-50 md:hidden ${isMobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!isMobileOpen}
      >
        <div
          className={`absolute inset-0 bg-slate-900/45 transition-opacity ${isMobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-72 transform transition-transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <AdminSidebar expanded mobile onClose={() => setIsMobileOpen(false)} />
        </aside>
      </div>
    </div>
  );
}
