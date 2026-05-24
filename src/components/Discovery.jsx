import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './FireBase';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ShieldCheck, Shield, Star, SlidersHorizontal, X } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';

// ─── Constants ────────────────────────────────────────────────────────────────

const UNDERSERVED_STATES = new Set([
  'Uttar Pradesh','Bihar','Rajasthan','Madhya Pradesh','Jharkhand','Chhattisgarh',
  'Odisha','Assam','Manipur','Nagaland','Mizoram','Meghalaya','Tripura',
  'Arunachal Pradesh','Sikkim','Himachal Pradesh','Uttarakhand',
]);

const SWIM_EVENTS = [
  '50m Freestyle','100m Freestyle','200m Freestyle','400m Freestyle','800m Freestyle','1500m Freestyle',
  '50m Backstroke','100m Backstroke','200m Backstroke',
  '50m Breaststroke','100m Breaststroke','200m Breaststroke',
  '50m Butterfly','100m Butterfly','200m Butterfly',
  '200m Individual Medley','400m Individual Medley',
];

const SWIM_EVENT_FIELDS = {
  '50m Freestyle': 'swimming50mFreestyleTime',
  '100m Freestyle': 'swimming100mFreestyleTime',
  '200m Freestyle': 'swimming200mFreestyleTime',
  '400m Freestyle': 'swimming400mFreestyleTime',
  '800m Freestyle': 'swimming800mFreestyleTime',
  '1500m Freestyle': 'swimming1500mFreestyleTime',
  '50m Backstroke': 'swimming50mBackstrokeTime',
  '100m Backstroke': 'swimming100mBackstrokeTime',
  '200m Backstroke': 'swimming200mBackstrokeTime',
  '50m Breaststroke': 'swimming50mBreaststrokeTime',
  '100m Breaststroke': 'swimming100mBreaststrokeTime',
  '200m Breaststroke': 'swimming200mBreaststrokeTime',
  '50m Butterfly': 'swimming50mButterflyTime',
  '100m Butterfly': 'swimming100mButterflyTime',
  '200m Butterfly': 'swimming200mButterflyTime',
  '200m Individual Medley': 'swimming200mIndividualMedleyTime',
  '400m Individual Medley': 'swimming400mIndividualMedleyTime',
};

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Chandigarh','Jammu & Kashmir','Ladakh','Puducherry',
];

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

const getVerificationLevel = (user) => {
  const v = user.verifications || {};
  const statuses = Object.values(v).map((x) => x?.status).filter(Boolean);
  if (statuses.includes('meet')) return 'meet';
  if (statuses.includes('coach')) return 'coach';
  return null;
};

const getBestTimeForEvent = (user, event) => {
  if (!event) return null;
  const field = SWIM_EVENT_FIELDS[event];
  if (!field) return null;
  return user[field] || null;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function VerifBadge({ level }) {
  if (level === 'meet') {
    return (
      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
        <ShieldCheck size={11} /> Meet Verified
      </span>
    );
  }
  if (level === 'coach') {
    return (
      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
        <Shield size={11} /> Coach Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-400 text-xs px-2 py-0.5 rounded-full">
      Unverified
    </span>
  );
}

function AthleteCard({ user, onNavigate, onMessage, shortlisted, onShortlist, filterEvent }) {
  const verifLevel = getVerificationLevel(user);
  const isUnderserved = UNDERSERVED_STATES.has(user.state);

  const displayEvent = filterEvent || user.primaryEvent;
  const displayTime = displayEvent ? getBestTimeForEvent(user, displayEvent) : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {/* Card header banner */}
      <div className="h-16 bg-gradient-to-r from-[#0B2E4E] to-[#1565C0] relative">
        <button
          onClick={(e) => { e.stopPropagation(); onShortlist(user.id); }}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
          title={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
        >
          <Star size={14} className={shortlisted ? 'text-amber-400 fill-amber-400' : 'text-white'} />
        </button>
      </div>

      <div className="px-4 pb-4 -mt-8 flex-1 flex flex-col">
        {/* Avatar + name */}
        <div className="flex items-end gap-3 mb-3">
          <Avatar className="w-14 h-14 border-3 border-white shadow-md rounded-full shrink-0">
            <AvatarImage src={user.profile_pic || 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg'} alt={user.name} />
            <AvatarFallback className="bg-[#0B2E4E] text-white font-bold">{user.name?.[0] || 'S'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 mt-8">
            <h3 className="font-bold text-[#0B2E4E] text-sm leading-tight truncate">{user.name}</h3>
            <div className="text-xs text-gray-500">
              {user.age && <span>Age {user.age}</span>}
              {user.age && user.state && <span> · </span>}
              {user.state && <span>{user.state}</span>}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <VerifBadge level={verifLevel} />
          {isUnderserved && (
            <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full">
              🌊 Grassroots
            </span>
          )}
          {user.gender && (
            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{user.gender}</span>
          )}
        </div>

        {/* Primary event + time */}
        {displayEvent ? (
          <div className="bg-blue-50 rounded-xl p-3 mb-3 flex-1">
            <div className="text-xs text-gray-500 mb-0.5">{filterEvent ? 'Filtered Event' : 'Primary Event'}</div>
            <div className="font-bold text-[#0B2E4E] text-sm">{displayEvent}</div>
            {displayTime ? (
              <div className="text-2xl font-extrabold text-[#1565C0] mt-0.5">{displayTime}</div>
            ) : (
              <div className="text-sm text-gray-400 mt-0.5">No time recorded</div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-300 text-xs py-4">
            No event set
          </div>
        )}

        {/* Club / coach */}
        {(user.clubName || user.coachName) && (
          <div className="text-xs text-gray-400 mb-3 truncate">
            {user.clubName || ''}{user.clubName && user.coachName ? ' · ' : ''}{user.coachName ? `Coach: ${user.coachName}` : ''}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-[#0B2E4E] text-white hover:bg-[#0d3a5c] text-xs h-8"
            onClick={() => onNavigate(user.id)}
          >
            View Profile
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="px-2 h-8 border-gray-200"
            onClick={(e) => { e.stopPropagation(); onMessage(user.id); }}
            title="Message athlete"
          >
            <MessageCircle size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function Discovery() {
  const [athletes, setAthletes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [shortlisted, setShortlisted] = useState(new Set());
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(true);
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterAgeMin, setFilterAgeMin] = useState('');
  const [filterAgeMax, setFilterAgeMax] = useState('');
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [filterUnderservedOnly, setFilterUnderservedOnly] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const data = [];
        snap.forEach((doc) => {
          const d = doc.data();
          if (d.type === 'Athlete') data.push({ ...d, id: doc.id });
        });
        setAthletes(data);
        setFiltered(data);
      } catch (e) {
        console.error('Firebase error:', e);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    let result = athletes;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) => u.name?.toLowerCase().includes(q) || u.state?.toLowerCase().includes(q) || u.primaryEvent?.toLowerCase().includes(q)
      );
    }

    if (filterEvent) {
      result = result.filter((u) => {
        const field = SWIM_EVENT_FIELDS[filterEvent];
        return field && u[field];
      });
    }

    if (filterGender) result = result.filter((u) => u.gender === filterGender);
    if (filterState) result = result.filter((u) => u.state === filterState);

    if (filterAgeMin) result = result.filter((u) => parseInt(u.age) >= parseInt(filterAgeMin));
    if (filterAgeMax) result = result.filter((u) => parseInt(u.age) <= parseInt(filterAgeMax));

    if (filterVerifiedOnly) {
      result = result.filter((u) => getVerificationLevel(u) !== null);
    }

    if (filterUnderservedOnly) {
      result = result.filter((u) => UNDERSERVED_STATES.has(u.state));
    }

    setFiltered(result);
  }, [search, filterEvent, filterGender, filterState, filterAgeMin, filterAgeMax, filterVerifiedOnly, filterUnderservedOnly, athletes]);

  const toggleShortlist = (id) => {
    setShortlisted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch(''); setFilterEvent(''); setFilterGender(''); setFilterState('');
    setFilterAgeMin(''); setFilterAgeMax(''); setFilterVerifiedOnly(false); setFilterUnderservedOnly(false);
  };

  const displayAthletes = activeTab === 'shortlisted'
    ? filtered.filter((u) => shortlisted.has(u.id))
    : filtered;

  const hasActiveFilters = search || filterEvent || filterGender || filterState || filterAgeMin || filterAgeMax || filterVerifiedOnly || filterUnderservedOnly;

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1565C0]';

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F7FF]">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0B2E4E]">Scout Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {filtered.length} athlete{filtered.length !== 1 ? 's' : ''} found · {shortlisted.size} shortlisted
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${showFilters ? 'bg-[#0B2E4E] text-white border-[#0B2E4E]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              <SlidersHorizontal size={15} /> Filters
              {hasActiveFilters && <span className="bg-amber-400 text-[#0B2E4E] text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">!</span>}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-blue-100 w-fit">
          {[
            { key: 'all', label: `All Athletes (${filtered.length})` },
            { key: 'shortlisted', label: `Shortlisted (${shortlisted.size})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === key ? 'bg-[#0B2E4E] text-white' : 'text-gray-600 hover:text-gray-800'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Filter Sidebar */}
          {showFilters && (
            <div className="w-64 shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5 sticky top-20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-[#0B2E4E] uppercase tracking-wider">Filters</h2>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <X size={11} /> Clear all
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Search */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                    <input type="text" placeholder="Name, state, event..." value={search} onChange={(e) => setSearch(e.target.value)} className={inputCls} />
                  </div>

                  {/* Event */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Event</label>
                    <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} className={inputCls}>
                      <option value="">Any event</option>
                      {SWIM_EVENTS.map((e) => <option key={e}>{e}</option>)}
                    </select>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
                    <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className={inputCls}>
                      <option value="">Any</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">State / Region</label>
                    <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className={inputCls}>
                      <option value="">All India</option>
                      {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Age range */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Age Range</label>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Min" value={filterAgeMin} onChange={(e) => setFilterAgeMin(e.target.value)} className={`${inputCls} w-1/2`} min={10} max={40} />
                      <input type="number" placeholder="Max" value={filterAgeMax} onChange={(e) => setFilterAgeMax(e.target.value)} className={`${inputCls} w-1/2`} min={10} max={40} />
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => setFilterVerifiedOnly((v) => !v)}
                        className={`w-8 h-4 rounded-full relative transition-colors ${filterVerifiedOnly ? 'bg-green-500' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${filterVerifiedOnly ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                      <span className="text-xs font-medium text-gray-700">Verified only</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => setFilterUnderservedOnly((v) => !v)}
                        className={`w-8 h-4 rounded-full relative transition-colors ${filterUnderservedOnly ? 'bg-amber-500' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${filterUnderservedOnly ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                      <span className="text-xs font-medium text-gray-700">Underserved regions only</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Athlete Grid */}
          <div className="flex-1 min-w-0">
            {displayAthletes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayAthletes.map((user) => (
                  <AthleteCard
                    key={user.id}
                    user={user}
                    onNavigate={(id) => navigate(`/profile/${id}`)}
                    onMessage={(id) => navigate(`/chat/${id}`)}
                    shortlisted={shortlisted.has(user.id)}
                    onShortlist={toggleShortlist}
                    filterEvent={filterEvent || null}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                {activeTab === 'shortlisted' && shortlisted.size === 0 ? (
                  <>
                    <Star size={40} className="text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No athletes shortlisted yet</p>
                    <p className="text-gray-400 text-sm mt-1">Star athletes on their cards to shortlist them.</p>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-3">🏊</div>
                    <p className="text-gray-500 font-medium">No athletes match these filters</p>
                    <button onClick={clearFilters} className="mt-3 text-sm text-[#1565C0] hover:underline">Clear filters</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Discovery;
