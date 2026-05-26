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
  parseTime, parseTimeSmart, fmtSecs, formatTime,
  COURSES, COURSE_LABELS_SHORT,
  getEventField, getEventTime, getEventsWithTimes,
  computeFinaPoints, getBestFinaForEvent,
  computeAthleteFinaScore, suggestEvents, rankEventsByFina,
} from '../data/swimData';
import SmartTimeInput from './SmartTimeInput';
import Onboarding from './Onboarding';

// ─── Module-level constants (don't recreate on every render — bug A7) ────────

// Legacy swim-time fields = LCM (long course). SCM fields use _SCM suffix.
const _LCM_FIELDS = Object.fromEntries(SWIM_EVENTS.map(({ field }) => [field, '']));
const _SCM_FIELDS = Object.fromEntries(SWIM_EVENTS.map(({ field }) => [field + '_SCM', '']));

const DEFAULT_FORM = {
  email: '', type: 'Athlete', name: '', bio: '', gender: '',
  state: '', city: '', height: '', weight: '', reach: '',
  profile_pic: '', age: '',
  primaryEvent: '', secondaryEvent: '',
  clubName: '', coachName: '',
  contactEmail: '',
  ..._LCM_FIELDS,
  ..._SCM_FIELDS,
  verifications: {},        // { fieldName: { status, meetName } } — covers both LCM and SCM keys
  competitionHistory: [],    // see schema below
  photos: [], videos: [],
  profileViews: 0,
  profileViewsThisWeek: 0,
  profileViewEvents: [],
  onboardingCompleted: false,
};

// Competition history schema (v2 — multi-event per meet):
//   { id, meetName, date, course: 'LCM'|'SCM', verified: boolean,
//     results: [{ event, time, placing }] }
// v1 entries (flat shape with .event/.time/.placing on the top object) are
// auto-migrated on load into a single-result v2 entry.

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

// ─── Athlete FINA score + event suggestion card ─────────────────────────────

function FinaScoreCard({ score, ranking, suggestion, isMyProfile, currentPrimary, currentSecondary, onApplySuggestion }) {
  // The suggestion is "useful" if the platform's choice differs from what the
  // athlete currently has set. Otherwise it's just a vanity confirmation.
  const suggestedPrimary   = suggestion?.primary?.event   || null;
  const suggestedSecondary = suggestion?.secondary?.event || null;
  const primaryDiffers   = suggestedPrimary   && suggestedPrimary   !== currentPrimary;
  const secondaryDiffers = suggestedSecondary && suggestedSecondary !== currentSecondary;
  const hasUsefulSuggestion = primaryDiffers || secondaryDiffers;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-blue-50 rounded-2xl border border-amber-200 p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-0.5">FINA Score</div>
          <div className="text-4xl font-extrabold text-[#0B2E4E] leading-none">{score || '—'}</div>
          <div className="text-xs text-gray-500 mt-1">
            Average of your best 4 events. World-record pace = 1000.
          </div>
        </div>
        {ranking.length > 0 && (
          <div className="flex-1 min-w-[200px]">
            <div className="text-xs font-semibold text-gray-600 mb-1">Top events</div>
            <div className="space-y-1">
              {ranking.slice(0, 4).map(({ event, points, course }) => (
                <div key={event} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 truncate">{event}</span>
                  <span className="ml-2 shrink-0">
                    <span className={`text-[10px] font-semibold px-1 py-0.5 rounded mr-1 ${
                      course === 'LCM' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>{course}</span>
                    <span className="font-semibold text-amber-700">{points}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggestion sub-panel — only renders if there's something useful to suggest */}
      {isMyProfile && hasUsefulSuggestion && (
        <div className="mt-4 bg-white rounded-xl border border-amber-200 p-3">
          <div className="text-xs font-bold text-[#0B2E4E] mb-1.5">Suggested events</div>
          <p className="text-xs text-gray-600 mb-2">
            Based on your FINA points, your strongest events look different to what you've
            currently set. Scouts filter by primary event — make sure it shows what you're best at.
          </p>
          <div className="space-y-1 text-xs">
            {primaryDiffers && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 shrink-0">Primary:</span>
                <span className="font-semibold text-[#0B2E4E]">{suggestedPrimary}</span>
                <span className="text-amber-700 font-semibold">({suggestion.primary.points} pts)</span>
              </div>
            )}
            {secondaryDiffers && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 shrink-0">Secondary:</span>
                <span className="font-semibold text-[#0B2E4E]">{suggestedSecondary || '—'}</span>
                {suggestion.secondary && (
                  <span className="text-amber-700 font-semibold">({suggestion.secondary.points} pts)</span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => onApplySuggestion(suggestedPrimary || currentPrimary, suggestedSecondary || currentSecondary)}
            className="mt-3 px-3 py-1.5 bg-[#0B2E4E] text-white rounded-md text-xs font-semibold hover:bg-[#0d3a5c]"
          >
            Apply suggestion
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Where You Stand — toggle-able benchmark panel ───────────────────────────

function WhereYouStandPanel({ formData, eventRanking }) {
  // Default to the event with the highest FINA points (Fix 7).
  const [selectedEvent, setSelectedEvent] = useState(() => eventRanking[0]?.event || formData.primaryEvent);

  // If the ranking changes (e.g. user adds new times), keep selection valid.
  useEffect(() => {
    if (!eventRanking.find((e) => e.event === selectedEvent)) {
      setSelectedEvent(eventRanking[0]?.event || '');
    }
  }, [eventRanking, selectedEvent]);

  const best = selectedEvent ? getBestFinaForEvent(formData, selectedEvent) : null;
  if (!best) return null;

  return (
    <div className="space-y-2">
      {/* Event selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Where You Stand</span>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="bg-white border border-gray-200 rounded-md px-2 py-1 text-xs font-semibold text-[#0B2E4E] focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
        >
          {eventRanking.map(({ event, course, points }) => (
            <option key={event} value={event}>
              {event} — {course} ({points} FINA)
            </option>
          ))}
        </select>
        <span className="text-[10px] text-gray-400">
          Showing your stronger of LCM/SCM by FINA points
        </span>
      </div>

      <BenchmarkPanel event={selectedEvent} time={best.time} gender={formData.gender} />
    </div>
  );
}

// ─── Competition history — add form (v2: multi-event per meet) ──────────────

function AddCompetitionForm({ newComp, setNewComp, toggleNewCompEvent, updateNewCompResult, onSubmit }) {
  const [expanded, setExpanded] = useState(false);
  const canSubmit = newComp.meetName?.trim() && newComp.selectedEvents.length > 0 &&
                    newComp.selectedEvents.some((ev) => newComp.results?.[ev]?.time?.trim());

  return (
    <div className="bg-blue-50 rounded-xl p-4 mb-4">
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-[#0B2E4E] py-2 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <Plus size={14} /> Log a Competition
        </button>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-[#0B2E4E] uppercase tracking-wide">Log a Competition</div>
            <button onClick={() => setExpanded(false)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>

          {/* Step 1: meet name + date + course */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
            <input
              type="text" placeholder="Meet name *"
              value={newComp.meetName}
              onChange={(e) => setNewComp((p) => ({ ...p, meetName: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
            />
            <input
              type="date"
              value={newComp.date}
              onChange={(e) => setNewComp((p) => ({ ...p, date: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
            />
            <select
              value={newComp.course}
              onChange={(e) => setNewComp((p) => ({ ...p, course: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
            >
              <option value="LCM">Long Course (50m)</option>
              <option value="SCM">Short Course (25m)</option>
            </select>
          </div>

          {/* Step 2: pick events */}
          <div className="mb-3">
            <div className="text-[11px] font-semibold text-gray-600 mb-1.5">Events raced ({newComp.selectedEvents.length}):</div>
            <div className="flex flex-wrap gap-1.5">
              {SWIM_EVENTS.map(({ label }) => {
                const selected = newComp.selectedEvents.includes(label);
                return (
                  <button
                    key={label}
                    onClick={() => toggleNewCompEvent(label)}
                    className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                      selected
                        ? 'bg-[#0B2E4E] text-white border-[#0B2E4E]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#1565C0]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: time + placing per selected event */}
          {newComp.selectedEvents.length > 0 && (
            <div className="mb-3 space-y-2">
              <div className="text-[11px] font-semibold text-gray-600">Times for each event:</div>
              {newComp.selectedEvents.map((event) => {
                const r = newComp.results?.[event] || {};
                return (
                  <div key={event} className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-12 md:col-span-5 text-xs font-medium text-[#0B2E4E]">{event}</span>
                    <input
                      type="text" placeholder="Time *"
                      value={r.time || ''}
                      onChange={(e) => updateNewCompResult(event, 'time', e.target.value)}
                      className="col-span-7 md:col-span-4 border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
                    />
                    <input
                      type="text" placeholder="Placing"
                      value={r.placing || ''}
                      onChange={(e) => updateNewCompResult(event, 'placing', e.target.value)}
                      className="col-span-5 md:col-span-3 border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <button
              disabled={!canSubmit}
              onClick={() => { onSubmit(); setExpanded(false); }}
              className="flex-1 bg-[#0B2E4E] text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#0d3a5c] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save Competition
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Competition entry card (display) ────────────────────────────────────────

function CompetitionEntryCard({ entry, gender, isMyProfile, onRemove }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div>
          <div className="font-semibold text-[#0B2E4E] text-sm">{entry.meetName}</div>
          <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2">
            {entry.date && <span>{entry.date}</span>}
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              entry.course === 'SCM' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {entry.course || 'LCM'}
            </span>
            {/* Item #9 stub — explanatory message when not yet verified */}
            {entry.verified ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                <ShieldCheck size={9} /> Verified Meet
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
                title="We couldn't find this competition in our database of recent Indian meets."
              >
                <AlertCircle size={9} /> Unverified
              </span>
            )}
          </div>
        </div>
        {isMyProfile && (
          <button onClick={onRemove} className="text-gray-400 hover:text-red-500">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="pb-1.5 pr-3">Event</th>
              <th className="pb-1.5 pr-3">Time</th>
              <th className="pb-1.5 pr-3">FINA</th>
              <th className="pb-1.5">Place</th>
            </tr>
          </thead>
          <tbody>
            {(entry.results || []).map((r, i) => {
              const placeColor = PLACE_COLORS[r.placing] || 'bg-gray-100 text-gray-600';
              // FINA points may have been computed at save time; recompute as fallback
              const pts = r.finaPoints ?? computeFinaPoints(r.time, r.event, entry.course || 'LCM', gender);
              return (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="py-1.5 pr-3 font-medium text-gray-800">{r.event}</td>
                  <td className="py-1.5 pr-3 font-bold text-[#0B2E4E]">
                    {formatTime(r.time)}
                    {r.isPB && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-1 py-0.5 rounded">
                        🏆 PB
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 pr-3 font-semibold text-amber-700">{pts || '—'}</td>
                  <td className="py-1.5">
                    {r.placing ? (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${placeColor}`}>
                        {r.placing}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Event time entry card (LCM + SCM side by side) ─────────────────────────

function EventTimeCard({
  event, formData, setFormData, setVerification,
  dirtyFields, focusedField, fieldHandlers, onRequestVerify,
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-3">
      <div className="text-xs font-semibold text-[#0B2E4E] mb-2">{event}</div>
      <div className="grid grid-cols-2 gap-2">
        {COURSES.map((course) => (
          <CourseSlot
            key={course}
            event={event}
            course={course}
            formData={formData}
            setFormData={setFormData}
            setVerification={setVerification}
            dirtyFields={dirtyFields}
            focusedField={focusedField}
            fieldHandlers={fieldHandlers}
            onRequestVerify={onRequestVerify}
          />
        ))}
      </div>
    </div>
  );
}

function CourseSlot({
  event, course, formData, setFormData, setVerification,
  dirtyFields, focusedField, fieldHandlers, onRequestVerify,
}) {
  const field = getEventField(event, course);
  const time = formData[field] || '';
  const verif = formData.verifications?.[field] || {};
  const isDirty = dirtyFields.has(field);
  const isFocused = focusedField === field;
  const finaPoints = time ? computeFinaPoints(time, event, course, formData.gender) : 0;
  const isVerified = verif.status === 'meet' || verif.status === 'coach';

  const cue = isFocused
    ? 'border-amber-400 ring-2 ring-amber-200'
    : isDirty
      ? 'border-amber-400 border-l-4 border-l-amber-400'
      : 'border-gray-200';

  return (
    <div className={`relative bg-gray-50 rounded-lg p-2 border transition-all ${cue}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
          course === 'LCM' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
        }`}>
          {course}
        </span>
        {isFocused && (
          <span className="text-[9px] font-semibold text-amber-600 uppercase">Editing</span>
        )}
        {!isFocused && isDirty && (
          <span className="text-[9px] font-semibold text-amber-700">● Unsaved</span>
        )}
      </div>
      <div {...fieldHandlers(field)}>
        <SmartTimeInput
          value={time}
          onChange={(v) => setFormData((prev) => ({ ...prev, [field]: v }))}
          event={event}
          course={course}
          gender={formData.gender}
          showHint={false}
          placeholder={course === 'LCM' ? 'Long course' : 'Short course'}
          className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#1565C0]"
        />
      </div>
      {time && (
        <>
          <div className="mt-1 text-[10px] text-amber-700 font-semibold">
            {finaPoints} FINA
          </div>
          <select
            value={verif.status || ''}
            onChange={(e) => setVerification(field, e.target.value, verif.meetName)}
            className="mt-1 w-full border border-gray-200 rounded px-1.5 py-0.5 text-[10px] bg-white focus:outline-none"
          >
            <option value="">Unverified</option>
            <option value="coach">Coach</option>
            <option value="meet">Meet</option>
          </select>
          {!isVerified && (
            <button
              onClick={() => onRequestVerify(field, time)}
              className="mt-1 w-full text-[10px] text-[#1565C0] hover:text-[#0B2E4E] flex items-center justify-center gap-0.5"
              title="Request coach verification"
            >
              <MessageSquare size={9} /> Verify
            </button>
          )}
        </>
      )}
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
  // New competition entry — v2 shape
  // results: { [event]: { time, placing } } during entry; flattened to array on save.
  const [newComp, setNewComp] = useState({
    meetName: '', date: '', course: 'LCM',
    selectedEvents: [],                  // event labels the swimmer raced
    results:        {},                  // { [event]: { time, placing } }
  });
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
        // Migrate v1 competition history → v2 (multi-event per meet)
        merged.competitionHistory = migrateCompetitionHistory(merged.competitionHistory);
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
  // Entered (event, course) pairs that have a time. Sorted by FINA pts desc
  // so the athlete's strongest swims show first.
  const enteredTimes = useMemo(() => {
    const out = [];
    for (const { label } of SWIM_EVENTS) {
      for (const course of COURSES) {
        const field = getEventField(label, course);
        const time = formData[field]?.trim();
        if (time) {
          const finaPoints = computeFinaPoints(time, label, course, formData.gender);
          out.push({ label, field, course, time, finaPoints });
        }
      }
    }
    return out.sort((a, b) => b.finaPoints - a.finaPoints);
  }, [formData]);

  // Athlete's overall FINA score (avg of best 4 events) — surfaced as a card
  const athleteFina = useMemo(() => computeAthleteFinaScore(formData), [formData]);

  // Event ranking for the suggestion panel
  const eventRanking = useMemo(() => rankEventsByFina(formData), [formData]);
  const eventSuggestion = useMemo(() => suggestEvents(formData), [formData]);

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

  // Save a competition entry. For every result that beats the athlete's
  // existing best for that (event, course), write it back to the swim time
  // field — that's the PB propagation flow (item #2).
  const addCompetition = () => {
    const events = (newComp.selectedEvents || []).filter(Boolean);
    if (!newComp.meetName || events.length === 0) return;

    // Build the results array, marking which results are PBs and computing
    // FINA points for each.
    const results = [];
    const pbUpdates = {};   // { fieldName: newTime } — applied to formData
    for (const event of events) {
      const r = newComp.results?.[event] || {};
      if (!r.time?.trim()) continue;
      const field = getEventField(event, newComp.course);
      const prevTime = formData[field]?.trim();
      const prevSecs = prevTime ? parseTimeSmart(prevTime) : null;
      const newSecs  = parseTimeSmart(r.time);
      const isPB = newSecs !== null && (prevSecs === null || newSecs < prevSecs);
      if (isPB) pbUpdates[field] = r.time;
      results.push({
        event,
        time:        r.time.trim(),
        placing:     r.placing?.trim() || '',
        finaPoints:  computeFinaPoints(r.time, event, newComp.course, formData.gender),
        isPB,
      });
    }
    if (results.length === 0) return;

    const newEntry = {
      id:       Date.now().toString(),
      meetName: newComp.meetName.trim(),
      date:     newComp.date || '',
      course:   newComp.course || 'LCM',
      verified: false,              // item #9 lives here, populated later
      results,
    };

    setFormData((prev) => ({
      ...prev,
      ...pbUpdates,
      competitionHistory: [newEntry, ...(prev.competitionHistory || [])],
    }));

    setNewComp({ meetName: '', date: '', course: 'LCM', selectedEvents: [], results: {} });
  };

  // Toggle whether an event is part of the new competition entry
  const toggleNewCompEvent = (event) => {
    setNewComp((prev) => {
      const has = prev.selectedEvents.includes(event);
      const next = {
        ...prev,
        selectedEvents: has
          ? prev.selectedEvents.filter((e) => e !== event)
          : [...prev.selectedEvents, event],
      };
      // Clean up the results entry when removing an event
      if (has) {
        const { [event]: _drop, ...rest } = prev.results;
        next.results = rest;
      }
      return next;
    });
  };

  const updateNewCompResult = (event, key, value) => {
    setNewComp((prev) => ({
      ...prev,
      results: {
        ...prev.results,
        [event]: { ...(prev.results[event] || {}), [key]: value },
      },
    }));
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

        {/* ── Athlete FINA score + suggested events ───────────────────── */}
        {(athleteFina > 0 || eventRanking.length > 0) && (
          <FinaScoreCard
            score={athleteFina}
            ranking={eventRanking}
            suggestion={eventSuggestion}
            isMyProfile={isMyProfile}
            currentPrimary={formData.primaryEvent}
            currentSecondary={formData.secondaryEvent}
            onApplySuggestion={(primary, secondary) =>
              setFormData((prev) => ({ ...prev, primaryEvent: primary, secondaryEvent: secondary }))
            }
          />
        )}

        {/* ── Where You Stand (toggle-able across all events) ─────────── */}
        {eventRanking.length > 0 && (
          <WhereYouStandPanel formData={formData} eventRanking={eventRanking} />
        )}

        {/* ── Swim Times ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
            <h3 className="text-sm font-bold text-[#0B2E4E] uppercase tracking-wider">Swim Times</h3>
            <p className="text-[11px] text-gray-500">
              Enter <span className="font-semibold text-[#0B2E4E]">long course (50m)</span> and{' '}
              <span className="font-semibold text-[#0B2E4E]">short course (25m)</span> separately.
              FINA points are computed against the world record for each course.
            </p>
          </div>

          {/* Smart time entry grid — one card per event, both courses inside */}
          {isMyProfile && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 mt-3">
              {SWIM_EVENTS.map(({ label }) => (
                <EventTimeCard
                  key={label}
                  event={label}
                  formData={formData}
                  setFormData={setFormData}
                  setVerification={setVerification}
                  dirtyFields={dirtyFields}
                  focusedField={focusedField}
                  fieldHandlers={fieldHandlers}
                  onRequestVerify={(field, time) => setVerifyTarget({ field, label, time })}
                />
              ))}
            </div>
          )}

          {/* Times table — one row per (event, course) with a time */}
          {enteredTimes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-2 pr-4">Event</th>
                    <th className="pb-2 pr-4">Course</th>
                    <th className="pb-2 pr-4">Time</th>
                    <th className="pb-2 pr-4">FINA</th>
                    <th className="pb-2 pr-4">Verification</th>
                    <th className="pb-2">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {enteredTimes.map(({ label, field, course, time, finaPoints }) => {
                    const verif = formData.verifications?.[field] || {};
                    const isPrimary = label === formData.primaryEvent;
                    return (
                      <tr key={field} className={`border-b border-gray-50 ${isPrimary ? 'bg-blue-50' : ''}`}>
                        <td className="py-2.5 pr-4 font-medium text-[#0B2E4E]">
                          {label}
                          {isPrimary && <span className="ml-2 text-xs text-blue-500 font-normal">Primary</span>}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                            course === 'LCM' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {course}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-bold text-[#0B2E4E]">{formatTime(time)}</td>
                        <td className="py-2.5 pr-4 font-semibold text-amber-700">{finaPoints || '—'}</td>
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
              {isMyProfile ? 'Enter your swim times above to build your profile.' : 'No times recorded yet.'}
            </div>
          )}
        </div>

        {/* ── Competition History (v2 — multi-event per meet) ────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
          <h3 className="text-sm font-bold text-[#0B2E4E] uppercase tracking-wider mb-4">Competition History</h3>

          {isMyProfile && (
            <AddCompetitionForm
              newComp={newComp}
              setNewComp={setNewComp}
              toggleNewCompEvent={toggleNewCompEvent}
              updateNewCompResult={updateNewCompResult}
              onSubmit={addCompetition}
            />
          )}

          {(formData.competitionHistory?.length > 0) ? (
            <div className="space-y-3">
              {formData.competitionHistory.map((c) => (
                <CompetitionEntryCard
                  key={c.id}
                  entry={c}
                  gender={formData.gender}
                  isMyProfile={isMyProfile}
                  onRemove={() => removeCompetition(c.id)}
                />
              ))}
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

// ── Migrate v1 competition history → v2 (multi-event per meet) ─────────────
// v1: { id, meetName, date, event, placing, time }
// v2: { id, meetName, date, course, verified, results: [{event, placing, time}] }
function migrateCompetitionHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.map((entry) => {
    if (Array.isArray(entry?.results)) return entry;  // already v2
    return {
      id:       entry.id || (Date.now() + Math.random()).toString(),
      meetName: entry.meetName || '',
      date:     entry.date || '',
      course:   entry.course || 'LCM',   // legacy entries default to long course
      verified: false,
      results:  entry.event ? [{
        event:   entry.event,
        time:    entry.time || '',
        placing: entry.placing || '',
      }] : [],
    };
  });
}

// ── ISO week number — used to roll over the "this week" view counter ───────

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
