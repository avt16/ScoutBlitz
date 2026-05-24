import React, { useEffect, useState } from 'react';
import Header from './Header';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Waves, ShieldCheck, Search, ArrowRight } from 'lucide-react';

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-[#0B2E4E] mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function StatCard({ number, label }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-extrabold text-white mb-1">{number}</div>
      <div className="text-blue-200 text-sm">{label}</div>
    </div>
  );
}

function HomePage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F7FF] font-sans">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[#0B2E4E] py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1565C0] to-transparent" />
          </div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-[#1a4a6e] rounded-full px-4 py-1.5 text-amber-300 text-sm font-medium mb-6">
                <Waves size={14} />
                India-Exclusive Swimming Talent Network
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
                India's Hidden Swimming Talent —{' '}
                <span className="text-amber-400">Finally Visible.</span>
              </h1>
              <p className="text-blue-200 text-xl mb-10 leading-relaxed">
                Thousands of competitive Indian swimmers train without ever being seen by international scouts.
                SwimBlitz fixes that — with verified times, real benchmarks, and direct access to talent
                from every corner of India.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <button
                    onClick={() => navigate('/profile')}
                    className="px-8 py-4 bg-amber-400 text-[#0B2E4E] font-bold rounded-xl hover:bg-amber-300 transition-colors flex items-center gap-2 justify-center"
                  >
                    Go to My Profile <ArrowRight size={18} />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/signup')}
                      className="px-8 py-4 bg-amber-400 text-[#0B2E4E] font-bold rounded-xl hover:bg-amber-300 transition-colors"
                    >
                      I'm a Swimmer
                    </button>
                    <button
                      onClick={() => navigate('/signup')}
                      className="px-8 py-4 bg-transparent border-2 border-blue-300 text-white font-bold rounded-xl hover:bg-[#1a4a6e] transition-colors"
                    >
                      I'm a Scout / Coach
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="bg-[#1565C0] py-10">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCard number="28" label="Indian States Covered" />
              <StatCard number="100%" label="Verified Times Only" />
              <StatCard number="3" label="Scouting Benchmarks" />
              <StatCard number="Free" label="For Athletes — Always" />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-[#F0F7FF]">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-[#0B2E4E] mb-4">
                Built for real scouting. Built for real athletes.
              </h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                Every feature is designed around two questions: can a scout trust this data, and can a swimmer from Jharkhand get seen by a D1 program?
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureCard
                icon={
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="text-[#1565C0]" size={24} />
                  </div>
                }
                title="Verified Times — Not Self-Reported"
                description="Every submitted time is either coach-verified or backed by an official meet result. Unverified times are visually flagged so scouts always know what they're looking at."
              />
              <FeatureCard
                icon={
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <span className="text-amber-600 text-xl font-bold">≡</span>
                  </div>
                }
                title="Auto-Benchmarked Against Global Standards"
                description="Swimmers see exactly how their times compare to Indian National standards, European club recruitment thresholds, and NCAA D1 scholarship targets — in real time."
              />
              <FeatureCard
                icon={
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Search className="text-green-700" size={24} />
                  </div>
                }
                title="Scout Dashboard Built for Recruiters"
                description="Filter by event, time range, age, gender, and region. Shortlist athletes. Message directly. Every card shows verification status and regional context at a glance."
              />
            </div>
          </div>
        </section>

        {/* Underserved angle */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <div className="bg-[#0B2E4E] rounded-2xl p-8 text-white">
                <div className="text-amber-400 text-sm font-semibold uppercase tracking-wide mb-3">
                  The Underserved Talent Problem
                </div>
                <h3 className="text-3xl font-extrabold mb-4">States like UP, Bihar, and Jharkhand have Olympic-calibre swimmers — no one has found them yet.</h3>
                <p className="text-blue-200 leading-relaxed mb-4">
                  Traditional scouting concentrates on Maharashtra, Karnataka, and Delhi — states with established infrastructure. SwimBlitz explicitly surfaces talent from underrepresented states and grassroots clubs.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {['Uttar Pradesh', 'Bihar', 'Jharkhand', 'Odisha', 'Assam'].map((s) => (
                    <span key={s} className="bg-amber-400 text-[#0B2E4E] text-xs font-bold px-3 py-1 rounded-full">
                      {s}
                    </span>
                  ))}
                  <span className="text-blue-300 text-xs py-1 px-2">+ 11 more regions</span>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 space-y-4">
              <h2 className="text-3xl font-extrabold text-[#0B2E4E]">Why SwimBlitz?</h2>
              <p className="text-gray-600 leading-relaxed">
                Raw talent and a fast time aren't enough — you need to be seen. Across India, competitive swimmers train in small clubs, qualify for state meets, and swim times that would earn serious interest from international coaches. They just never get in front of those coaches.
              </p>
              <p className="text-gray-600 leading-relaxed">
                SwimBlitz is the bridge. Verified profiles. Transparent benchmarks. A scout dashboard that makes geography irrelevant.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => navigate(user ? '/profile' : '/signup')}
                  className="px-6 py-3 bg-[#0B2E4E] text-white font-semibold rounded-xl hover:bg-[#0d3a5c] transition-colors"
                >
                  {user ? 'View My Profile' : 'Create Athlete Profile'}
                </button>
                <button
                  onClick={() => navigate('/discovery')}
                  className="px-6 py-3 border-2 border-[#0B2E4E] text-[#0B2E4E] font-semibold rounded-xl hover:bg-blue-50 transition-colors"
                >
                  Scout Dashboard
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-[#0B2E4E] text-white text-center">
          <div className="container mx-auto px-6 max-w-2xl">
            <Waves size={40} className="text-amber-400 mx-auto mb-4" />
            <h2 className="text-4xl font-extrabold mb-4">Every fast swimmer deserves to be found.</h2>
            <p className="text-blue-200 mb-8 text-lg">
              Join SwimBlitz. Build your verified profile. Get in front of international scouts — from wherever you are in India.
            </p>
            {user ? (
              <button
                onClick={() => navigate('/profile')}
                className="px-8 py-4 bg-amber-400 text-[#0B2E4E] font-bold rounded-xl hover:bg-amber-300 transition-colors"
              >
                Go to My Profile
              </button>
            ) : (
              <button
                onClick={() => navigate('/signup')}
                className="px-8 py-4 bg-amber-400 text-[#0B2E4E] font-bold rounded-xl hover:bg-amber-300 transition-colors"
              >
                Get Started — It's Free
              </button>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-[#071e32] text-white py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-amber-400 rounded-lg p-1">
              <Waves size={16} className="text-[#0B2E4E]" />
            </div>
            <span className="font-bold">SwimBlitz</span>
            <span className="text-blue-400 text-sm">· India's Swimming Talent Network</span>
          </div>
          <p className="text-blue-400 text-sm">&copy; {new Date().getFullYear()} SwimBlitz. All rights reserved.</p>
          <nav className="flex gap-6 text-sm text-blue-400">
            <a href="/about" className="hover:text-white transition">About</a>
            <a href="/contact" className="hover:text-white transition">Contact</a>
            <a href="/privacy" className="hover:text-white transition">Privacy</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
