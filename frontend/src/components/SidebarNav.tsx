import { NavLink } from 'react-router-dom';

const baseLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/tasks', label: 'My Tasks', icon: '✅' },
  { to: '/goals', label: 'My Goals', icon: '🎯' },
  { to: '/wellness-check', label: 'Wellness Check', icon: '💚' },
  { to: '/professionals', label: 'Professionals', icon: '👩‍⚕️' },
  { to: '/resources', label: 'Resources', icon: '📚' }
];

type Props = {
  user: { name: string; email: string; role?: string } | null;
  onSignOut: () => void;
};

export default function SidebarNav({ user, onSignOut }: Props) {
  const adminLinks = user?.role === 'admin' ? [
    { to: '/admin/professionals', label: 'Manage Professionals', icon: '👥' },
    { to: '/admin/resources', label: 'Manage Resources', icon: '📁' }
  ] : [];

  const links = [
    ...baseLinks,
    { to: '/book', label: 'Book Session', icon: '📅' },
    ...adminLinks
  ];

  return (
    <aside className="w-64 bg-white/85 border-r border-white/70 backdrop-blur-xl hidden lg:flex flex-col">
      <div className="px-5 py-6 border-b border-white/70">
        <div className="text-sm font-semibold text-brand-700 uppercase tracking-wide">MindConnect</div>
        <div className="text-lg font-bold text-slate-900">Wellness & Productivity</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold ${
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-200/70'
                  : 'text-slate-700 hover:bg-brand-50'
              }`
            }
          >
            <span className="text-base">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
        {user?.role === 'admin' && (
          <>
            <div className="my-4 h-px bg-slate-200" />
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-2 py-2 mb-1">Admin</div>
          </>
        )}
      </nav>
      <div className="px-4 py-4 border-t border-white/70">
        <div className="rounded-xl bg-brand-50 border border-brand-100 p-3 text-sm text-slate-700">
          <NavLink
            to="/profile"
            className="block rounded-lg px-2 py-1.5 hover:bg-white/70 transition"
          >
            <p className="font-semibold text-brand-800">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </NavLink>
          <button
            onClick={onSignOut}
            className="mt-3 w-full btn bg-brand-600 text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
