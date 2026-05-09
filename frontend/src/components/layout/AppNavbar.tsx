import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const NAV = [
  { to: '/dashboard',       label: 'Dashboard' },
  { to: '/upload',          label: 'Upload' },
  { to: '/transactions',    label: 'Transactions' },
  { to: '/recommendations', label: 'AI Tips' },
  { to: '/rules',           label: 'Rules' },
];

export default function AppNavbar() {
  const { logout, getUser } = useAuth();
  const { pathname } = useLocation();
  const user = getUser();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-3
                    bg-[#070711]/90 backdrop-blur border-b border-purple-900/30">
      <Link to="/dashboard" className="text-lg font-bold gradient-text">FinSight</Link>

      <div className="flex items-center gap-1">
        {NAV.map(({ to, label }) => (
          <Link key={to} to={to}
            className={`px-4 py-2 rounded-lg text-sm transition-colors
              ${pathname === to
                ? 'bg-purple-600/20 text-purple-300'
                : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            {label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">{user?.name}</span>
        <button onClick={logout}
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-gray-700
                     hover:border-gray-500 rounded-lg transition-colors">
          Logout
        </button>
      </div>
    </nav>
  );
}
