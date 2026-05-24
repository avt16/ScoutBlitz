import React, { useState } from 'react';
import { auth } from './FireBase';
import { useNavigate, Link } from 'react-router-dom';
import { db } from './FireBase';
import { FcGoogle } from 'react-icons/fc';
import { Waves } from 'lucide-react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { query, getDocs, collection, where, setDoc, doc } from 'firebase/firestore';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Athlete');
  const navigate = useNavigate();
  const googleProvider = new GoogleAuthProvider();

  const registerWithEmailAndPassword = async (name, email, password) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const user = res.user;
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        authProvider: 'local',
        email,
        type,
      });
      navigate('/');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const signUpWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      const q = query(collection(db, 'users'), where('uid', '==', user.uid));
      const docs = await getDocs(q);
      if (docs.docs.length === 0) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: user.displayName,
          authProvider: 'google',
          email: user.email,
          type,
        });
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      alert(err.message);
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
          <h2 className="text-2xl font-bold text-[#0B2E4E] mb-1">Create your account</h2>
          <p className="text-gray-500 text-sm mb-6">Join the platform connecting Indian swimming talent with the world.</p>

          {/* Role Selection */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">I am joining as</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('Athlete')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  type === 'Athlete'
                    ? 'border-[#0B2E4E] bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
              >
                <div className="text-lg mb-0.5">🏊</div>
                <div className={`text-sm font-semibold ${type === 'Athlete' ? 'text-[#0B2E4E]' : 'text-gray-700'}`}>
                  Swimmer / Athlete
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Build your profile, get discovered</div>
              </button>
              <button
                type="button"
                onClick={() => setType('Scout')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  type === 'Scout'
                    ? 'border-[#0B2E4E] bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
              >
                <div className="text-lg mb-0.5">🔍</div>
                <div className={`text-sm font-semibold ${type === 'Scout' ? 'text-[#0B2E4E]' : 'text-gray-700'}`}>
                  Scout / Coach
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Discover and recruit talent</div>
              </button>
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
            className="w-full bg-[#0B2E4E] text-white py-2.5 rounded-lg font-semibold hover:bg-[#0d3a5c] transition-colors mb-3"
            onClick={() => registerWithEmailAndPassword(name, email, password)}
          >
            Create Account
          </button>

          <button
            type="button"
            className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
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
