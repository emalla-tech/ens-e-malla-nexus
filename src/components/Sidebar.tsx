import {
  Bell,
  AlarmClock,
  CalendarDays,
  ClipboardCheck,
  Flag,
  FolderKanban,
  LayoutDashboard,
  NotebookText,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';
import { cn } from '../utils/cn';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Tasks', href: '/tasks', icon: ClipboardCheck },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Calendar', href: '/calendar', icon: CalendarDays },
  { label: 'Reminders', href: '/reminders', icon: AlarmClock },
  { label: 'Notes', href: '/notes', icon: NotebookText },
  { label: 'Goals', href: '/goals', icon: Flag },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-brand-black px-5 py-6 text-white shadow-premium transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button
            className="grid h-10 w-10 place-items-center rounded-md text-gray-300 hover:bg-white/10 lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-9 flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition',
                  isActive
                    ? 'bg-white text-brand-black'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="rounded-md border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">E-Malla Nexus</p>
          <p className="mt-2 text-xs leading-5 text-gray-400">
            Executive work, follow-ups, and decisions in one daily command center.
          </p>
        </div>
      </aside>

      {open ? (
        <button
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-label="Close navigation overlay"
        />
      ) : null}
    </>
  );
}
