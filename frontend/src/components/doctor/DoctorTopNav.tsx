import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, CalendarRange, FileText, UserCircle, Settings } from 'lucide-react';

interface DoctorTopNavProps {
  doctorId?: number;
}

export function DoctorTopNav({ doctorId }: DoctorTopNavProps) {
  const location = useLocation();
  const path = location.pathname;

  const hasDoctorId = typeof doctorId === 'number' && doctorId > 0;

  const tabs = [
    {
      id: 'dashboard',
      label: 'Insight Dashboard',
      icon: Activity,
      href: hasDoctorId ? `/doctors/${doctorId}/dashboard` : '/dashboard',
      isActive: path.includes('/dashboard') && path !== '/dashboard',
      disabled: !hasDoctorId,
    },
    {
      id: 'availability',
      label: 'Availability',
      icon: CalendarRange,
      href: hasDoctorId ? `/doctors/${doctorId}/availability` : '/doctors/profile/manage',
      isActive: path.includes('/availability'),
      disabled: !hasDoctorId,
    },
    {
      id: 'reports',
      label: 'Patient Reports',
      icon: FileText,
      href: '/doctor/reports',
      isActive: path === '/doctor/reports',
      disabled: false,
    },
    {
      id: 'profile',
      label: 'Public Profile',
      icon: UserCircle,
      href: '/doctors/profile',
      isActive: path === '/doctors/profile',
      disabled: false,
    },
    {
      id: 'manage',
      label: 'Settings',
      icon: Settings,
      href: '/doctors/profile/manage',
      isActive: path.includes('/manage'),
      disabled: false,
    },
  ];

  return (
    <div className="mb-8 w-full">
      <nav className="mx-auto flex max-w-fit items-center gap-2 overflow-x-auto rounded-full border border-white/80 bg-white/75 p-2 shadow-[0_18px_50px_rgba(13,55,78,0.12)] backdrop-blur-xl">
        {tabs.map((tab) => {
          const active = tab.isActive;
          const disabled = tab.disabled;
          return (
            disabled ? (
              <span
                key={tab.id}
                className="relative flex cursor-not-allowed items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-slate-400 opacity-70"
                title="Complete profile setup first"
              >
                <tab.icon className="relative z-10 h-4 w-4 text-slate-300" />
                <span className="relative z-10">{tab.label}</span>
              </span>
            ) : (
              <Link
                key={tab.id}
                to={tab.href}
                className={`relative flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                  active ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="doctor-nav-pill"
                    className="absolute inset-0 z-0 rounded-full bg-gradient-to-r from-teal-600 to-cyan-500"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
                <tab.icon className={`relative z-10 h-4 w-4 ${active ? 'text-teal-50' : 'text-slate-400'}`} />
                <span className="relative z-10">{tab.label}</span>
              </Link>
            )
          );
        })}
      </nav>
    </div>
  );
}
