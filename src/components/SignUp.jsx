import React, { useState } from 'react';
import { auth, db } from './FireBase';
import { useNavigate, Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { Waves, ShieldCheck, ArrowLeft } from 'lucide-react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { query, getDocs, collection, where, setDoc, doc, serverTimestamp } from 'firebase/firestore';

// ─── Scout confirmation panel ─────────────────────────────────────────────────

function ScoutConfirmPanel({ onConfirm, onBack }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-5 transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="bg-[#0B2E4E]/10 rounded-xl p-2.5">
          <ShieldCheck size={22} className="text-[#0B2E4E]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#0B2E4E]">Scout Account</h2>
          <p className="text-sm text-gray-400">Please read before continuing</p>
        </div>
      </div>

      <div className="space-y-3 mb-6 text-sm text-gray-600">
        <div className="bg-blue-50 rounded-xl p-4 space-y-2">
          <p className="font-semibold text-[#0B2E4E] text-sm">What Scout accounts include:</p>
          <ul className="space-y-1 text-sm text-gray-600">
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Full access to athlete profiles and verified swim times</li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Named shortlists with comparison tables</li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Private notes on any athlete (only visible to you)</li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Filter by event, state, age, and verification level</li>
          </ul>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 space-y-1">
          <p className="font-semibold text-amber-800 text-sm">What Scout accounts do not include:</p>
          <ul className="space-y-1 text-sm text-amber-700">
            <li className="flex items-start gap-2"><span className="mt-0.5">–</span> Your own swimmer profile or personal benchmarks</li>
            <li className="flex items-start gap-2"><span className="mt-0.5">–</span> Messaging athletes directly through the platform</li>
          </ul>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer mb-6">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[#0B2E4E]"
        />
        <span className="text-sm text-gray-600">
          I confirm I am creating a Scout/Coach account for talent discovery purposes, and I agree to handle athlete data responsibly.
        </span>
      </label>

      <button
        type="button"
        disabled={!agreed}
        onClick={onConfirm}
        className="w-full bg-[#0B2E4E] text-white py-2.5 rounded-lg font-semibold hover:bg-[#0d3a5c] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Confirm & Create Scout Account
      </button>
    </div>
  );
}

// ─── SignUp ───────────────────────────────────────────────────────────────────

function SignUp({ setUserType }) {
  const [email,            setEmail]            = useState('');
  const [password,         setPassword]         = useState('');
  const [name,             setName]             = useState('');
  const [type,             setType]             = useState('Athlete');
  const [showScoutConfirm,  setShowScoutConfirm]  = useState(false);
  const [pendingGoogleSignup, setPendingGoogleSignup] = useState(false);
  const [loading,           setLoading]           = useState(false);
  const navigate      = useNavigate();
  const googleProvider = new GoogleAuthProvider();

  const createAccount = async () => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const user = res.user;
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        authProvider: 'local',
        email,
        type,
        createdAt: serverTimestamp(),
      });
      if (setUserType) setUserType(type);
      if (type !== 'Scout' && type !== 'Coach') {
        navigate('/profile');
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert('Please fill in all fields.');
      return;
    }
    if (type === 'Scout' || type === 'Coach') {
      setShowScoutConfirm(true);
    } else {
      createAccount();
    }
  };

  const signUpWithGoogle = async () => {
    if (type === 'Scout' || type === 'Coach') {
      setPendingGoogleSignup(true);
      setShowScoutConfirm(true);
      return;
    }
    await runGoogleSignup();
  };

  const runGoogleSignup = async () => {
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      const q = query(collection(db, 'users'), where('uid', '==', user.uid));
      const docs = await getDocs(q);
      if (docs.docs.length === 0) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: user.displayName || '',
          authProvider: 'google',
          email: user.email,
          type,
          createdAt: serverTimestamp(),
        });
      }
      if (setUserType) setUserType(type);
      if (type !== 'Scout' && type !== 'Coach') {
        navigate('/profile');
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
      setLoading(false);
    }
  };

  // Scout confirmation confirmed — branch on whether it was Google or email/password
  const handleScoutConfirmed = () => {
    setShowScoutConfirm(false);
    if (pendingGoogleSignup) {
      setPendingGoogleSignup(false);
      runGoogleSignup();
    } else {
      createAccount();
    }
  };

  if (showScoutConfirm) {
    return (
      <div className="min-h-screen bg-[#0B2E4E] flex items-center justify-center px-4">
        <ScoutConfirmPanel
          onConfirm={handleScoutConfirmed}
          onBack={() => setShowScoutConfirm(false)}
        />
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold text-[#0B2E4E] mb-1">Create your account</h2>
          <p className="text-gray-500 text-sm mb-6">
            Join the platform connecting Indian swimming talent with the world.
          </p>

          {/* Role selection */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">I am joining as</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'Athlete', emoji: '🏊', title: 'Swimmer / Athlete', sub: 'Build your profile, get discovered' },
                { value: 'Scout',   emoji: '🔍', title: 'Scout / Coach',     sub: 'Discover and recruit talent' },
              ].map(({ value, emoji, title, sub }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    type === value
                      ? 'border-[#0B2E4E] bg-blue-50'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="text-lg mb-0.5">{emoji}</div>
                  <div className={`text-sm font-semibold ${type === value ? 'text-[#0B2E4E]' : 'text-gray-700'}`}>
                    {title}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2E4E] bg-gray-50"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2E4E] bg-gray-50"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2E4E] bg-gray-50"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            className="w-full bg-[#0B2E4E] text-white py-2.5 rounded-lg font-semibold hover:bg-[#0d3a5c] transition-colors mb-3 disabled:opacity-60"
            onClick={handleCreateClick}
          >
            {loading ? 'Creating account…' : (type === 'Scout' || type === 'Coach') ? 'Continue →' : 'Create Account'}
          </button>

          <button
            type="button"
            disabled={loading}
            className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            onClick={signUpWithGoogle}
          >
            <FcGoogle size={18} />
            Continue with Google
          </button>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-[#0B2E4E] font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
