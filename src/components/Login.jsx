import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Waves } from 'lucide-react';
import { auth, db } from './FireBase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, query, getDocs, collection, where, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

function Login({ setUserType }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate   = useNavigate();
  const googleProvider = new GoogleAuthProvider();

  // After auth resolves, read the user's type from Firestore and route accordingly
  const routeByType = async (uid) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      const type = snap.exists() ? snap.data().type : 'Athlete';
      if (setUserType) setUserType(type);
      if (type === 'Scout' || type === 'Coach') {
        // App.jsx will handle re-rendering ScoutApp once userType updates;
        // a hard reload is the simplest way to trigger it cleanly.
        window.location.href = '/';
      } else {
        navigate('/profile');
      }
    } catch (_) {
      navigate('/profile');
    }
  };

  const logInWithEmailAndPassword = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      await routeByType(res.user.uid);
    } catch (err) {
      console.error(err);
      alert(err.message);
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      // If no Firestore doc exists yet, create one as Athlete
      const q = query(collection(db, 'users'), where('uid', '==', user.uid));
      const docs = await getDocs(q);
      if (docs.docs.length === 0) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: user.displayName || '',
          authProvider: 'google',
          email: user.email,
          type: 'Athlete',
        });
        if (setUserType) setUserType('Athlete');
        navigate('/profile');
      } else {
        await routeByType(user.uid);
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B2E4E] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="bg-amber-400 rounded-xl p-2">
              <Waves size={28} className="text-[#0B2E4E]" />
            </div>
            <span className="text-3xl font-bold text-white">SwimBlitz</span>
          </div>
          <p className="text-blue-300 text-sm">India's Swimming Talent Network</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-[#0B2E4E] mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#0B2E4E] font-semibold hover:underline">
              Sign up
            </Link>
          </p>

          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2E4E] bg-gray-50"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && logInWithEmailAndPassword()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2E4E] bg-gray-50"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && logInWithEmailAndPassword()}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            className="w-full bg-[#0B2E4E] text-white py-2.5 rounded-lg font-semibold hover:bg-[#0d3a5c] transition-colors mb-3 disabled:opacity-60"
            onClick={logInWithEmailAndPassword}
          >
            {loading ? 'Signing in…' : 'Log In'}
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-xs">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            type="button"
            disabled={loading}
            className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            onClick={signInWithGoogle}
          >
            <FcGoogle size={18} />
            Continue with Google
          </button>

          <div className="text-center mt-5">
            <button
              className="text-sm text-gray-400 hover:underline"
              onClick={() => navigate('/forgotPassword')}
            >
              Forgot password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
