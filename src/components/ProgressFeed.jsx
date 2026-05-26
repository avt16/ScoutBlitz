import React, { useState, useEffect, useMemo } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './FireBase';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Shield, Trophy, Eye, Lightbulb, TrendingUp, Waves, ArrowRight, AlertCircle } from 'lucide-react';
import {
  SWIM_EVENTS, SWIM_EVENT_FIELDS, BENCHMARKS,
  parseTime, fmtSecs, formatTime, getVerificationLevel,
} from '../data/swimData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BENCHMARK_TIERS = [
  { key: 'nationalB',    label: 'Indian National B' },
  { key: 'nationalA',    label: 'Indian National A' },
  { key: 'europeanClub', label: 'European Club'     },
  { key: 'd1NCAA',       label: 'D1 NCAA (USA)'     },
];

function computeNextPrompt(profile) {
  const { primaryEvent, gender, bio, competitionHistory, verifications } = profile;

  if (!primaryEvent) {
    return {
      icon: <TrendingUp size={18} className="text-amber-600" />,
      message: 'Set your primary event to unlock benchmark tracking and get discovered by event-specific scouts.',
      cta: 'Edit Profile',
      href: '/profile',
    };
  }

  const primaryField = SWIM_EVENT_FIELDS[primaryEvent];
  const primaryTime  = primaryField ? profile[primaryField]?.trim() : null;

  // Unverified primary time — highest priority
  if (primaryTime) {
    const verifStatus = verifications?.[primaryField]?.status;
    if (!verifStatus) {
      return {
        icon: <ShieldCheck size={18} className="text-amber-600" />,
        message: `Your ${primaryEvent} time is unverified — ask your coach to verify it to get more scout visibility.`,
        cta: 'Update My Times',
        href: '/profile',
      };
    }
  }

  // Close to a benchmark
  if (primaryTime && BENCHMARKS[primaryEvent]) {
    const gk = gender === 'Female' ? 'female' : 'male';
    const bm = BENCHMARKS[primaryEvent]?.[gk];
    if (bm) {
      const secs = parseTime(primaryTime);
      for (const { key, label } of BENCHMARK_TIERS) {
        const diff = secs - bm[key];
        if (diff > 0 && diff <= 3.0) {
          return {
            icon: <TrendingUp size={18} className="text-amber-600" />,
            message: `You're ${diff.toFixed(2)}s away from the ${label} standard in ${primaryEvent}. Keep pushing.`,
            cta: 'Update My Times',
            href: '/profile',
          };
        }
      }
    }
  }

  // No competition history
  if (!competitionHistory?.length) {
    return {
      icon: <Trophy size={18} className="text-amber-600" />,
      message: 'Log your first competition result — scouts want to see meet experience, not just training times.',
      cta: 'Add Competition Result',
      href: '/profile',
    };
  }

  // No bio
  if (!bio?.trim()) {
    return {
      icon: <Lightbulb size={18} className="text-amber-600" />,
      message: 'Add a short bio — scouts want to see your goals and training context alongside your times.',
      cta: 'Edit Profile',
      href: '/profile',
    };
  }

  return {
    icon: <Waves size={18} className="text-amber-600" />,
    message: 'Your profile is looking strong. Make sure all times are verified to maximise scout visibility.',
    cta: 'Review Profile',
    href: '/profile',
  };
}

function generateFeedEntries(profile) {
  const entries = [];

  // Swim time entries
  for (const { label, field } of SWIM_EVENTS) {
    const time = profile[field]?.trim();
    if (!time) continue;

    const verifStatus = profile.verifications?.[field]?.status;
    const meetName    = profile.verifications?.[field]?.meetName;
    const gk          = profile.gender === 'Female' ? 'female' : 'male';
    const bm          = BENCHMARKS[label]?.[gk];
    const secs        = parseTime(time);

    // Benchmark crossing entries (highest priority)
    if (bm && secs) {
      for (const { key, label: bmLabel } of BENCHMARK_TIERS) {
        if (secs <= bm[key]) {
          entries.push({
            id:        `bm_${field}_${key}`,
            type:      'benchmark',
            event:     label,
            time,
            tier:      bmLabel,
            tierKey:   key,
            gender:    profile.gender,
            timestamp: null,
            priority:  1,
          });
          break; // show only the highest achieved tier
        }
      }
    }

    // Time log entry
    entries.push({
      id:         `time_${field}`,
      type:       'time',
      event:      label,
      time,
      verifStatus: verifStatus || null,
      meetName:   meetName || null,
      timestamp:  null,
      priority:   2,
    });
  }

  // Competition history entries
  for (const comp of profile.competitionHistory || []) {
    entries.push({
      id:        `comp_${comp.id}`,
      type:      'competition',
      meetName:  comp.meetName,
      date:      comp.date,
      event:     comp.event,
      placing:   comp.placing,
      time:      comp.time,
      timestamp: comp.date ? new Date(comp.date) : null,
      priority:  3,
    });
  }

  // Profile view events
  for (const ts of profile.profileViewEvents || []) {
    entries.push({
      id:        `view_${ts}`,
      type:      'view',
      timestamp: new Date(ts),
      priority:  4,
    });
  }

  // Sort: competitions/views by real timestamp (newest first), then times/benchmarks
  entries.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
    if (a.timestamp) return -1;
    if (b.timestamp) return 1;
    return 0;
  });

  return entries;
}

// ─── Card components ──────────────────────────────────────────────────────────

function BenchmarkMiniPanel({ event, time, tierKey, gender }) {
  if (!BENCHMARKS[event]) return null;
  const gk  = gender === 'Female' ? 'female' : 'male';
  const bm  = BENCHMARKS[event][gk];
  const keys = ['nationalB', 'nationalA', 'europeanClub', 'd1NCAA'];
  const labels = ['Ind. National B', 'Ind. National A', 'European Club', 'D1 NCAA'];
  const secs = parseTime(time);

  return (
    <div className="mt-3 grid grid-cols-4 gap-1.5">
      {keys.map((k, i) => {
        const achieved = secs && secs <= bm[k];
        const isActive = k === tierKey;
        return (
          <div key={k} className={`rounded-lg p-2 text-center text-xs ${achieved ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-400'} ${isActive ? 'ring-2 ring-green-400' : ''}`}>
            <div className="font-medium leading-tight">{labels[i]}</div>
            <div className="font-bold mt-0.5">{fmtSecs(bm[k])}</div>
            {achieved && <div className="text-[10px] mt-0.5 font-bold">✓</div>}
          </div>
        );
      })}
    </div>
  );
}

function TimeEntry({ entry, onUpdate }) {
  const verifColors = {
    meet:  { bg: 'bg-green-100', text: 'text-green-700', icon: <ShieldCheck size={12} /> },
    coach: { bg: 'bg-blue-100',  text: 'text-blue-700',  icon: <Shield size={12} />      },
    null:  { bg: 'bg-gray-100',  text: 'text-gray-500',  icon: <AlertCircle size={12} /> },
  };
  const vc = verifColors[entry.verifStatus] || verifColors[null];

  return (
    <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="bg-[#1565C0] bg-opacity-10 rounded-xl p-2.5 shrink-0">
          <Waves size={18} className="text-[#1565C0]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-800">
              You logged a time in <span className="font-bold text-[#0B2E4E]">{entry.event}</span>
            </p>
            <span className={`inline-flex items-center gap-1 ${vc.bg} ${vc.text} text-xs font-semibold px-2 py-0.5 rounded-full shrink-0`}>
              {vc.icon}
              {entry.verifStatus === 'meet' ? 'Meet Verified' : entry.verifStatus === 'coach' ? 'Coach Verified' : 'Unverified'}
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#0B2E4E] mt-1">{formatTime(entry.time)}</div>
          {entry.meetName && <div className="text-xs text-gray-400 mt-0.5">Source: {entry.meetName}</div>}
        </div>
      </div>
      <button onClick={onUpdate} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#1565C0] hover:text-[#0B2E4E] transition-colors">
        Update my times <ArrowRight size={12} />
      </button>
    </div>
  );
}

function BenchmarkEntry({ entry, onUpdate }) {
  const tierColors = {
    nationalB:    'bg-amber-100 text-amber-700',
    nationalA:    'bg-blue-100 text-blue-700',
    europeanClub: 'bg-indigo-100 text-indigo-700',
    d1NCAA:       'bg-green-100 text-green-700',
  };

  return (
    <div className="bg-white border border-green-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="bg-green-100 rounded-xl p-2.5 shrink-0">
          <TrendingUp size={18} className="text-green-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-[#0B2E4E]">Benchmark Crossed 🎉</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tierColors[entry.tierKey] || 'bg-gray-100 text-gray-600'}`}>
              {entry.tier}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            You cleared the <strong>{entry.tier}</strong> standard in <strong>{entry.event}</strong> with <strong>{formatTime(entry.time)}</strong>
          </p>
          <BenchmarkMiniPanel event={entry.event} time={entry.time} tierKey={entry.tierKey} gender={entry.gender} />
        </div>
      </div>
      <button onClick={onUpdate} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#1565C0] hover:text-[#0B2E4E] transition-colors">
        Update my times <ArrowRight size={12} />
      </button>
    </div>
  );
}

const PLACE_COLORS = {
  '1st': 'bg-amber-100 text-amber-700',
  '2nd': 'bg-gray-100 text-gray-600',
  '3rd': 'bg-orange-100 text-orange-600',
};

function CompetitionEntry({ entry, onUpdate }) {
  const placeColor = PLACE_COLORS[entry.placing] ?? 'bg-orange-100 text-orange-600';

  return (
    <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="bg-amber-100 rounded-xl p-2.5 shrink-0">
          <Trophy size={18} className="text-amber-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-[#0B2E4E]">Competition Result</p>
            {entry.placing && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${placeColor}`}>{entry.placing}</span>
            )}
            {entry.date && (
              <span className="text-xs text-gray-400">{new Date(entry.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {entry.placing ? `You placed ${entry.placing} at ` : 'You competed at '}
            <strong>{entry.meetName}</strong> in <strong>{entry.event}</strong>
            {entry.time && <> — <strong>{formatTime(entry.time)}</strong></>}
          </p>
        </div>
      </div>
      <button onClick={onUpdate} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#1565C0] hover:text-[#0B2E4E] transition-colors">
        Update my times <ArrowRight size={12} />
      </button>
    </div>
  );
}

function ViewEntry({ entry }) {
  const relTime = entry.timestamp
    ? (() => {
        const diffMs  = Date.now() - entry.timestamp.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}h ago`;
        return `${Math.floor(diffHr / 24)}d ago`;
      })()
    : 'Recently';

  return (
    <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="bg-indigo-100 rounded-xl p-2.5 shrink-0">
          <Eye size={18} className="text-indigo-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-[#0B2E4E]">Scout Interest</p>
            <span className="text-xs text-gray-400">{relTime}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">A scout viewed your profile. Your times are being seen.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProgressFeed() {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  useEffect(() => {
    const auth  = getAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          const data = snap.exists() ? snap.data() : {};
          if (data.type === 'Scout' || data.type === 'Coach') {
            setLoading(false);
            navigate('/');
            return;
          }
          setProfile(data);
        } catch {
          setProfile({});
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // All useMemo hooks MUST come before any early returns to satisfy Rules of Hooks.
  // The null checks handle the loading/unauthenticated states.
  const entries           = useMemo(() => profile ? generateFeedEntries(profile) : [], [profile]);
  const prompt            = useMemo(() => profile ? computeNextPrompt(profile)   : null, [profile]);
  const enteredTimesCount = useMemo(
    () => profile ? SWIM_EVENTS.filter((e) => profile[e.field]?.trim()).length : 0,
    [profile],
  );
  // Compute "viewed this week" from the event log — accurate, no rollover needed
  const viewsThisWeek = useMemo(() => {
    if (!profile?.profileViewEvents?.length) return 0;
    const now = new Date();
    const wk = isoWeekNum(now);
    const yr = now.getFullYear();
    return profile.profileViewEvents.filter((ts) => {
      const d = new Date(ts);
      return isoWeekNum(d) === wk && d.getFullYear() === yr;
    }).length;
  }, [profile]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F0F7FF]">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[#0B2E4E] text-sm">Loading your progress...</div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F0F7FF]">
        <Header />
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <Waves size={40} className="text-[#0B2E4E]" />
          <p className="text-gray-600">Please log in to view your progress.</p>
          <button onClick={() => navigate('/login')} className="px-5 py-2 bg-[#0B2E4E] text-white rounded-lg text-sm">Log In</button>
        </div>
      </div>
    );
  }

  const completionCriteria = [
    {
      label: 'Add a profile photo',
      met: Boolean(profile.profile_pic),
    },
    {
      label: 'Set your primary event',
      met: Boolean(profile.primaryEvent),
    },
    {
      label: 'Get at least one time verified',
      met: Object.values(profile.verifications || {}).some(
        (v) => v?.status === 'meet' || v?.status === 'coach',
      ),
    },
    {
      label: 'Log a competition result',
      met: (profile.competitionHistory?.length || 0) > 0,
    },
    {
      label: 'Write a bio',
      met: Boolean(profile.bio?.trim()),
    },
  ];
  const metCount  = completionCriteria.filter((c) => c.met).length;
  const pct       = Math.round((metCount / completionCriteria.length) * 100);

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F7FF] pb-20 md:pb-0">
      <Header />
      <div className="container mx-auto max-w-2xl px-4 py-6 md:py-8">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-[#0B2E4E]">My Progress</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {enteredTimesCount} time{enteredTimesCount !== 1 ? 's' : ''} logged
            {profile.competitionHistory?.length ? ` · ${profile.competitionHistory.length} competition${profile.competitionHistory.length !== 1 ? 's' : ''}` : ''}
            {profile.profileViewEvents?.length ? ` · ${profile.profileViewEvents.length} scout view${profile.profileViewEvents.length !== 1 ? 's' : ''}` : ''}
          </p>
        </div>

        {/* Scout activity callout (Fix 4) */}
        {viewsThisWeek > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
            <div className="bg-amber-400 rounded-lg p-2 shrink-0">
              <TrendingUp size={16} className="text-[#0B2E4E]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0B2E4E]">
                Your profile was viewed {viewsThisWeek} time{viewsThisWeek === 1 ? '' : 's'} this week
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Scouts are noticing — keep your times verified to stay visible.
              </p>
            </div>
          </div>
        )}

        {/* Profile completion bar */}
        <div className="bg-white border border-blue-100 rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-[#0B2E4E]">Profile Strength</span>
            <span className="text-sm font-semibold text-amber-600">{metCount}/{completionCriteria.length}</span>
          </div>
          <div className="w-full bg-blue-50 rounded-full h-2.5 mb-3">
            <div
              className="bg-amber-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {metCount < completionCriteria.length && (
            <ul className="space-y-1">
              {completionCriteria.filter((c) => !c.met).map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0 flex items-center justify-center text-[10px]">○</span>
                  {c.label}
                </li>
              ))}
            </ul>
          )}
          {metCount === completionCriteria.length && (
            <p className="text-xs text-green-600 font-semibold">✓ Profile complete — maximum scout visibility</p>
          )}
        </div>

        {/* What to do next */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-amber-100 rounded-xl p-2 shrink-0">
              <Lightbulb size={18} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">What to do next</div>
              <p className="text-sm text-gray-800 font-medium">{prompt.message}</p>
              <button
                onClick={() => navigate(prompt.href)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#0B2E4E] text-white text-xs font-bold rounded-lg hover:bg-[#0d3a5c] transition-colors"
              >
                {prompt.cta} <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {entries.length > 0 ? (
          <div className="space-y-4">
            {entries.map((entry) => {
              if (entry.type === 'benchmark')   return <BenchmarkEntry    key={entry.id} entry={entry} onUpdate={() => navigate('/profile')} />;
              if (entry.type === 'time')        return <TimeEntry         key={entry.id} entry={entry} onUpdate={() => navigate('/profile')} />;
              if (entry.type === 'competition') return <CompetitionEntry  key={entry.id} entry={entry} onUpdate={() => navigate('/profile')} />;
              if (entry.type === 'view')        return <ViewEntry         key={entry.id} entry={entry} />;
              return null;
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Waves size={48} className="text-[#0B2E4E] mx-auto mb-4 opacity-20" />
            <p className="text-gray-500 font-medium">Your progress timeline is empty.</p>
            <p className="text-gray-400 text-sm mt-1">Add your swim times and competition results to get started.</p>
            <button onClick={() => navigate('/profile')} className="mt-4 px-6 py-2.5 bg-[#0B2E4E] text-white rounded-xl text-sm font-semibold hover:bg-[#0d3a5c]">
              Build My Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ISO week helper (used for "viewed this week" counter) ─────────────────
function isoWeekNum(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
