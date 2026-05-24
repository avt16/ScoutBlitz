import React, { useState, useEffect } from 'react';
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
import { X, Plus, ShieldCheck, Shield, AlertCircle, Waves } from 'lucide-react';

// ─── Data constants ───────────────────────────────────────────────────────────

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Chandigarh','Jammu & Kashmir','Ladakh','Puducherry',
];

const UNDERSERVED_STATES = new Set([
  'Uttar Pradesh','Bihar','Rajasthan','Madhya Pradesh','Jharkhand','Chhattisgarh',
  'Odisha','Assam','Manipur','Nagaland','Mizoram','Meghalaya','Tripura',
  'Arunachal Pradesh','Sikkim','Himachal Pradesh','Uttarakhand',
]);

const SWIM_EVENTS = [
  { label: '50m Freestyle',          field: 'swimming50mFreestyleTime' },
  { label: '100m Freestyle',         field: 'swimming100mFreestyleTime' },
  { label: '200m Freestyle',         field: 'swimming200mFreestyleTime' },
  { label: '400m Freestyle',         field: 'swimming400mFreestyleTime' },
  { label: '800m Freestyle',         field: 'swimming800mFreestyleTime' },
  { label: '1500m Freestyle',        field: 'swimming1500mFreestyleTime' },
  { label: '50m Backstroke',         field: 'swimming50mBackstrokeTime' },
  { label: '100m Backstroke',        field: 'swimming100mBackstrokeTime' },
  { label: '200m Backstroke',        field: 'swimming200mBackstrokeTime' },
  { label: '50m Breaststroke',       field: 'swimming50mBreaststrokeTime' },
  { label: '100m Breaststroke',      field: 'swimming100mBreaststrokeTime' },
  { label: '200m Breaststroke',      field: 'swimming200mBreaststrokeTime' },
  { label: '50m Butterfly',          field: 'swimming50mButterflyTime' },
  { label: '100m Butterfly',         field: 'swimming100mButterflyTime' },
  { label: '200m Butterfly',         field: 'swimming200mButterflyTime' },
  { label: '200m Individual Medley', field: 'swimming200mIndividualMedleyTime' },
  { label: '400m Individual Medley', field: 'swimming400mIndividualMedleyTime' },
];

const BENCHMARKS = {
  '50m Freestyle':          { male: { nationalB: 25.00, nationalA: 23.50, europeanClub: 24.20, d1NCAA: 22.50 }, female: { nationalB: 28.50, nationalA: 27.00, europeanClub: 27.80, d1NCAA: 25.50 } },
  '100m Freestyle':         { male: { nationalB: 54.00, nationalA: 51.50, europeanClub: 52.50, d1NCAA: 49.50 }, female: { nationalB: 62.00, nationalA: 59.00, europeanClub: 60.00, d1NCAA: 56.00 } },
  '200m Freestyle':         { male: { nationalB: 118.0, nationalA: 113.0, europeanClub: 115.0, d1NCAA: 107.0 }, female: { nationalB: 132.0, nationalA: 127.0, europeanClub: 129.0, d1NCAA: 121.0 } },
  '400m Freestyle':         { male: { nationalB: 252.0, nationalA: 240.0, europeanClub: 244.0, d1NCAA: 232.0 }, female: { nationalB: 280.0, nationalA: 268.0, europeanClub: 272.0, d1NCAA: 259.0 } },
  '800m Freestyle':         { male: { nationalB: 540.0, nationalA: 514.0, europeanClub: 522.0, d1NCAA: 499.0 }, female: { nationalB: 580.0, nationalA: 553.0, europeanClub: 560.0, d1NCAA: 535.0 } },
  '1500m Freestyle':        { male: { nationalB: 1020.0,nationalA: 968.0, europeanClub: 985.0, d1NCAA: 935.0 }, female: { nationalB: 1140.0,nationalA: 1080.0,europeanClub: 1100.0,d1NCAA: 1050.0 } },
  '100m Backstroke':        { male: { nationalB: 62.00, nationalA: 58.50, europeanClub: 60.00, d1NCAA: 56.00 }, female: { nationalB: 70.00, nationalA: 66.50, europeanClub: 68.00, d1NCAA: 63.00 } },
  '200m Backstroke':        { male: { nationalB: 136.0, nationalA: 127.5, europeanClub: 131.0, d1NCAA: 123.0 }, female: { nationalB: 153.0, nationalA: 145.0, europeanClub: 148.0, d1NCAA: 140.0 } },
  '100m Breaststroke':      { male: { nationalB: 70.00, nationalA: 66.00, europeanClub: 68.00, d1NCAA: 63.00 }, female: { nationalB: 79.00, nationalA: 75.00, europeanClub: 77.00, d1NCAA: 72.00 } },
  '200m Breaststroke':      { male: { nationalB: 152.0, nationalA: 144.0, europeanClub: 147.0, d1NCAA: 138.0 }, female: { nationalB: 170.0, nationalA: 162.0, europeanClub: 165.0, d1NCAA: 157.0 } },
  '100m Butterfly':         { male: { nationalB: 58.00, nationalA: 55.00, europeanClub: 56.50, d1NCAA: 52.00 }, female: { nationalB: 66.00, nationalA: 62.50, europeanClub: 64.00, d1NCAA: 59.00 } },
  '200m Butterfly':         { male: { nationalB: 128.0, nationalA: 121.0, europeanClub: 124.0, d1NCAA: 115.0 }, female: { nationalB: 145.0, nationalA: 137.0, europeanClub: 140.0, d1NCAA: 131.0 } },
  '200m Individual Medley': { male: { nationalB: 126.0, nationalA: 119.0, europeanClub: 122.0, d1NCAA: 113.0 }, female: { nationalB: 143.0, nationalA: 135.0, europeanClub: 138.0, d1NCAA: 130.0 } },
  '400m Individual Medley': { male: { nationalB: 272.0, nationalA: 258.0, europeanClub: 264.0, d1NCAA: 250.0 }, female: { nationalB: 307.0, nationalA: 291.0, europeanClub: 297.0, d1NCAA: 283.0 } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseTime = (str) => {
  if (!str || str.trim() === '') return null;
  const s = str.trim();
  if (s.includes(':')) {
    const [m, sec] = s.split(':');
    return parseFloat(m) * 60 + parseFloat(sec);
  }
  const v = parseFloat(s);
  return isNaN(v) ? null : v;
};

const fmtSecs = (secs) => {
  if (secs === null || isNaN(secs)) return '';
  if (secs >= 60) {
    const m = Math.floor(secs / 60);
    const s = (secs % 60).toFixed(2).padStart(5, '0');
    return `${m}:${s}`;
  }
  return secs.toFixed(2);
};

// ─── Benchmark panel ─────────────────────────────────────────────────────────

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
        <span className="text-4xl font-extrabold">{time}</span>
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

// ─── Verification badge ───────────────────────────────────────────────────────

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

// ─── Profile component ────────────────────────────────────────────────────────

export default function Profile({ isMyProfile }) {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);

  const defaultForm = {
    email: '', type: '', name: '', bio: '', gender: '',
    state: '', city: '', height: '', weight: '', reach: '',
    profile_pic: '', age: '',
    primaryEvent: '', secondaryEvent: '',
    clubName: '', coachName: '',
    // Swim time fields (kept for Firebase compatibility)
    swimming50mFreestyleTime: '', swimming100mFreestyleTime: '', swimming200mFreestyleTime: '',
    swimming400mFreestyleTime: '', swimming800mFreestyleTime: '', swimming1500mFreestyleTime: '',
    swimming50mBackstrokeTime: '', swimming100mBackstrokeTime: '', swimming200mBackstrokeTime: '',
    swimming50mBreaststrokeTime: '', swimming100mBreaststrokeTime: '', swimming200mBreaststrokeTime: '',
    swimming50mButterflyTime: '', swimming100mButterflyTime: '', swimming200mButterflyTime: '',
    swimming200mIndividualMedleyTime: '', swimming400mIndividualMedleyTime: '',
    // Verification metadata
    verifications: {},
    // Competition history
    competitionHistory: [],
    // Media
    photos: [], videos: [],
  };

  const [formData, setFormData] = useState(defaultForm);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDescription, setUploadDescription] = useState('');
  const [pendingUploads, setPendingUploads] = useState([]);
  const [uploadType, setUploadType] = useState('');

  // Competition history form
  const [newComp, setNewComp] = useState({ meetName: '', date: '', event: '', placing: '', time: '' });

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const uid = isMyProfile ? user?.uid : userId;
      if (!uid) return;
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const d = snap.data();
        setFormData({
          ...defaultForm,
          ...Object.fromEntries(Object.keys(defaultForm).map((k) => [k, d[k] ?? defaultForm[k]])),
        });
      } else if (isMyProfile && user) {
        setFormData((prev) => ({ ...prev, email: user.email || '', name: user.displayName || '' }));
      }
    };
    if ((isMyProfile && user) || (!isMyProfile && userId)) fetchUser();
  }, [user, userId, isMyProfile]);

  const saveProfile = async () => {
    if (!user?.uid) return;
    await setDoc(doc(db, 'users', user.uid), { ...formData, email: user.email }, { merge: true });
    setEditing(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData({ ...formData, profile_pic: reader.result });
    reader.readAsDataURL(file);
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
      verifications: {
        ...prev.verifications,
        [field]: { status, meetName },
      },
    }));
  };

  const isUnderserved = UNDERSERVED_STATES.has(formData.state);

  // Times that have a value entered
  const enteredTimes = SWIM_EVENTS.filter((e) => formData[e.field]?.trim());

  // Primary event field
  const primaryEventObj = SWIM_EVENTS.find((e) => e.label === formData.primaryEvent);
  const primaryBestTime = primaryEventObj ? formData[primaryEventObj.field] : null;

  if (!user) {
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

  const inputCls = (disabled) =>
    `w-full p-3 rounded-lg border text-sm transition-all focus:outline-none ${
      disabled
        ? 'border-transparent bg-transparent text-gray-800 cursor-default'
        : 'border-gray-200 bg-white focus:ring-2 focus:ring-[#1565C0] focus:border-[#1565C0]'
    }`;

  const selectCls = (disabled) =>
    `w-full p-3 rounded-lg border text-sm transition-all focus:outline-none ${
      disabled
        ? 'border-transparent bg-transparent text-gray-800 cursor-default appearance-none'
        : 'border-gray-200 bg-white focus:ring-2 focus:ring-[#1565C0]'
    }`;

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F7FF]">
      <Header />
      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">

        {/* ── Profile Header Card ─────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-blue-100">
          {/* Banner */}
          <div className="h-28 bg-gradient-to-r from-[#0B2E4E] via-[#1565C0] to-[#0B2E4E]" />
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
              {/* Avatar */}
              <div className="relative shrink-0">
                <Avatar className="w-24 h-24 border-4 border-white shadow-lg rounded-full">
                  <AvatarImage src={formData.profile_pic || 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg'} alt="profile" />
                  <AvatarFallback className="bg-[#0B2E4E] text-white text-2xl">{formData.name?.[0]}</AvatarFallback>
                </Avatar>
                {isMyProfile && (
                  <label className="absolute bottom-0 right-0 bg-amber-400 text-[#0B2E4E] rounded-full p-1.5 cursor-pointer shadow">
                    <IoCamera size={14} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 mt-4 md:mt-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-2xl font-extrabold text-[#0B2E4E]">{formData.name || 'Unnamed Athlete'}</h2>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${formData.type === 'Athlete' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {formData.type || 'Athlete'}
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

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                {isMyProfile && (
                  <Button
                    onClick={() => (editing ? saveProfile() : setEditing(true))}
                    className="bg-[#0B2E4E] text-white hover:bg-[#0d3a5c] text-sm"
                  >
                    {editing ? 'Save Profile' : 'Edit Profile'}
                  </Button>
                )}
                {!isMyProfile && (
                  <Button
                    onClick={() => navigate(`/chat/${userId}`)}
                    className="bg-amber-400 text-[#0B2E4E] hover:bg-amber-300 font-bold text-sm"
                  >
                    Message
                  </Button>
                )}
                {editing && (
                  <Button onClick={() => setEditing(false)} variant="outline" className="text-sm">
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bio & Identity Fields ──────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
          <h3 className="text-sm font-bold text-[#0B2E4E] uppercase tracking-wider mb-4">Profile Details</h3>

          {/* Physical stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Age', field: 'age', placeholder: 'e.g. 18' },
              { label: 'Height (cm)', field: 'height', placeholder: 'e.g. 178' },
              { label: 'Weight (kg)', field: 'weight', placeholder: 'e.g. 68' },
              { label: 'Wingspan (cm)', field: 'reach', placeholder: 'e.g. 185' },
            ].map(({ label, field, placeholder }) => (
              <div key={field} className={`rounded-xl p-3 text-center ${editing ? 'border border-gray-200' : 'bg-blue-50'}`}>
                <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
                {editing ? (
                  <input
                    type="text"
                    value={formData[field]}
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                    className="w-full text-center text-lg font-bold text-[#0B2E4E] focus:outline-none bg-transparent"
                    placeholder={placeholder}
                  />
                ) : (
                  <div className="text-lg font-bold text-[#0B2E4E]">{formData[field] || '—'}</div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
              <select disabled={!editing} value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className={selectCls(!editing)}>
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Account Type</label>
              <select disabled={!editing} value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className={selectCls(!editing)}>
                <option value="">Select type</option>
                <option>Athlete</option>
                <option>Scout</option>
                <option>Coach</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">State / Region</label>
              <select disabled={!editing} value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className={selectCls(!editing)}>
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
              <input disabled={!editing} type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className={inputCls(!editing)} placeholder="e.g. Pune" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Club Name</label>
              <input disabled={!editing} type="text" value={formData.clubName} onChange={(e) => setFormData({ ...formData, clubName: e.target.value })} className={inputCls(!editing)} placeholder="e.g. Aqua Tigers Swimming Club" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Coach Name</label>
              <input disabled={!editing} type="text" value={formData.coachName} onChange={(e) => setFormData({ ...formData, coachName: e.target.value })} className={inputCls(!editing)} placeholder="Coach's full name" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
            <textarea disabled={!editing} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className={`${inputCls(!editing)} resize-none`} rows={2} placeholder="Short bio — your goals, background, current training focus..." />
          </div>
        </div>

        {/* ── Event Specialization ───────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
          <h3 className="text-sm font-bold text-[#0B2E4E] uppercase tracking-wider mb-4">Event Specialization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Primary Event</label>
              <select disabled={!editing} value={formData.primaryEvent} onChange={(e) => setFormData({ ...formData, primaryEvent: e.target.value })} className={selectCls(!editing)}>
                <option value="">Select primary event</option>
                {SWIM_EVENTS.map((e) => <option key={e.label}>{e.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Secondary Event</label>
              <select disabled={!editing} value={formData.secondaryEvent} onChange={(e) => setFormData({ ...formData, secondaryEvent: e.target.value })} className={selectCls(!editing)}>
                <option value="">Select secondary event</option>
                {SWIM_EVENTS.map((e) => <option key={e.label}>{e.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Benchmark Panel ────────────────────────────────── */}
        {formData.primaryEvent && primaryBestTime && (
          <BenchmarkPanel
            event={formData.primaryEvent}
            time={primaryBestTime}
            gender={formData.gender}
          />
        )}

        {/* ── Verified Times ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
          <h3 className="text-sm font-bold text-[#0B2E4E] uppercase tracking-wider mb-4">Swim Times</h3>

          {/* Time entry grid when editing */}
          {editing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {SWIM_EVENTS.map(({ label, field }) => {
                const verif = formData.verifications?.[field] || {};
                return (
                  <div key={field} className="border border-gray-100 rounded-xl p-3">
                    <div className="text-xs font-medium text-gray-600 mb-2">{label}</div>
                    <input
                      type="text"
                      value={formData[field]}
                      onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565C0] mb-2"
                      placeholder="e.g. 53.42 or 1:54.32"
                    />
                    {formData[field] && (
                      <div className="space-y-1">
                        <select
                          value={verif.status || ''}
                          onChange={(e) => setVerification(field, e.target.value)}
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

          {/* Display table */}
          {enteredTimes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-2 pr-4">Event</th>
                    <th className="pb-2 pr-4">Best Time</th>
                    <th className="pb-2 pr-4">Verification</th>
                    <th className="pb-2">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {enteredTimes.map(({ label, field }) => {
                    const verif = formData.verifications?.[field] || {};
                    const isPrimary = label === formData.primaryEvent;
                    return (
                      <tr key={field} className={`border-b border-gray-50 ${isPrimary ? 'bg-blue-50' : ''}`}>
                        <td className="py-2.5 pr-4 font-medium text-[#0B2E4E]">
                          {label}
                          {isPrimary && <span className="ml-2 text-xs text-blue-500 font-normal">Primary</span>}
                        </td>
                        <td className="py-2.5 pr-4 font-bold text-[#0B2E4E]">{formData[field]}</td>
                        <td className="py-2.5 pr-4"><VerificationBadge status={verif.status} /></td>
                        <td className="py-2.5 text-gray-400 text-xs">{verif.meetName || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              {editing ? 'Enter your swim times above to build your profile.' : 'No times recorded yet.'}
            </div>
          )}
        </div>

        {/* ── Competition History ─────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
          <h3 className="text-sm font-bold text-[#0B2E4E] uppercase tracking-wider mb-4">Competition History</h3>

          {editing && (
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
                <input type="text" placeholder="Time *" value={newComp.time} onChange={(e) => setNewComp({ ...newComp, time: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1565C0]" />
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
                    {editing && <th className="pb-2" />}
                  </tr>
                </thead>
                <tbody>
                  {formData.competitionHistory.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50">
                      <td className="py-2.5 pr-4 font-medium text-gray-800">{c.meetName}</td>
                      <td className="py-2.5 pr-4 text-gray-500">{c.date}</td>
                      <td className="py-2.5 pr-4 text-gray-600">{c.event}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.placing === '1st' ? 'bg-amber-100 text-amber-700' : c.placing === '2nd' ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-600'}`}>
                          {c.placing || '—'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 font-bold text-[#0B2E4E]">{c.time}</td>
                      {editing && (
                        <td className="py-2.5">
                          <button onClick={() => removeCompetition(c.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <X size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              {editing ? 'Add competition results using the form above.' : 'No competition history recorded.'}
            </div>
          )}
        </div>

        {/* ── Media ──────────────────────────────────────────── */}
        {(formData.videos?.length > 0 || formData.photos?.length > 0 || (isMyProfile && editing)) && (
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
            <h3 className="text-sm font-bold text-[#0B2E4E] uppercase tracking-wider mb-4">Video Highlights & Photos</h3>

            {isMyProfile && editing && (
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
                  <video src={item.url} controls className="w-full rounded-xl border shadow-sm" />
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
    </div>
  );
}
