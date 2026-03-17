'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/',           label: 'Dashboard',   icon: '◻' },
  { href: '/schedule',   label: 'Schedule',    icon: '▦' },
  { href: '/employees',  label: 'Employees',   icon: '◉' },
  { href: '/settings',   label: 'Settings',    icon: '⚙' },
];

export function NavSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-52 bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Logo / App name */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            S
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">Smart</p>
            <p className="font-semibold text-gray-900 text-sm leading-tight">Schedule</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-400">Recreation Center</p>
        <p className="text-[10px] text-gray-400">Week of {getWeekLabel()}</p>
      </div>
    </aside>
  );
}

function getWeekLabel(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
