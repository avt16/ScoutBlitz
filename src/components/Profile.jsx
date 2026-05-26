import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Header from './Header';
import { IoCamera } from 'react-icons/io5';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { db, storage } from './FireBase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CgSoftwareUpload } from 'react-icons/cg';
import {
  X, Plus, ShieldCheck, Shield, AlertCircle, Waves, Copy, Check,
  Eye, MessageSquare, Send,
} from 'lucide-react';
import {
  INDIAN_STATES, UNDERSERVED_STATES, SWIM_EVENTS, BENCHMARKS,
  parseTime, fmtSecs, formatTime,
} from '../data/swimData';
import SmartTimeInput from './SmartTimeInput';
import Onboarding from './Onboarding';

// ─── Module-level constants (don't recreate on every render — bug A7) ────────

const DEFAULT_FORM = {
  email: '', type: 'Athlete', name: '', bio: '', gender: '',
  state: '', city: '', height: '', weight: '', reach: '',
  profile_pic: '', age: '',
  primaryEvent: '', secondaryEvent: '',
  clubName: '', coachName: '',
  contactEmail: '',
  // Swim time fields
  swimming50mFreestyleTime: '', swimming100mFreestyleTime: '', swimming200mFreestyleTime: '',
  swimming400mFreestyleTime: '', swimming800mFreestyleTime: '', swimming1500mFreestyleTime: '',
  swimming50mBackstrokeTime: '', swimming100mBackstrokeTime: '', swimming200mBackstrokeTime: '',
  swimming50mBreaststrokeTime: '', swimming100mBreaststrokeTime: '', swimming200mBreaststrokeTime: '',
  swimming50mButterflyTime: '', swimming100mButterflyTime: '', swimming200mButterflyTime: '',
  swimming200mIndividualMedleyTime: '', swimming400mIndividualMedleyTime: '',
  verifications: {},
  competitionHistory: [],
  photos: [], videos: [],
  // Scout-activity counters (Fix 4)
  profileViews: 0,
  profileViewsThisWeek: 0,
  profileViewEvents: [],
  // Onboarding state (Fix 5)
  onboardingCompleted: false,
};

const PLACE_COLORS = {
  '1st': 'bg-amber-100 text-amber-700',
  '2nd': 'bg-gray-100 text-gray-600',
  '3rd': 'bg-orange-100 text-orange-600',
};

const COMPLETION_CRITERIA = [
  { key: 'photo',    label: 'Profile photo',         test: (d) => Boolean(d.profile_pic) },
  { key: 'name',     label: 'Name',                  test: (d) => Boolean(d.name?.trim()) },
  { key: 'state',    label: 'State',                 test: (d) => Boolean(d.state) },
  { key: 'event',    label: 'Primary event',         test: (d) => Boolean(d.primaryEvent) },
  { key: 'verified', label: 'At least one verified time',
    test: (d) => Object.values(d.verifications || {}).some((v) => v?.status === 'meet' || v?.status === 'coach') },
  { key: 'bio',      label: 'Short bio',             test: (d) => Boolean(d.bio?.trim()) },
  { key: 'contact',  label: 'Contact email for scouts', test: (d) => Boolean(d.contactEmail?.trim()) },
];

// ─── Benchmark panel — renders on public profile too (Fix 3) ─────────────────

function BenchmarkPanel({ event, time, gender }) {
  if (!event || !time || !BENCHMARKS[event]) return null;
  const gk = gender === 'Female' ? 'female' : 'male';
  const bm = BENCHMARKS[event][gk];
  const athleteSecs = parseTime(time);
  if (!athleteSecs) return null;

  const tiers = [
    { label: 'Indian National B', key: 'nationalB' },
    { label: 'Indian National A', key: 'nationalA' },
    { label: 'European Club',     key: 'europeanClub' },
    { label: 'D1 NCAA (USA)',     key: 'd1NCAA' },
  ];

  return (
    <div className="bg-[#0B2E4E] rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-lg">Where You Stand</h3>
        <span className="text-blue-300 text-sm font-medium">{event}</span>
      </div>
      <div className="flex items-baseline gap-2 mb-5">
        <span className="text-4xl font-extrabold">{formatTime(time)}</span>
        <span className="text-blue-300 text-sm">personal best</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiers.map(({ label, key }) => {
          const threshold = bm[key];
          const diff = athleteSecs - threshold;
          const achieved = diff <= 0;
          const close = diff > 0 && diff <= 2.0;
          return (
            <div
              key={key}
              className={`rounded-xl p-3 text-center ${achieved ? 'bg-green-500' : close ? 'bg-amber-500' : 'bg-[#1a4a6e]'}`}
            >
              <div className="text-xs font-medium leading-tight mb-1 opacity-90">{label}</div>
              <div className="text-base font-bold">{fmtSecs(threshold)}</div>
              {achieved ? (
                <div className="text-xs font-bold mt-1">✓ Achieved</div>
              ) : (
                <div className="text-xs mt-1 opacity-70">{diff.toFixed(2)}s away</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Verification badge ──────────────────────────────────────────────────────

function VerificationBadge({ status }) {
  if (status === 'meet') {
    return (
      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
        <ShieldCheck size={12} /> Meet Verified
      </span>
    );
  }
  if (status === 'coach') {
    return (
      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
        <Shield size={12} /> Coach Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
      <AlertCircle size={12} /> Unverified
    </span>
  );
}

// ─── Profile completion bar (Fix 6) ──────────────────────────────────────────

function CompletionBar({ formData }) {
  const items = COMPLETION_CRITERIA.map((c) => ({ ...c, met: c.test(formData) }));
  const met = items.filter((i) => i.met).length;
  const pct = Math.round((met / items.length) * 100);

  return (
    <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-[#0B2E4E]">Profile Strength</span>
        <span className="text-sm font-semibold text-amber-600">{met}/{items.length}</span>
      </div>
      <div className="w-full bg-blue-50 rounded-full h-2.5 mb-3">
        <div
          className="bg-amber-400 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {met < items.length && (
        <div className="space-y-1.5">
          {items.filter((i) => !i.met).map((i) => (
            <div key={i.key} className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />
              <span>{i.label}</span>
            </div>
          ))}
        </div>
      )}
      {met === items.length && (
        <div className="text-xs text-green-700 font-medium">All set — your profile is complete.</div>
      )}
    </div>
  );
}

// ─── Scout activity card (Fix 4 surface) ─────────────────────────────────────

function ScoutActivityCard({ formData }) {
  const events = formData.profileViewEvents || [];
  const total  = events.length || Number(formData.profileViews) || 0;

  // Compute "this week" from the event log — accurate, no server rollover needed.
  const now = new Date();
  const currentWeek = isoWeek(now);
  const currentYear = now.getFullYear();
  const thisWeek = events.filter((ts) => {
    const d = new Date(ts);
    return isoWeek(d) === currentWeek && d.getFullYear() === currentYear;
  }).length;

  if (total === 0) {
    return (
      <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Eye size={16} className="text-gray-400" />
          <span className="text-sm font-bold text-[#0B2E4E]">Scout Activity</span>
        </div>
        <p className="text-xs text-gray-500">
          No scouts have viewed your profile yet. Complete your profile and verify
          your times to get discovered.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Eye size={16} className="text-amber-500" />
        <span className="text-sm font-bold text-[#0B2E4E]">Scout Activity</span>
      </div>
      <p className="text-sm text-gray-700">
        Your profile was viewed{' '}
        <span className="font-bold text-amber-600">{thisWeek}</span> time
        {thisWeek === 1 ? '' : 's'} this week ({total} total).
      </p>
    </div>
  );
}

// ─── Request-verification modal (Fix 10) ─────────────────────────────────────

function RequestVerifyModal({
  open, onClose, athleteId, athleteName,
  expectedCoach, expectedClub,
  field, label, time,
}) {
  const [token, setToken] = useState(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setToken(null); setCopied(false); setError(null);
    // Guardrail: only an athlete who has named both their coach AND their
    // club can request verification. Verifying coaches must enter both, and
    // both must match what the athlete listed.
    if (!expectedCoach?.trim() || !expectedClub?.trim()) {
      setError(
        !expectedCoach?.trim() && !expectedClub?.trim()
          ? 'Add your coach name and club to your profile before requesting verification.'
          : !expectedCoach?.trim()
            ? 'Add your coach name to your profile before requesting verification.'
            : 'Add your club name to your profile before requesting verification.'
      );
      return;
    }
    const create = async () => {
      setCreating(true);
      try {
        const newToken = crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
        await setDoc(doc(db, 'verificationRequests', newToken), {
          athleteId, athleteName, field, label, time,
          expectedCoach: expectedCoach.trim(),
          expectedClub:  expectedClub.trim(),
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
        setToken(newToken);
      } catch (e) {
        setError('Could not create verification link. Try again.');
      }
      setCreating(false);
    };
    create();
  }, [open, athleteId, athleteName, expectedCoach, expectedClub, field, label, time]);

  if (!open) return null;
  const url = token ? `${window.location.origin}/verify/${token}` : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  const whatsappText = encodeURIComponent(
    `Hi Coach, can you verify my ${label} time of ${formatTime(time)} on SwimBlitz? Takes ten seconds: ${url}`
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-[#0B2E4E]">Request Coach Verification</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Send this link to your coach via WhatsApp or email. They'll see your
              claimed time and confirm — no SwimBlitz account needed.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2">
            <X size={18} />
          </button>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 mb-4">
          <div className="text-xs text-gray-500 mb-0.5">{label}</div>
          <div className="text-2xl font-extrabold text-[#0B2E4E]">{formatTime(time)}</div>
        </div>

        {creating && <div className="text-sm text-gray-500">Generating link…</div>}
        {error && <div className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</div>}

        {token && !error && (
          <>
            <div className="flex gap-2 mb-3">
              <input
                readOnly
                value={url}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono bg-gray-50 focus:outline-none"
              />
              <button
                onClick={copy}
                className="px-3 py-2 bg-[#0B2E4E] text-white rounded-lg text-xs font-medium hover:bg-[#0d3a5c] flex items-center gap-1.5"
              >
                {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>

            <a
              href={`https://wa.me/?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              <Send size={14} /> Share via WhatsApp
            </a>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Profile component ──────────────────────────────────────────────────

export default function Profile({ isMyProfile }) {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDescription, setUploadDescription] = useState('');
  const [pendingUploads, setPendingUploads] = useState([]);
  const [uploadType, setUploadType] = useState('');
  const [newComp, setNewComp] = useState({ meetName: '', date: '', event: '', placing: '', time: '' });
  const [profileMissing, setProfileMissing] = useState(false);  // Bug A8 — invalid /:userId
  const [verifyTarget, setVerifyTarget] = useState(null);       // {field, label, time}

  // Fix 7 — inline edit auto-save state
  const [saveState, setSaveState] = useState('idle');  // 'idle' | 'saving' | 'saved' | 'error'
  const [loaded, setLoaded] = useState(false);        // guards autosave + onboarding render
  const [baseline, setBaseline] = useState(null);     // last-saved snapshot for dirty diff
  const [focusedField, setFocusedField] = useState(null);  // currently-focused field name
  const saveTimer = useRef(null);                      // debounce timer

  // Auth listener
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // Load profile data
  useEffect(() => {
    const fetchUser = async () => {
      const uid = isMyProfile ? user?.uid : userId;
      if (!uid) return;
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const d = snap.data();
        // Block scouts from landing on /profile (Fix 5 from previous session)
        if (isMyProfile && (d.type === 'Scout' || d.type === 'Coach')) {
          navigate('/');
          return;
        }
        // Bug A8 — public viewing of a non-athlete profile gets bounced home
        if (!isMyProfile && d.type && d.type !== 'Athlete') {
          setProfileMissing(true);
          return;
        }
        const merged = {
          ...DEFAULT_FORM,
          ...Object.fromEntries(Object.keys(DEFAULT_FORM).map((k) => [k, d[k] ?? DEFAULT_FORM[k]])),
        };
        setFormData(merged);
        if (isMyProfile) setBaseline(merged);
      } else if (isMyProfile && user) {
        const seed = { ...DEFAULT_FORM, email: user.email || '', name: user.displayName || '' };
        setFormData(seed);
        setBaseline(seed);
      } else if (!isMyProfile) {
        setProfileMissing(true);
      }
      // Allow auto-save now that initial data has loaded (Fix 7)
      if (isMyProfile) setLoaded(true);
    };
    if ((isMyProfile && user) || (!isMyProfile && userId)) fetchUser();
  }, [user, userId, isMyProfile, navigate]);

  // ── Derived values (always called — Rules of Hooks compliant) ──────────────

  const isUnderserved   = useMemo(() => UNDERSERVED_STATES.has(formData.state), [formData.state]);
  const enteredTimes    = useMemo(() => SWIM_EVENTS.filter((e) => formData[e.field]?.trim()), [formData]);
  const primaryEventObj = useMemo(() => SWIM_EVENTS.find((e) => e.label === formData.primaryEvent), [formData.primaryEvent]);
  const primaryBestTime = primaryEventObj ? formData[primaryEventObj.field] : null;

  // ── Handlers ───────────────────────────────────────────────────────────────

  // Fix 1: validation list — surfaced as a banner, not a blocker
  const missingFields = useMemo(() => {
    const errors = [];
    if (!formData.name?.trim())   errors.push('Name');
    if (!formData.state)          errors.push('State');
    if (!formData.primaryEvent)   errors.push('Primary event');
    return errors;
  }, [formData.name, formData.state, formData.primaryEvent]);

  // Fix 7: which fields have unsaved changes (compared to last-saved baseline)
  const dirtyFields = useMemo(() => {
    if (!baseline) return new Set();
    const dirty = new Set();
    for (const key of Object.keys(formData)) {
      // Stringify so we catch nested objects/arrays too (verifications, history…)
      if (JSON.stringify(formData[key]) !== JSON.stringify(baseline[key])) {
        dirty.add(key);
      }
    }
    return dirty;
  }, [formData, baseline]);

  // Fix 7: debounced auto-save on every formData change while loaded
  useEffect(() => {
    if (!isMyProfile || !user?.uid || !loaded) return;
    if (dirtyFields.size === 0) return;  // nothing changed → don't write
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        // Bug A3: never write a non-Athlete type from this form
        const payload = { ...formData, type: 'Athlete', email: user.email };
        await setDoc(doc(db, 'users', user.uid), payload, { merge: true });
        // Baseline catches up to the freshly-saved state → dirty becomes empty
        setBaseline(payload);
        setSaveState('saved');
        setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500);
      } catch (e) {
        console.error('Auto-save failed', e);
        setSaveState('error');
      }
    }, 600);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [formData, isMyProfile, user?.uid, user?.email, loaded, dirtyFields]);

  // Bug A4: upload profile pic to Firebase Storage instead of stuffing base64
  // into Firestore. Falls back to a local preview while upload is in flight.
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.uid) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData((prev) => ({ ...prev, profile_pic: reader.result }));
    reader.readAsDataURL(file);
    try {
      const fileRef = ref(storage, `users/${user.uid}/profile/${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setFormData((prev) => ({ ...prev, profile_pic: url }));
    } catch (err) {
      console.error('Profile picture upload failed', err);
    }
  };

  const handleMediaUpload = (e, type) => {
    const files = Array.from(e.target.files);
    if (!user?.uid || files.length === 0) return;
    setPendingUploads(files);
    setUploadType(type);
    setShowUploadModal(true);
  };

  const handleSaveUploads = async () => {
    if (!user?.uid || pendingUploads.length === 0) return;
    setUploading(true);
    const items = [];
    for (const file of pendingUploads) {
      const fileRef = ref(storage, `users/${user.uid}/${uploadType}/${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      items.push({ url, description: uploadDescription, timestamp: new Date().toISOString() });
    }
    setFormData((prev) => ({ ...prev, [uploadType]: [...(prev[uploadType] || []), ...items] }));
    setUploading(false);
    setShowUploadModal(false);
    setUploadDescription('');
    setPendingUploads([]);
    setUploadType('');
  };

  const addCompetition = () => {
    if (!newComp.meetName || !newComp.event || !newComp.time) return;
    setFormData((prev) => ({
      ...prev,
      competitionHistory: [{ ...newComp, id: Date.now().toString() }, ...(prev.competitionHistory || [])],
    }));
    setNewComp({ meetName: '', date: '', event: '', placing: '', time: '' });
  };

  const removeCompetition = (id) => {
    setFormData((prev) => ({
      ...prev,
      competitionHistory: prev.competitionHistory.filter((c) => c.id !== id),
    }));
  };

  const setVerification = (field, status, meetName = '') => {
    setFormData((prev) => ({
      ...prev,
      verifications: { ...prev.verifications, [field]: { status, meetName } },
    }));
  };

  // ── Early returns ──────────────────────────────────────────────────────────

  if (profileMissing) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F0F7FF]">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Waves size={48} className="text-[#0B2E4E] mx-auto mb-4" />
            <p className="text-gray-600">This athlete profile does not exist.</p>
            <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-[#0B2E4E] text-white rounded-lg font-medium">Go Home</button>
          </div>
        </div>
      </div>
    );
  }

  if (!user && isMyProfile) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F0F7FF]">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Waves size={48} className="text-[#0B2E4E] mx-auto mb-4" />
            <p className="text-gray-600">Please log in to view this profile.</p>
            <button onClick={() => navigate('/login')} className="mt-4 px-6 py-2 bg-[#0B2E4E] text-white rounded-lg font-medium hover:bg-[#0d3a5c]">Log In</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  // Per-field visual cues (Fix 7).
  //   - dirty   → amber left-border accent so the user sees what hasn't saved
  //   - focused → stronger amber ring while the user is typing
  //   - clean   → default gray
  const cueClasses = (fieldName) => {
    if (!isMyProfile) return '';
    const isDirty = dirtyFields.has(fieldName);
    const isFocused = focusedField === fieldName;
    if (isFocused) return 'border-amber-400 ring-2 ring-amber-200';
    if (isDirty)   return 'border-l-4 border-l-amber-400';
    return '';
  };

  // Spread these onto any input/select/textarea to track focus state
  const fieldHandlers = (fieldName) => ({
    onFocus: () => setFocusedField(fieldName),
    onBlur:  () => setFocusedField((f) => (f === fieldName ? null : f)),
  });

  const inputCls = (disabled, fieldName) =>
    `w-full p-3 rounded-lg border text-sm transition-all focus:outline-none ${
      disabled ? 'border-transparent bg-transparent text-gray-800 cursor-default'
               : 'border-gray-200 bg-white focus:ring-2 focus:ring-[#1565C0] focus:border-[#1565C0]'
    } ${cueClasses(fieldName)}`;

  const selectCls = (disabled, fieldName) =>
    `w-full p-3 rounded-lg border text-sm transition-all focus:outline-none ${
      disabled ? 'border-transparent bg-transparent text-gray-800 cursor-default appearance-none'
               : 'border-gray-200 bg-white focus:ring-2 focus:ring-[#1565C0]'
    } ${cueClasses(fieldName)}`;

  // Display name — Fix 1 / Bug A1. We no longer fall back to "Unnamed Athlete";
  // if the form has no name, the profile blocks save and the UI prompts the
  // user to complete it.
  const displayName = formData.name?.trim() || (isMyProfile ? 'Your profile is incomplete' : 'Athlete');

  // Onboarding wizard — runs once on first profile visit (Fix 5)
  const showOnboarding = isMyProfile && user?.uid && loaded && !formData.onboardingCompleted;

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F7FF] pb-20 md:pb-0">
      {showOnboarding && (
        <Onboarding
          uid={user.uid}
          initialData={formData}
          onComplete={(writeback) => setFormData((prev) => ({ ...prev, ...writeback }))}
        />
      )}
      <Header />
      <div className="container mx-auto max-w-4xl px-4 py-6 md:py-8 space-y-4 md:space-y-6">

        {/* ── Incomplete-profile banner (Fix 1, always-on with inline edit) */}
        {isMyProfile && missingFields.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Your profile is incomplete. Scouts can't find you until you add:
                </p>
                <p className="mt-0.5 text-xs text-amber-700">
                  {missingFields.join(' · ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Header card ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-blue-100">
          <div className="h-28 bg-gradient-to-r from-[#0B2E4E] via-[#1565C0] to-[#0B2E4E]" />
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
              <div className="relative shrink-0">
                <Avatar className="w-24 h-24 border-4 border-white shadow-lg rounded-full">
                  <AvatarImage src={formData.profile_pic || 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg'} alt="profile" />
                  <AvatarFallback className="bg-[#0B2E4E] text-white text-2xl">{formData.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                {isMyProfile && (
                  <label className="absolute bottom-0 right-0 bg-amber-400 text-[#0B2E4E] rounded-full p-1.5 cursor-pointer shadow">
                    <IoCamera size={14} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>

              <div className="flex-1 min-w-0 mt-4 md:mt-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className={`text-2xl font-extrabold ${formData.name?.trim() ? 'text-[#0B2E4E]' : 'text-gray-400 italic'}`}>
                    {displayName}
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    Athlete
                  </span>
                  {isUnderserved && (
                    <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      🌊 Grassroots Talent
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                  {formData.state && <span>{formData.city ? `${formData.city}, ` : ''}{formData.state}</span>}
                  {formData.primaryEvent && (
                    <span className="font-medium text-[#1565C0]">{formData.primaryEvent}</span>
                  )}
                  {formData.secondaryEvent && (
                    <span className="text-gray-400">· {formData.secondaryEvent}</span>
                  )}
                </div>
                {(formData.clubName || formData.coachName) && (
                  <div className="mt-1 text-xs text-gray-400">
                    {formData.clubName && <span>{formData.clubName}</span>}
                    {formData.clubName && formData.coachName && <span> · </span>}
                    {formData.coachName && <span>Coach: {formData.coachName}</span>}
                  </div>
                )}
              </div>

              <div className="flex gap-2 shrink-0 items-center">
                {isMyProfile && <SaveStatePill state={saveState} />}
              </div>
            </div>
          </div>
        </div>

        {/* ── Profile strength + scout activity (own profile only) ──────── */}
        {isMyProfile && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CompletionBar formData={formData} />
            <ScoutActivityCard formData={formData} />
          </div>
        )}

        {/* ── Identity fields ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
          <h3 className="text-sm font-bold text-[#0B2E4E] uppercase tracking-wider mb-4">Profile Details</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Age', field: 'age', placeholder: 'e.g. 18' },
              { label: 'Height (cm)', field: 'height', placeholder: 'e.g. 178' },
              { label: 'Weight (kg)', field: 'weight', placeholder: 'e.g. 68' },
              { label: 'Wingspan (cm)', field: 'reach', placeholder: 'e.g. 185' },
            ].map(({ label, field, placeholder }) => {
              const isDirty = isMyProfile && dirtyFields.has(field);
              const isFocused = focusedField === field;
              const cardCue = isFocused
                ? 'border-amber-400 ring-2 ring-amber-200'
                : isDirty
                  ? 'border-amber-400 border-l-4 border-l-amber-400'
                  : 'border-gray-200';
              return (
                <div key={field} className={`relative rounded-xl p-3 text-center transition-all ${isMyProfile ? `border ${cardCue}` : 'bg-blue-50'}`}>
                  <div className="text-xs font-medium text-gray-500 mb-1 flex items-center justify-center gap-1">
                    <span>{label}</span>
                    {isFocused && <span className="text-[9px] font-semibold text-amber-600 uppercase">Editing</span>}
                  </div>
                  {isMyProfile ? (
                    <>
                      <input
                        type="text"
                        value={formData[field]}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))}
                        {...fieldHandlers(field)}
                        className="w-full text-center text-lg font-bold text-[#0B2E4E] focus:outline-none bg-transparent"
                        placeholder={placeholder}
                      />
                      {isDirty && !isFocused && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes" />
                      )}
                    </>
                  ) : (
                    <div className="text-lg font-bold text-[#0B2E4E]">{formData[field] || '—'}</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <Field label="Full Name *" required dirty={dirtyFields.has('name')} focused={focusedField === 'name'}>
              <input
                disabled={!isMyProfile} type="text" value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                {...fieldHandlers('name')}
                className={inputCls(!isMyProfile, 'name')} placeholder="Your full name"
              />
            </Field>
            <Field label="Gender" dirty={dirtyFields.has('gender')} focused={focusedField === 'gender'}>
              <select
                disabled={!isMyProfile} value={formData.gender}
                onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
                {...fieldHandlers('gender')}
                className={selectCls(!isMyProfile, 'gender')}
              >
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="State / Region *" required dirty={dirtyFields.has('state')} focused={focusedField === 'state'}>
              <select
                disabled={!isMyProfile} value={formData.state}
                onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                {...fieldHandlers('state')}
                className={selectCls(!isMyProfile, 'state')}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="City" dirty={dirtyFields.has('city')} focused={focusedField === 'city'}>
              <input
                disabled={!isMyProfile} type="text" value={formData.city}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                {...fieldHandlers('city')}
                className={inputCls(!isMyProfile, 'city')} placeholder="e.g. Pune"
              />
            </Field>
            <Field label="Club Name" dirty={dirtyFields.has('clubName')} focused={focusedField === 'clubName'}>
              <input
                disabled={!isMyProfile} type="text" value={formData.clubName}
                onChange={(e) => setFormData((prev) => ({ ...prev, clubName: e.target.value }))}
                {...fieldHandlers('clubName')}
                className={inputCls(!isMyProfile, 'clubName')} placeholder="e.g. Aqua Tigers Swimming Club"
              />
            </Field>
            <Field label="Coach Name" dirty={dirtyFields.has('coachName')} focused={focusedField === 'coachName'}>
              <input
                disabled={!isMyProfile} type="text" value={formData.coachName}
                onChange={(e) => setFormData((prev) => ({ ...prev, coachName: e.target.value }))}
                {...fieldHandlers('coachName')}
                className={inputCls(!isMyProfile, 'coachName')} placeholder="Coach's full name"
              />
            </Field>
            <div className="md:col-span-2">
              <Field
                label={<>Contact Email <span className="text-amber-600 font-normal">(visible to scouts)</span></>}
                dirty={dirtyFields.has('contactEmail')} focused={focusedField === 'contactEmail'}
              >
                <input
                  disabled={!isMyProfile} type="email" value={formData.contactEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
                  {...fieldHandlers('contactEmail')}
                  className={inputCls(!isMyProfile, 'contactEmail')}
                  placeholder="contact@example.com — the email scouts should use to reach you"
                />
              </Field>
            </div>
          </div>

          <Field label="Bio" dirty={dirtyFields.has('bio')} focused={focusedField === 'bio'}>
            <textarea
              disabled={!isMyProfile} value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              {...fieldHandlers('bio')}
              className={`${inputCls(!isMyProfile, 'bio')} resize-none`} rows={2}
              placeholder="Short bio — your goals, background, current training focus..."
            />
          </Field>
        </div>

        {/* ── Event Specialization ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
          <h3 className="text-sm font-bold text-[#0B2E4E] uppercase tracking-wider mb-4">Event Specialization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Primary Event *" required dirty={dirtyFields.has('primaryEvent')} focused={focusedField === 'primaryEvent'}>
              <select
                disabled={!isMyProfile} value={formData.primaryEvent}
                onChange={(e) => setFormData((prev) => ({ ...prev, primaryEvent: e.target.value }))}
                {...fieldHandlers('primaryEvent')}
                className={selectCls(!isMyProfile, 'primaryEvent')}
              >
                <option value="">Select primary event</option>
                {SWIM_EVENTS.map((e) => <option key={e.label}>{e.label}</option>)}
              </select>
            </Field>
            <Field label="Secondary Event" dirty={dirtyFields.has('secondaryEvent')} focused={focusedField === 'secondaryEvent'}>
              <select
                disabled={!isMyProfile} value={formData.secondaryEvent}
                onChange={(e) => setFormData((prev) => ({ ...prev, secondaryEvent: e.target.value }))}
                {...fieldHandlers('secondaryEvent')}
                className={selectCls(!isMyProfile, 'secondaryEvent')}
              >
                <option value="">Select secondary event</option>
                {SWIM_EVENTS.map((e) => <option key={e.label}>{e.label}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* ── Benchmark Panel (Fix 3 — public visible) ─────────────────── */}
        {formData.primaryEvent && primaryBestTime && (
          <BenchmarkPanel
            event={formData.primaryEvent}
            time={primaryBestTime}
            gender={formData.gender}
          />
        )}

        {/* ── Swim Times ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
          <h3 className="text-sm font-bold text-[#0B2E4E] uppercase tracking-wider mb-4">Swim Times</h3>

          {/* Smart time entry grid */}
          {isMyProfile && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {SWIM_EVENTS.map(({ label, field }) => {
                const verif = formData.verifications?.[field] || {};
                const isDirty = dirtyFields.has(field);
                const isFocused = focusedField === field;
                const cardCue = isFocused
                  ? 'border-amber-400 ring-2 ring-amber-200'
                  : isDirty
                    ? 'border-amber-400 border-l-4 border-l-amber-400'
                    : 'border-gray-100';
                return (
                  <div key={field} className={`relative border rounded-xl p-3 transition-all ${cardCue}`}>
                    <div className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                      <span>{label}</span>
                      {isFocused && (
                        <span className="text-[9px] font-semibold text-amber-600 uppercase tracking-wide">Editing</span>
                      )}
                      {!isFocused && isDirty && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          <span className="w-1 h-1 rounded-full bg-amber-500" /> Unsaved
                        </span>
                      )}
                    </div>
                    <div {...fieldHandlers(field)}>
                      <SmartTimeInput
                        value={formData[field]}
                        onChange={(v) => setFormData((prev) => ({ ...prev, [field]: v }))}
                        event={label}
                        gender={formData.gender}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565C0] mb-1"
                      />
                    </div>
                    {formData[field] && (
                      <div className="space-y-1 mt-2">
                        <select
                          value={verif.status || ''}
                          onChange={(e) => setVerification(field, e.target.value, verif.meetName)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#1565C0]"
                        >
                          <option value="">Unverified</option>
                          <option value="coach">Coach Verified</option>
                          <option value="meet">Meet Verified</option>
                        </select>
                        {verif.status === 'meet' && (
                          <input
                            type="text"
                            value={verif.meetName || ''}
                            onChange={(e) => setVerification(field, 'meet', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                            placeholder="Meet name / source"
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Times table */}
          {enteredTimes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-2 pr-4">Event</th>
                    <th className="pb-2 pr-4">Best Time</th>
                    <th className="pb-2 pr-4">Verification</th>
                    <th className="pb-2">Source</th>
                    {isMyProfile && <th className="pb-2 text-right" />}
                  </tr>
                </thead>
                <tbody>
                  {enteredTimes.map(({ label, field }) => {
                    const verif = formData.verifications?.[field] || {};
                    const isPrimary = label === formData.primaryEvent;
                    const isVerified = verif.status === 'meet' || verif.status === 'coach';
                    return (
                      <tr key={field} className={`border-b border-gray-50 ${isPrimary ? 'bg-blue-50' : ''}`}>
                        <td className="py-2.5 pr-4 font-medium text-[#0B2E4E]">
                          {label}
                          {isPrimary && <span className="ml-2 text-xs text-blue-500 font-normal">Primary</span>}
                        </td>
                        <td className="py-2.5 pr-4 font-bold text-[#0B2E4E]">{formatTime(formData[field])}</td>
                        <td className="py-2.5 pr-4"><VerificationBadge status={verif.status} /></td>
                        <td className="py-2.5 text-gray-400 text-xs">{verif.meetName || '—'}</td>
                        {isMyProfile && (
                          <td className="py-2.5 text-right">
                            {!isVerified && (
                              <button
                                onClick={() => setVerifyTarget({ field, label, time: formData[field] })}
                                className="text-xs font-medium text-[#1565C0] hover:text-[#0B2E4E] inline-flex items-center gap-1"
                              >
                                <MessageSquare size={11} /> Request verification
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              {isMyProfile ? 'Enter your swim times above to build your profile.' : 'No times recorded yet.'}
            </div>
          )}
        </div>

        {/* ── Competition History ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
          <h3 className="text-sm font-bold text-[#0B2E4E] uppercase tracking-wider mb-4">Competition History</h3>

          {isMyProfile && (
            <div className="bg-blue-50 rounded-xl p-4 mb-4">
              <div className="text-xs font-medium text-gray-600 mb-3">Add Competition Result</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                <input type="text" placeholder="Meet Name *" value={newComp.meetName} onChange={(e) => setNewComp({ ...newComp, meetName: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1565C0]" />
                <input type="date" value={newComp.date} onChange={(e) => setNewComp({ ...newComp, date: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1565C0]" />
                <select value={newComp.event} onChange={(e) => setNewComp({ ...newComp, event: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1565C0]">
                  <option value="">Event *</option>
                  {SWIM_EVENTS.map((e) => <option key={e.label}>{e.label}</option>)}
                </select>
                <input type="text" placeholder="Placing (e.g. 2nd)" value={newComp.placing} onChange={(e) => setNewComp({ ...newComp, placing: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1565C0]" />
                <input type="text" placeholder="Time * (e.g. 1:54.32)" value={newComp.time} onChange={(e) => setNewComp({ ...newComp, time: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1565C0]" />
                <button onClick={addCompetition} className="flex items-center justify-center gap-1 bg-[#0B2E4E] text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-[#0d3a5c]">
                  <Plus size={12} /> Add
                </button>
              </div>
            </div>
          )}

          {(formData.competitionHistory?.length > 0) ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-2 pr-4">Meet</th>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Event</th>
                    <th className="pb-2 pr-4">Place</th>
                    <th className="pb-2 pr-4">Time</th>
                    {isMyProfile && <th className="pb-2" />}
                  </tr>
                </thead>
                <tbody>
                  {formData.competitionHistory.map((c) => {
                    const placeColor = PLACE_COLORS[c.placing] || 'bg-orange-100 text-orange-600';
                    return (
                      <tr key={c.id} className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 font-medium text-gray-800">{c.meetName}</td>
                        <td className="py-2.5 pr-4 text-gray-500">{c.date}</td>
                        <td className="py-2.5 pr-4 text-gray-600">{c.event}</td>
                        <td className="py-2.5 pr-4">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${placeColor}`}>
                            {c.placing || '—'}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-bold text-[#0B2E4E]">{formatTime(c.time)}</td>
                        {isMyProfile && (
                          <td className="py-2.5">
                            <button onClick={() => removeCompetition(c.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                              <X size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              {isMyProfile ? 'Add competition results using the form above.' : 'No competition history recorded.'}
            </div>
          )}
        </div>

        {/* ── Media ─────────────────────────────────────────────────────── */}
        {(formData.videos?.length > 0 || formData.photos?.length > 0 || isMyProfile) && (
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
            <h3 className="text-sm font-bold text-[#0B2E4E] uppercase tracking-wider mb-4">Video Highlights & Photos</h3>

            {isMyProfile && (
              <div className="flex gap-3 mb-4">
                <label className="flex items-center gap-2 cursor-pointer text-[#1565C0] text-sm font-medium hover:text-[#0B2E4E]">
                  <CgSoftwareUpload size={18} /> Upload Video
                  <input type="file" accept="video/*" multiple onChange={(e) => handleMediaUpload(e, 'videos')} disabled={uploading} className="hidden" />
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-600 text-sm font-medium hover:text-gray-800">
                  <CgSoftwareUpload size={18} /> Upload Photo
                  <input type="file" accept="image/*" multiple onChange={(e) => handleMediaUpload(e, 'photos')} disabled={uploading} className="hidden" />
                </label>
                {uploading && <span className="text-blue-500 text-sm">Uploading...</span>}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formData.videos?.map((item, idx) => (
                <div key={idx}>
                  <video src={item.url} controls className="w-full max-h-72 rounded-xl border shadow-sm" />
                  {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
                </div>
              ))}
              {formData.photos?.map((item, idx) => (
                <div key={idx}>
                  <img src={item.url} alt="highlight" className="w-full h-48 object-cover rounded-xl border shadow-sm" />
                  {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#0B2E4E]">Add Description</h3>
              <button onClick={() => { setShowUploadModal(false); setPendingUploads([]); setUploadDescription(''); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <textarea
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565C0] mb-4"
              rows={3}
              placeholder="Describe this clip (e.g. 'State championships 100m fly final')..."
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowUploadModal(false); setPendingUploads([]); }}>Cancel</Button>
              <Button onClick={handleSaveUploads} disabled={uploading} className="bg-[#0B2E4E] text-white hover:bg-[#0d3a5c]">
                {uploading ? 'Uploading...' : 'Save & Upload'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Coach verification request modal (Fix 10) */}
      <RequestVerifyModal
        open={!!verifyTarget}
        onClose={() => setVerifyTarget(null)}
        athleteId={user?.uid}
        athleteName={formData.name || 'An athlete'}
        expectedCoach={formData.coachName}
        expectedClub={formData.clubName}
        field={verifyTarget?.field}
        label={verifyTarget?.label}
        time={verifyTarget?.time}
      />
    </div>
  );
}

// ── Save-state pill (Fix 7) ────────────────────────────────────────────────

function SaveStatePill({ state }) {
  if (state === 'idle') return null;
  const styles = {
    saving: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Saving…' },
    saved:  { bg: 'bg-green-100', text: 'text-green-700', label: '✓ Saved' },
    error:  { bg: 'bg-red-100', text: 'text-red-700', label: 'Save failed' },
  };
  const s = styles[state] || styles.saving;
  return (
    <span className={`inline-flex items-center gap-1 ${s.bg} ${s.text} text-xs font-medium px-2.5 py-1 rounded-full`}>
      {s.label}
    </span>
  );
}

// ── Small layout helper ────────────────────────────────────────────────────

function Field({ label, required, dirty, focused, children }) {
  return (
    <div>
      <label className={`flex items-center gap-1.5 text-xs font-medium mb-1 ${required ? 'text-[#0B2E4E]' : 'text-gray-500'}`}>
        <span>{label}</span>
        {focused && (
          <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">
            Editing
          </span>
        )}
        {!focused && dirty && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Unsaved
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

// ── ISO week number — used to roll over the "this week" view counter ───────

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
