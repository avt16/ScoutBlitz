import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './components/FireBase';
import { Analytics } from '@vercel/analytics/react';
import Login from './components/Login';
import SignUp from './components/SignUp';
import ForgotPassword from './components/ForgotPassword';
import HomePage from './components/HomePage';
import Profile from './components/Profile';
import ProgressFeed from './components/ProgressFeed';
import ScoutApp from './components/ScoutApp';

// ─── Loading splash ───────────────────────────────────────────────────────────

function LoadingSplash() {
  return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        <span className="text-gray-400 text-sm">Loading SwimBlitz…</span>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [userType, setUserType] = useState(null);   // 'Athlete' | 'Scout' | 'Coach' | null
  const [authUid,  setAuthUid]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUid(user.uid);
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) setUserType(snap.data().type || null);
        } catch (_) {}
      } else {
        setAuthUid(null);
        setUserType(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <LoadingSplash />;

  const isScout   = userType === 'Scout' || userType === 'Coach';
  const isAthlete = userType === 'Athlete';

  // ── Scout experience — completely separate product ──────────────────────────
  if (isScout && authUid) {
    return (
      <div data-theme="scout">
        <Analytics />
        <ScoutApp uid={authUid} />
      </div>
    );
  }

  // ── Athlete + public experience ─────────────────────────────────────────────
  return (
    <div data-theme="athlete">
      <BrowserRouter>
        <Analytics />
        <Routes>
          {/* Public */}
          <Route path="/"              element={<HomePage />} />
          <Route path="/login"         element={<Login setUserType={setUserType} />} />
          <Route path="/signup"        element={<SignUp />} />
          <Route path="/forgotPassword" element={<ForgotPassword />} />

          {/* Athlete-gated */}
          <Route
            path="/profile"
            element={isAthlete ? <Profile isMyProfile={true} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/profile/:userId"
            element={<Profile isMyProfile={false} />}
          />
          <Route
            path="/progress"
            element={isAthlete ? <ProgressFeed /> : <Navigate to="/login" replace />}
          />

          {/* Legacy redirects */}
          <Route path="/feed"      element={<Navigate to="/progress" replace />} />
          <Route path="/discovery" element={<Navigate to="/" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
