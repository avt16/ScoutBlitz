import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, TrendingUp, LogOut } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { useUserContext } from '../context/UserContext';

/**
 * Mobile-only bottom tab bar (md:hidden). India is overwhelmingly mobile —
 * one-handed reach for primary navigation matters. Desktop continues to use
 * the existing top Header.
 *
 * Tab set is computed from userType:
 *   - Athletes: Home · Profile · Progress · Logout
 *   - Unauthenticated visitors / scouts on public pages: Home · Login
 *     (scouts get the entire ScoutApp UI instead — this bar doesn't render)
 */
export default function BottomTabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { userType } = useUserContext();
  const auth = getAuth();

  const isAthlete = userType === 'Athlete';
  // Don't show the bar on the public marketing routes — only inside the app
  const hideOnPaths = ['/login', '/signup', '/forgotPassword'];
  if (hideOnPaths.some((p) => pathname.startsWith(p))) return null;
  // Coach verification page is its own thing
  if (pathname.startsWith('/verify/')) return null;

  const handleLogout = async () => {
    try { await signOut(auth); } catch (_) {}
    navigate('/login');
  };

  const tabs = isAthlete
    ? [
        { icon: Home,       label: 'Home',     onClick: () => navigate('/'),         match: (p) => p === '/' },
        { icon: User,       label: 'Profile',  onClick: () => navigate('/profile'),  match: (p) => p.startsWith('/profile') },
        { icon: TrendingUp, label: 'Progress', onClick: () => navigate('/progress'), match: (p) => p.startsWith('/progress') },
        { icon: LogOut,     label: 'Logout',   onClick: handleLogout,                match: () => false },
      ]
    : [
        { icon: Home,       label: 'Home',     onClick: () => navigate('/'),         match: (p) => p === '/' },
        { icon: User,       label: 'Log in',   onClick: () => navigate('/login'),    match: (p) => p.startsWith('/login') },
      ];

  return (
    <>
      {/* Spacer so content above doesn't get hidden under the bar */}
      <div className="h-16 md:hidden" />
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0B2E4E] border-t border-[#1a4a6e] flex items-stretch">
        {tabs.map(({ icon: Icon, label, onClick, match }) => {
          const active = match(pathname);
          return (
            <button
              key={label}
              onClick={onClick}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                active ? 'text-amber-400' : 'text-blue-200 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
