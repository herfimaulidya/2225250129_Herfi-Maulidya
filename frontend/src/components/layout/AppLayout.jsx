import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Crown, FlaskConical, Gamepad2, Home, LogOut, Map, Swords, Trophy, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../art/Logo';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: Home, end: true },
  { to: '/app/map', label: 'Peta', icon: Map },
  { to: '/app/lab', label: 'Math Lab', icon: FlaskConical },
  { to: '/app/training', label: 'Training', icon: Swords },
  { to: '/app/games', label: 'Games', icon: Gamepad2 },
  { to: '/app/final', label: 'Final Quest', icon: Crown },
  { to: '/app/achievements', label: 'Lencana', icon: Trophy },
];

// Navigasi bawah di ponsel dibuat ringkas (5 tujuan utama) agar tidak membebani.
const MOBILE = ['/app', '/app/map', '/app/training', '/app/games', '/app/profile'];

export default function AppLayout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const doLogout = async () => {
    setBusy(true);
    await logout();
    navigate('/login', { replace: true });
  };

  const linkCls = ({ isActive }) =>
    `flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-bold transition ${isActive ? 'bg-royal-purple text-white' : 'text-royal-plum/80 hover:bg-royal-lavender/50'}`;

  const mobileItems = [...NAV, { to: '/app/profile', label: 'Profil', icon: User }].filter((n) => MOBILE.includes(n.to));

  return (
    <div className="min-h-dvh pb-24 lg:pb-10">
      <header className="sticky top-0 z-30 border-b border-royal-lavender/60 bg-royal-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <Link to="/app" aria-label="Dashboard"><Logo /></Link>
          <nav className="ml-2 hidden flex-1 items-center gap-0.5 lg:flex" aria-label="Navigasi utama">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={linkCls}><Icon size={16} />{label}</NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <NavLink to="/app/profile" className={linkCls} title="My Royal Profile">
              <User size={16} /><span className="hidden max-w-[10rem] truncate sm:inline lg:hidden 2xl:inline">{profile?.full_name}</span>
            </NavLink>
            <button onClick={doLogout} disabled={busy} className="btn-soft !min-h-[40px] !px-3" aria-label="Keluar">
              <LogOut size={16} /><span className="hidden sm:inline lg:hidden 2xl:inline">{busy ? 'Keluar...' : 'Keluar'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-royal-lavender bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Navigasi ponsel">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {mobileItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${isActive ? 'text-royal-purple' : 'text-royal-plum/55'}`}>
              {({ isActive }) => (
                <>
                  <span className={`grid h-8 w-12 place-items-center rounded-full ${isActive ? 'bg-royal-lavender' : ''}`}><Icon size={19} /></span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
