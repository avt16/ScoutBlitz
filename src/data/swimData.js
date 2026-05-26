// Shared swimming data constants — imported by ProgressFeed, ScoutApp, etc.

export const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Chandigarh','Jammu & Kashmir','Ladakh','Puducherry',
];

export const UNDERSERVED_STATES = new Set([
  'Uttar Pradesh','Bihar','Rajasthan','Madhya Pradesh','Jharkhand','Chhattisgarh',
  'Odisha','Assam','Manipur','Nagaland','Mizoram','Meghalaya','Tripura',
  'Arunachal Pradesh','Sikkim','Himachal Pradesh','Uttarakhand',
]);

export const SWIM_EVENTS = [
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

export const SWIM_EVENT_LABELS = SWIM_EVENTS.map((e) => e.label);

export const SWIM_EVENT_FIELDS = Object.fromEntries(
  SWIM_EVENTS.map(({ label, field }) => [label, field])
);

export const BENCHMARKS = {
  '50m Freestyle':          { male: { nationalB: 25.00, nationalA: 23.50, europeanClub: 24.20, d1NCAA: 22.50 }, female: { nationalB: 28.50, nationalA: 27.00, europeanClub: 27.80, d1NCAA: 25.50 } },
  '100m Freestyle':         { male: { nationalB: 54.00, nationalA: 51.50, europeanClub: 52.50, d1NCAA: 49.50 }, female: { nationalB: 62.00, nationalA: 59.00, europeanClub: 60.00, d1NCAA: 56.00 } },
  '200m Freestyle':         { male: { nationalB: 118.0, nationalA: 113.0, europeanClub: 115.0, d1NCAA: 107.0 }, female: { nationalB: 132.0, nationalA: 127.0, europeanClub: 129.0, d1NCAA: 121.0 } },
  '400m Freestyle':         { male: { nationalB: 252.0, nationalA: 240.0, europeanClub: 244.0, d1NCAA: 232.0 }, female: { nationalB: 280.0, nationalA: 268.0, europeanClub: 272.0, d1NCAA: 259.0 } },
  '800m Freestyle':         { male: { nationalB: 540.0, nationalA: 514.0, europeanClub: 522.0, d1NCAA: 499.0 }, female: { nationalB: 580.0, nationalA: 553.0, europeanClub: 560.0, d1NCAA: 535.0 } },
  '1500m Freestyle':        { male: { nationalB: 1020.0, nationalA: 968.0, europeanClub: 985.0, d1NCAA: 935.0 }, female: { nationalB: 1140.0, nationalA: 1080.0, europeanClub: 1100.0, d1NCAA: 1050.0 } },
  '100m Backstroke':        { male: { nationalB: 62.00, nationalA: 58.50, europeanClub: 60.00, d1NCAA: 56.00 }, female: { nationalB: 70.00, nationalA: 66.50, europeanClub: 68.00, d1NCAA: 63.00 } },
  '200m Backstroke':        { male: { nationalB: 136.0, nationalA: 127.5, europeanClub: 131.0, d1NCAA: 123.0 }, female: { nationalB: 153.0, nationalA: 145.0, europeanClub: 148.0, d1NCAA: 140.0 } },
  '100m Breaststroke':      { male: { nationalB: 70.00, nationalA: 66.00, europeanClub: 68.00, d1NCAA: 63.00 }, female: { nationalB: 79.00, nationalA: 75.00, europeanClub: 77.00, d1NCAA: 72.00 } },
  '200m Breaststroke':      { male: { nationalB: 152.0, nationalA: 144.0, europeanClub: 147.0, d1NCAA: 138.0 }, female: { nationalB: 170.0, nationalA: 162.0, europeanClub: 165.0, d1NCAA: 157.0 } },
  '100m Butterfly':         { male: { nationalB: 58.00, nationalA: 55.00, europeanClub: 56.50, d1NCAA: 52.00 }, female: { nationalB: 66.00, nationalA: 62.50, europeanClub: 64.00, d1NCAA: 59.00 } },
  '200m Butterfly':         { male: { nationalB: 128.0, nationalA: 121.0, europeanClub: 124.0, d1NCAA: 115.0 }, female: { nationalB: 145.0, nationalA: 137.0, europeanClub: 140.0, d1NCAA: 131.0 } },
  '200m Individual Medley': { male: { nationalB: 126.0, nationalA: 119.0, europeanClub: 122.0, d1NCAA: 113.0 }, female: { nationalB: 143.0, nationalA: 135.0, europeanClub: 138.0, d1NCAA: 130.0 } },
  '400m Individual Medley': { male: { nationalB: 272.0, nationalA: 258.0, europeanClub: 264.0, d1NCAA: 250.0 }, female: { nationalB: 307.0, nationalA: 291.0, europeanClub: 297.0, d1NCAA: 283.0 } },
};

export const parseTime = (str) => {
  if (!str || str.trim() === '') return null;
  const s = str.trim();
  if (s.includes(':')) {
    const [m, sec] = s.split(':');
    return parseFloat(m) * 60 + parseFloat(sec);
  }
  const v = parseFloat(s);
  return isNaN(v) ? null : v;
};

export const fmtSecs = (secs) => {
  if (secs === null || isNaN(secs)) return '';
  if (secs >= 60) {
    const m = Math.floor(secs / 60);
    const s = (secs % 60).toFixed(2).padStart(5, '0');
    return `${m}:${s}`;
  }
  return secs.toFixed(2);
};

export const getVerificationLevel = (user) => {
  const v = user?.verifications || {};
  const statuses = Object.values(v).map((x) => x?.status).filter(Boolean);
  if (statuses.includes('meet')) return 'meet';
  if (statuses.includes('coach')) return 'coach';
  return null;
};

export const getBestTimeForEvent = (user, event) => {
  if (!event || !user) return null;
  const field = SWIM_EVENT_FIELDS[event];
  return field ? user[field] || null : null;
};

// Display helper: take a raw time string from user input, return a canonical
// "m:ss.xx" or "ss.xx" string. If the input can't be parsed, returns the
// original string so we don't silently swallow data.
export const formatTime = (str) => {
  if (!str || typeof str !== 'string') return '';
  const secs = parseTime(str);
  return secs === null ? str : fmtSecs(secs);
};

// World record times (in seconds) as of 2025. Used by SmartTimeInput to flag
// impossibly fast entries. Long-course pool, men's & women's open category.
// Source: World Aquatics / FINA — rounded down conservatively to allow for
// updates. If an athlete's time is faster than this, they're either a record
// holder (~zero people on the platform) or they fat-fingered the input.
export const WORLD_RECORDS = {
  '50m Freestyle':          { male: 20.91, female: 23.61 },
  '100m Freestyle':         { male: 46.40, female: 51.71 },
  '200m Freestyle':         { male: 102.00, female: 112.98 },
  '400m Freestyle':         { male: 220.07, female: 235.38 },
  '800m Freestyle':         { male: 452.12, female: 484.79 },
  '1500m Freestyle':        { male: 868.19, female: 920.48 },
  '50m Backstroke':         { male: 23.55, female: 26.86 },
  '100m Backstroke':        { male: 51.60, female: 57.13 },
  '200m Backstroke':        { male: 111.92, female: 124.12 },
  '50m Breaststroke':       { male: 25.95, female: 29.16 },
  '100m Breaststroke':      { male: 56.88, female: 64.13 },
  '200m Breaststroke':      { male: 125.48, female: 138.95 },
  '50m Butterfly':          { male: 22.27, female: 24.43 },
  '100m Butterfly':         { male: 49.45, female: 55.18 },
  '200m Butterfly':         { male: 110.34, female: 121.81 },
  '200m Individual Medley': { male: 114.00, female: 125.50 },
  '400m Individual Medley': { male: 243.42, female: 266.12 },
};

// Smart parser that accepts the casual formats athletes use:
//   "54"        → 54.00
//   "54.32"     → 54.32
//   "0:54.32"   → 54.32
//   "1:54.32"   → 114.32
//   "1.54.32"   → 114.32  (people type periods instead of colons)
// Returns null on garbage.
export const parseTimeSmart = (input) => {
  if (input === null || input === undefined) return null;
  const s = String(input).trim();
  if (!s) return null;

  // Replace "1.54.32" → "1:54.32" if there are 2 dots
  const dotCount = (s.match(/\./g) || []).length;
  let normalised = s;
  if (dotCount === 2 && !s.includes(':')) {
    const i = s.indexOf('.');
    normalised = s.slice(0, i) + ':' + s.slice(i + 1);
  }

  if (normalised.includes(':')) {
    const [m, sec] = normalised.split(':');
    const minutes = parseFloat(m);
    const seconds = parseFloat(sec);
    if (isNaN(minutes) || isNaN(seconds) || minutes < 0 || seconds < 0 || seconds >= 60) return null;
    return minutes * 60 + seconds;
  }
  const v = parseFloat(normalised);
  return isNaN(v) || v < 0 ? null : v;
};

// Validate a parsed time against the world record for the event.
// Returns { ok: true } or { ok: false, reason: '...' }.
export const validateTime = (secs, event, gender, course = 'LCM') => {
  if (secs === null || secs === undefined) return { ok: false, reason: 'Invalid time format' };
  if (secs <= 0) return { ok: false, reason: 'Time must be greater than zero' };
  const wr = (course === 'SCM' ? SCM_WORLD_RECORDS : WORLD_RECORDS)[event];
  if (!wr) return { ok: true };
  const gk = gender === 'Female' ? 'female' : 'male';
  if (secs < wr[gk]) {
    return {
      ok: false,
      reason: `Faster than the current ${course} world record (${fmtSecs(wr[gk])}). Double-check your entry.`,
    };
  }
  return { ok: true };
};

// ─── SCM (25m / short course) world records ──────────────────────────────────
// As of 2024–2025, source: World Aquatics. Rounded conservatively. Used for
// FINA point base times and SmartTimeInput validation when the course is SCM.
export const SCM_WORLD_RECORDS = {
  '50m Freestyle':          { male: 19.90,  female: 22.83 },
  '100m Freestyle':         { male: 44.84,  female: 49.96 },
  '200m Freestyle':         { male: 99.37,  female: 109.55 },
  '400m Freestyle':         { male: 211.18, female: 230.81 },
  '800m Freestyle':         { male: 433.92, female: 471.65 },
  '1500m Freestyle':        { male: 826.36, female: 901.36 },
  '50m Backstroke':         { male: 22.11,  female: 25.23 },
  '100m Backstroke':        { male: 48.33,  female: 53.98 },
  '200m Backstroke':        { male: 105.63, female: 116.59 },
  '50m Breaststroke':       { male: 24.95,  female: 28.37 },
  '100m Breaststroke':      { male: 55.28,  female: 61.92 },
  '200m Breaststroke':      { male: 121.07, female: 134.57 },
  '50m Butterfly':          { male: 21.32,  female: 23.78 },
  '100m Butterfly':         { male: 47.78,  female: 53.67 },
  '200m Butterfly':         { male: 105.97, female: 119.61 },
  '200m Individual Medley': { male: 109.63, female: 121.86 },
  '400m Individual Medley': { male: 234.58, female: 256.16 },
};

// ─── Course constants ────────────────────────────────────────────────────────
export const COURSES = ['LCM', 'SCM'];   // long course (50m) | short course (25m)
export const COURSE_LABELS = { LCM: 'Long Course (50m)', SCM: 'Short Course (25m)' };
export const COURSE_LABELS_SHORT = { LCM: 'LCM', SCM: 'SCM' };

// SCM time field naming: legacy fields = LCM (kept as source of truth for
// long-course data); new fields suffixed _SCM hold short-course times.
//   getEventField('100m Freestyle', 'LCM') → 'swimming100mFreestyleTime'
//   getEventField('100m Freestyle', 'SCM') → 'swimming100mFreestyleTime_SCM'
export const getEventField = (event, course = 'LCM') => {
  const base = SWIM_EVENT_FIELDS[event];
  if (!base) return null;
  return course === 'SCM' ? base + '_SCM' : base;
};

export const SWIM_EVENT_FIELDS_SCM = Object.fromEntries(
  SWIM_EVENTS.map(({ label, field }) => [label, field + '_SCM']),
);

// Read a time for a specific (event, course). Returns null if missing.
export const getEventTime = (user, event, course = 'LCM') => {
  const f = getEventField(event, course);
  return f ? (user?.[f] || null) : null;
};

// All events the user has a time for (in either course).
export const getEventsWithTimes = (user) => {
  if (!user) return [];
  const out = [];
  for (const { label } of SWIM_EVENTS) {
    if (getEventTime(user, label, 'LCM')?.trim() || getEventTime(user, label, 'SCM')?.trim()) {
      out.push(label);
    }
  }
  return out;
};

// ─── FINA Points ─────────────────────────────────────────────────────────────
// Standard FINA points formula:
//   points = 1000 × (worldRecord / athleteTime)^3
// A world-record swim → 1000 pts. Half the world-record speed → 125 pts.
// Course-aware: SCM times are compared against SCM world records.
export const computeFinaPoints = (timeStr, event, course, gender) => {
  const secs = parseTimeSmart(timeStr);
  if (!secs || secs <= 0) return 0;
  const records = course === 'SCM' ? SCM_WORLD_RECORDS : WORLD_RECORDS;
  const wr = records[event]?.[gender === 'Female' ? 'female' : 'male'];
  if (!wr) return 0;
  return Math.round(1000 * Math.pow(wr / secs, 3));
};

// For a given event, return whichever course gives the higher FINA points.
// Returns { points, course, time } or null if no time is logged.
export const getBestFinaForEvent = (user, event) => {
  const gender = user?.gender;
  const lcmTime = getEventTime(user, event, 'LCM');
  const scmTime = getEventTime(user, event, 'SCM');
  const lcmPts = lcmTime ? computeFinaPoints(lcmTime, event, 'LCM', gender) : 0;
  const scmPts = scmTime ? computeFinaPoints(scmTime, event, 'SCM', gender) : 0;
  if (lcmPts === 0 && scmPts === 0) return null;
  if (scmPts > lcmPts) return { points: scmPts, course: 'SCM', time: scmTime };
  return { points: lcmPts, course: 'LCM', time: lcmTime };
};

// Athlete FINA score = average of best 4 events' FINA points.
// If fewer than 4 events have times, average over what's available.
export const computeAthleteFinaScore = (user) => {
  const events = getEventsWithTimes(user);
  const points = events
    .map((ev) => getBestFinaForEvent(user, ev))
    .filter(Boolean)
    .map((b) => b.points)
    .sort((a, b) => b - a)
    .slice(0, 4);
  if (!points.length) return 0;
  return Math.round(points.reduce((s, p) => s + p, 0) / points.length);
};

// Returns events ranked by best FINA points (descending). Used for event
// suggestion ("your top events by international competitiveness").
export const rankEventsByFina = (user) => {
  return getEventsWithTimes(user)
    .map((ev) => {
      const best = getBestFinaForEvent(user, ev);
      return best ? { event: ev, ...best } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.points - a.points);
};

// Suggest a primary + secondary event based on FINA points.
export const suggestEvents = (user) => {
  const ranked = rankEventsByFina(user);
  return {
    primary:   ranked[0] || null,
    secondary: ranked[1] || null,
    all:       ranked,
  };
};

// Override of getBestTimeForEvent so callers automatically pick the
// higher-FINA course. Backwards-compatible signature.
export const getBestTimeForEventAuto = (user, event) => {
  const best = getBestFinaForEvent(user, event);
  return best ? best.time : null;
};
