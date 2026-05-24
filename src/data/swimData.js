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
