import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Search, LogOut, Waves, TrendingUp } from 'lucide-react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { db } from './FireBase';
import { useUserContext } from '../context/UserContext';

function Header() {
  const [search,        setSearch]        = useState('');
  const [showResults,   setShowResults]   = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const { userType } = useUserContext();
  const navigate = useNavigate();
  const auth     = getAuth();

  // Debounced swimmer search
  useEffect(() => {
    const run = async () => {
      if (!search.trim()) { setShowResults(false); setSearchResults([]); return; }
      try {
        const q = query(
          collection(db, 'users'),
          where('name', '>=', search),
          where('name', '<=', search + ''),
        );
        const snap = await getDocs(q);
        setSearchResults(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setShowResults(true);
      } catch (_) {
        setSearchResults([]);
      }
    };
    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleLogout = async () => {
    try { await signOut(auth); } catch (_) {}
    navigate('/login');
  };

  const handleSelectUser = (uid) => {
    navigate(`/profile/${uid}`);
    setShowResults(false);
    setSearch('');
  };

  const isAthlete = userType === 'Athlete';

  return (
    <div>
      <header className="sticky top-0 z-50 bg-[#0B2E4E] shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer group shrink-0"
            onClick={() => navigate('/')}
          >
            <div className="bg-amber-400 rounded-lg p-1.5 group-hover:bg-amber-300 transition-colors">
              <Waves size={20} className="text-[#0B2E4E]" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">SwimBlitz</span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-lg relative">
            <input
              type="text"
              placeholder="Search swimmers by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => setTimeout(() => setShowResults(false), 150)}
              className="w-full rounded-lg bg-[#1a4a6e] text-white placeholder-blue-300 py-2 pl-10 pr-4 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all"
            />
            <Search size={18} className="absolute left-3 top-2.5 text-blue-300 pointer-events-none" />
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1 shrink-0">
            {/* My Progress — athletes only */}
            {isAthlete && (
              <button
                onClick={() => navigate('/progress')}
                className="px-3 py-2 text-sm font-medium text-blue-100 hover:text-white hover:bg-[#1a4a6e] rounded-lg transition-all flex items-center gap-1.5"
              >
                <TrendingUp size={16} />
                My Progress
              </button>
            )}

            <button
              onClick={() => navigate('/profile')}
              className="p-2 rounded-lg text-blue-100 hover:text-white hover:bg-[#1a4a6e] transition-all"
              title="My Profile"
            >
              <User size={20} />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-blue-100 hover:text-white hover:bg-[#1a4a6e] transition-all"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
          </nav>
        </div>

        {/* Search results dropdown */}
        {showResults && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 w-full max-w-md bg-white shadow-xl rounded-xl p-3 z-50 border border-blue-100 mx-4">
            <div className="text-xs font-semibold text-[#0B2E4E] mb-2">Search Results</div>
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 hover:bg-blue-50 rounded-lg cursor-pointer transition-all"
                  onMouseDown={() => handleSelectUser(user.uid || user.id)}
                >
                  <div className="bg-[#0B2E4E] h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.type} · {user.state || 'India'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-400 py-1">No swimmers found</div>
            )}
          </div>
        )}
      </header>
    </div>
  );
}

export default Header;
