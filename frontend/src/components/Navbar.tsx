import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useIsMobile } from '../hooks/useIsMobile';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/goals', label: 'Goals' },
  { to: '/book', label: 'Book' },
  { to: '/professionals', label: 'Pros' },
  { to: '/resources', label: 'Resources' },
  { to: '/wellness', label: 'Wellness' },
  { to: '/profile', label: 'Profile' }
];

export default function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <header className="border-b border-white/60 bg-white/70 backdrop-blur-xl sticky top-0 z-30 shadow-[0_10px_40px_-24px_rgba(15,23,42,0.45)]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-brand-700 font-semibold tracking-wide uppercase">MindConnect</p>
          <h1 className="text-lg md:text-xl font-bold text-slate-900">Hi {user?.name.split(' ')[0]}, keep moving forward</h1>
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
          className="text-sm font-semibold text-brand-700 hover:text-brand-900 px-3 py-2 rounded-lg border border-brand-100 bg-white shadow-sm"
        >
          Logout
        </button>
      </div>
      <nav className={`max-w-6xl mx-auto px-4 pb-3 flex ${isMobile ? 'gap-2 overflow-x-auto' : 'gap-3'} text-sm font-semibold text-slate-700`}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `px-3 py-2 rounded-xl border ${isActive ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-200/70' : 'bg-white/80 backdrop-blur border-white/70 text-slate-700 hover:border-brand-200 hover:text-brand-700'} transition`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
