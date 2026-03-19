'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRole } from '@/lib/context/RoleContext';

const navItems = [
  { href: '/',           label: 'Dashboard',   icon: '◻' },
  { href: '/schedule',   label: 'Schedule',    icon: '▦' },
  { href: '/employees',  label: 'Employees',   icon: '◉' },
  { href: '/settings',   label: 'Settings',    icon: '⚙' },
];

export function NavSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, userEmail, userId, signOut, loading } = useRole();

  // Don't show sidebar on login page
  if (pathname === '/login') return null;

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden sm:flex w-52 bg-white border-r border-gray-200 flex-col shrink-0">
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

        {/* Footer: user info + logout */}
        <div className="px-4 py-3 border-t border-gray-100 space-y-2">
          {!loading && userId && (
            <>
              <div>
                <p className="text-[10px] text-gray-400 truncate" title={userEmail ?? ''}>
                  {userEmail}
                </p>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                  role === 'manager'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {role === 'manager' ? 'Manager' : 'Employee'}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-[11px] text-gray-400 hover:text-red-500 transition-colors w-full text-left"
              >
                Sign out
              </button>
            </>
          )}
          <p className="text-[10px] text-gray-400">Week of {getWeekLabel()}</p>
        </div>
      </aside>

      {/* Mobile bottom tab bar — visible only on small screens */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-xs font-medium transition-colors ${
                isActive ? 'text-indigo-600' : 'text-gray-500'
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
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
