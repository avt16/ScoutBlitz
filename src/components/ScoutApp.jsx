import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from './FireBase';
import {
  collection, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, query, where, increment,
} from 'firebase/firestore';
import { signOut, getAuth } from 'firebase/auth';
import {
  SWIM_EVENTS, SWIM_EVENT_FIELDS, BENCHMARKS,
  UNDERSERVED_STATES, INDIAN_STATES,
  parseTime, fmtSecs, formatTime, getVerificationLevel, getBestTimeForEvent,
} from '../data/swimData';
import {
  Search, Star, X, LogOut, Users, Waves,
  List, LayoutGrid, Printer, Plus, Trash2,
  ChevronDown, FileText, SlidersHorizontal, Check, BarChart2,
} from 'lucide-react';

// ─── Small shared components ──────────────────────────────────────────────────

function VerifBadge({ level }) {
  if (level === 'meet')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-900 text-emerald-300 border border-emerald-700">
        ✓ Meet
      </span>
    );
  if (level === 'coach')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-900 text-blue-300 border border-blue-700">
        ✓ Coach
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-gray-500 bg-gray-800 border border-gray-700">
      Unverified
    </span>
  );
}

function GrassBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-900 text-amber-300 border border-amber-700">
      Grassroots
    </span>
  );
}

// ─── Top navigation bar ───────────────────────────────────────────────────────

function ScoutTopNav({ scoutName, scoutView, setScoutView, onLogout }) {
  return (
    <div className="bg-[#0D1F35] border-b border-[#1E3A5F] h-14 flex items-center px-5 gap-3 shrink-0">
      <div className="flex items-center gap-2 mr-4">
        <div className="bg-amber-400 rounded-md p-1">
          <Waves size={16} className="text-[#0A1628]" />
        </div>
        <span className="font-bold text-white text-base tracking-tight">SwimBlitz</span>
        <span className="text-xs text-gray-500 ml-0.5">Scout</span>
      </div>

      <button
        onClick={() => setScoutView('dashboard')}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          scoutView === 'dashboard'
            ? 'bg-[#1E3A5F] text-white'
            : 'text-gray-400 hover:text-white hover:bg-[#1E3A5F]/60'
        }`}
      >
        Dashboard
      </button>
      <button
        onClick={() => setScoutView('shortlists')}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          scoutView === 'shortlists'
            ? 'bg-[#1E3A5F] text-white'
            : 'text-gray-400 hover:text-white hover:bg-[#1E3A5F]/60'
        }`}
      >
        Shortlists
      </button>

      <div className="ml-auto flex items-center gap-3">
        <span className="text-sm text-gray-500">
          {scoutName}
        </span>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-[#1E3A5F]"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </div>
  );
}

// ─── Filter sidebar ───────────────────────────────────────────────────────────

function FilterSidebar({
  search, setSearch,
  filterEvent, setFilterEvent,
  filterGender, setFilterGender,
  filterState, setFilterState,
  filterAgeMin, setFilterAgeMin,
  filterAgeMax, setFilterAgeMax,
  filterVerifiedOnly, setFilterVerifiedOnly,
  filterUnderservedOnly, setFilterUnderservedOnly,
  filterTimeMin, setFilterTimeMin,
  filterTimeMax, setFilterTimeMax,
  resultCount,
}) {
  const clearAll = () => {
    setSearch(''); setFilterEvent(''); setFilterGender('');
    setFilterState(''); setFilterAgeMin(''); setFilterAgeMax('');
    setFilterVerifiedOnly(false); setFilterUnderservedOnly(false);
    setFilterTimeMin(''); setFilterTimeMax('');
  };

  return (
    <aside className="w-60 shrink-0 bg-[#0D1F35] border-r border-[#1E3A5F] overflow-y-auto p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <SlidersHorizontal size={11} /> Filters
        </span>
        <button onClick={clearAll} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
          Clear all
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-2.5 text-gray-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="w-full bg-[#0A1628] border border-[#1E3A5F] rounded-md pl-8 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>

      {/* Event */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Event</label>
        <select
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
          className="w-full bg-[#0A1628] border border-[#1E3A5F] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
        >
          <option value="">All events</option>
          {SWIM_EVENTS.map((e) => (
            <option key={e.label} value={e.label}>{e.label}</option>
          ))}
        </select>
      </div>

      {/* Time range — only active when an event is selected */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Time Range</label>
        <div className="flex gap-2 items-center">
          <input
            disabled={!filterEvent}
            value={filterTimeMin}
            onChange={(e) => setFilterTimeMin(e.target.value)}
            placeholder="e.g. 52.00"
            className={`w-full bg-[#0A1628] border border-[#1E3A5F] rounded-md px-2 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors ${!filterEvent ? 'opacity-40 cursor-not-allowed' : ''}`}
          />
          <span className="text-gray-600 text-sm shrink-0">–</span>
          <input
            disabled={!filterEvent}
            value={filterTimeMax}
            onChange={(e) => setFilterTimeMax(e.target.value)}
            placeholder="e.g. 1:00.00"
            className={`w-full bg-[#0A1628] border border-[#1E3A5F] rounded-md px-2 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors ${!filterEvent ? 'opacity-40 cursor-not-allowed' : ''}`}
          />
        </div>
        {!filterEvent ? (
          <p className="text-[10px] text-gray-600 mt-1">Select an event above to filter by time</p>
        ) : (
          <p className="text-[10px] text-gray-600 mt-1">
            Accepts <span className="font-mono">54.32</span> or <span className="font-mono">1:54.32</span>
          </p>
        )}
      </div>

      {/* Gender */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Gender</label>
        <div className="flex gap-2">
          {['', 'male', 'female'].map((g) => (
            <button
              key={g}
              onClick={() => setFilterGender(g)}
              className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${
                filterGender === g
                  ? 'border-amber-500 bg-amber-900/30 text-amber-300'
                  : 'border-[#1E3A5F] text-gray-400 hover:border-gray-500'
              }`}
            >
              {g === '' ? 'Any' : g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* State */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">State</label>
        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className="w-full bg-[#0A1628] border border-[#1E3A5F] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
        >
          <option value="">All states</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Age range */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Age Range</label>
        <div className="flex gap-2 items-center">
          <input
            type="number" min="10" max="40"
            value={filterAgeMin}
            onChange={(e) => setFilterAgeMin(e.target.value)}
            placeholder="Min"
            className="w-full bg-[#0A1628] border border-[#1E3A5F] rounded-md px-2 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <span className="text-gray-600 text-sm shrink-0">–</span>
          <input
            type="number" min="10" max="40"
            value={filterAgeMax}
            onChange={(e) => setFilterAgeMax(e.target.value)}
            placeholder="Max"
            className="w-full bg-[#0A1628] border border-[#1E3A5F] rounded-md px-2 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Toggle switches */}
      <div className="flex flex-col gap-3">
        {[
          { val: filterVerifiedOnly, set: setFilterVerifiedOnly, label: 'Verified times only' },
          { val: filterUnderservedOnly, set: setFilterUnderservedOnly, label: 'Grassroots regions' },
        ].map(({ val, set, label }) => (
          <label key={label} className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => set(!val)}
              className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${val ? 'bg-amber-500' : 'bg-[#1E3A5F]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow ${val ? 'left-4' : 'left-0.5'}`} />
            </div>
            <span className="text-sm text-gray-300">{label}</span>
          </label>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-[#1E3A5F]">
        <div className="text-xs text-gray-500 text-center">
          {resultCount} result{resultCount !== 1 ? 's' : ''}
        </div>
      </div>
    </aside>
  );
}

// ─── Dense table ──────────────────────────────────────────────────────────────

function AthleteTable({ athletes, isShortlisted, onOpen, onToggleShortlist, activeShortlist }) {
  return (
    <div className="rounded-lg border border-[#1E3A5F] overflow-hidden print-table">
      <table className="w-full text-sm">
        <thead className="bg-[#0D1F35] text-gray-400 text-xs uppercase tracking-wider">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Athlete</th>
            <th className="px-4 py-2.5 text-left font-medium">Age</th>
            <th className="px-4 py-2.5 text-left font-medium">State</th>
            <th className="px-4 py-2.5 text-left font-medium">Event</th>
            <th className="px-4 py-2.5 text-left font-medium">Best Time</th>
            <th className="px-4 py-2.5 text-left font-medium">Status</th>
            <th className="px-4 py-2.5 text-center font-medium w-10">★</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1E3A5F]">
          {athletes.map((athlete) => {
            const id = athlete.uid || athlete.id;
            const verif = getVerificationLevel(athlete);
            const underserved = UNDERSERVED_STATES.has(athlete.state);
            const bestTime = getBestTimeForEvent(athlete, athlete.primaryEvent);
            const starred = isShortlisted(id);
            return (
              <tr
                key={athlete.id}
                className="hover:bg-[#0D1F35] cursor-pointer transition-colors"
                onClick={() => onOpen(athlete)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{athlete.name || 'Unknown'}</div>
                  {athlete.clubName && (
                    <div className="text-xs text-gray-500">{athlete.clubName}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-300 text-sm">{athlete.age || '—'}</td>
                <td className="px-4 py-3">
                  <div className="text-xs text-gray-300">{athlete.state || '—'}</div>
                  {underserved && (
                    <div className="mt-0.5"><GrassBadge /></div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-300">{athlete.primaryEvent || '—'}</td>
                <td className="px-4 py-3">
                  <span className="font-mono font-semibold text-white">{bestTime ? formatTime(bestTime) : '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <VerifBadge level={verif} />
                </td>
                <td
                  className="px-4 py-3 text-center"
                  onClick={(e) => { e.stopPropagation(); onToggleShortlist(id, activeShortlist); }}
                >
                  <button
                    className={`transition-colors ${starred ? 'text-amber-400' : 'text-gray-600 hover:text-amber-400'}`}
                  >
                    <Star size={15} fill={starred ? 'currentColor' : 'none'} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Card grid ────────────────────────────────────────────────────────────────

function AthleteCards({ athletes, isShortlisted, onOpen, onToggleShortlist, activeShortlist }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
      {athletes.map((athlete) => {
        const id = athlete.uid || athlete.id;
        const verif = getVerificationLevel(athlete);
        const underserved = UNDERSERVED_STATES.has(athlete.state);
        const bestTime = getBestTimeForEvent(athlete, athlete.primaryEvent);
        const starred = isShortlisted(id);
        return (
          <div
            key={athlete.id}
            className="bg-[#0D1F35] border border-[#1E3A5F] rounded-lg p-4 hover:border-amber-500/40 cursor-pointer transition-all"
            onClick={() => onOpen(athlete)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0">
                <div className="font-semibold text-white text-sm truncate">{athlete.name || 'Unknown'}</div>
                <div className="text-xs text-gray-400">
                  {athlete.age ? `Age ${athlete.age}` : ''}
                  {athlete.age && athlete.state ? ' · ' : ''}
                  {athlete.state || 'India'}
                </div>
              </div>
              <button
                className={`shrink-0 ml-2 transition-colors ${starred ? 'text-amber-400' : 'text-gray-600 hover:text-amber-400'}`}
                onClick={(e) => { e.stopPropagation(); onToggleShortlist(id, activeShortlist); }}
              >
                <Star size={17} fill={starred ? 'currentColor' : 'none'} />
              </button>
            </div>
            <div className="text-xs text-gray-500 mb-1">{athlete.primaryEvent || 'No primary event'}</div>
            <div className="font-mono text-lg font-bold text-white mb-2">{bestTime ? formatTime(bestTime) : '—'}</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <VerifBadge level={verif} />
              {underserved && <GrassBadge />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Athlete detail panel (slide-over) ───────────────────────────────────────

function AthletePanel({ athlete, note, onNoteChange, shortlists, onToggleShortlist, onClose }) {
  const [showListDropdown, setShowListDropdown] = useState(false);
  const id = athlete.uid || athlete.id;
  const verif = getVerificationLevel(athlete);
  const underserved = UNDERSERVED_STATES.has(athlete.state);

  const eventTimes = useMemo(() =>
    SWIM_EVENTS.map(({ label, field }) => {
      const timeStr = athlete[field];
      if (!timeStr || !timeStr.trim()) return null;
      return { label, field, timeStr, eventVerif: athlete.verifications?.[field]?.status };
    }).filter(Boolean),
  [athlete]);

  const genderKey = athlete.gender?.toLowerCase() === 'female' ? 'female' : 'male';
  const primaryBm = useMemo(
    () => (athlete.primaryEvent ? BENCHMARKS[athlete.primaryEvent]?.[genderKey] : null),
    [athlete.primaryEvent, genderKey],
  );
  const primaryTimeSecs = useMemo(
    () => parseTime(getBestTimeForEvent(athlete, athlete.primaryEvent)),
    [athlete],
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[480px] max-w-[95vw] bg-[#0D1F35] border-l border-[#1E3A5F] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#1E3A5F] shrink-0">
          <div className="min-w-0">
            <div className="text-lg font-bold text-white">{athlete.name}</div>
            <div className="text-sm text-gray-400">
              {[athlete.age && `Age ${athlete.age}`, athlete.state, athlete.city].filter(Boolean).join(' · ')}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            {/* Shortlist dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowListDropdown(!showListDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-colors"
              >
                <Star size={11} />
                Shortlist
                <ChevronDown size={11} />
              </button>
              {showListDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#0A1628] border border-[#1E3A5F] rounded-lg shadow-xl z-10 overflow-hidden">
                  {Object.keys(shortlists).map((listName) => {
                    const inList = shortlists[listName].includes(id);
                    return (
                      <button
                        key={listName}
                        onClick={() => { onToggleShortlist(id, listName); setShowListDropdown(false); }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-gray-300 hover:bg-[#1E3A5F] transition-colors"
                      >
                        <span className="truncate">{listName}</span>
                        {inList && <Check size={13} className="text-amber-400 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#1E3A5F] transition-colors"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <VerifBadge level={verif} />
            {underserved && <GrassBadge />}
            {athlete.gender && (
              <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700 capitalize">
                {athlete.gender}
              </span>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Club',            value: athlete.clubName },
              { label: 'Coach',           value: athlete.coachName },
              { label: 'Primary Event',   value: athlete.primaryEvent },
              { label: 'Secondary Event', value: athlete.secondaryEvent },
              { label: 'Height',          value: athlete.height ? `${athlete.height} cm` : null },
              { label: 'Wingspan',        value: athlete.reach  ? `${athlete.reach} cm`  : null },
              { label: 'Contact Email',   value: athlete.contactEmail || null },
            ].filter((f) => f.value).map(({ label, value }) => (
              <div key={label} className="bg-[#0A1628] rounded-md px-3 py-2">
                <div className="text-[11px] text-gray-500">{label}</div>
                <div className="text-sm text-white font-medium mt-0.5 truncate">{value}</div>
              </div>
            ))}
          </div>

          {/* Primary event benchmark comparison */}
          {primaryBm && primaryTimeSecs !== null && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {athlete.primaryEvent} vs Benchmarks
              </div>
              <div className="space-y-1.5">
                {[
                  { key: 'nationalB',    label: 'National B'     },
                  { key: 'nationalA',    label: 'National A'     },
                  { key: 'europeanClub', label: 'European Club'  },
                  { key: 'd1NCAA',       label: 'D1 NCAA (USA)'  },
                ].map(({ key, label }) => {
                  const threshold = primaryBm[key];
                  if (!threshold) return null;
                  const achieved = primaryTimeSecs <= threshold;
                  const diff = primaryTimeSecs - threshold;
                  return (
                    <div
                      key={key}
                      className={`flex items-center justify-between px-3 py-2 rounded-md text-xs ${
                        achieved
                          ? 'bg-emerald-900/30 border border-emerald-700/40'
                          : 'bg-[#0A1628] border border-[#1E3A5F]'
                      }`}
                    >
                      <span className={achieved ? 'text-emerald-300' : 'text-gray-400'}>{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-mono">{fmtSecs(threshold)}</span>
                        {achieved ? (
                          <span className="text-emerald-400 font-bold">✓</span>
                        ) : (
                          <span className="text-gray-500 font-mono">+{diff.toFixed(2)}s</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All times */}
          {eventTimes.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">All Times</div>
              <div className="space-y-1">
                {eventTimes.map(({ label, timeStr, eventVerif }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-3 py-1.5 rounded-md bg-[#0A1628] border border-[#1E3A5F]"
                  >
                    <span className="text-xs text-gray-300">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-white">{formatTime(timeStr)}</span>
                      {eventVerif === 'meet'  && <span className="text-[10px] text-emerald-400">✓ Meet</span>}
                      {eventVerif === 'coach' && <span className="text-[10px] text-blue-400">✓ Coach</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competition history */}
          {athlete.competitionHistory?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Competition History
              </div>
              <div className="space-y-1.5">
                {[...athlete.competitionHistory].reverse().slice(0, 5).map((comp) => (
                  <div
                    key={comp.id}
                    className="flex items-center justify-between px-3 py-2 rounded-md bg-[#0A1628] border border-[#1E3A5F]"
                  >
                    <div>
                      <div className="text-xs text-white font-medium">{comp.meetName}</div>
                      <div className="text-[10px] text-gray-500">{comp.event} · {comp.date}</div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="font-mono text-sm text-white">{formatTime(comp.time)}</div>
                      {comp.placing && <div className="text-[10px] text-amber-400">{comp.placing}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {athlete.bio && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bio</div>
              <p className="text-sm text-gray-300 leading-relaxed">{athlete.bio}</p>
            </div>
          )}

          {/* Private notes */}
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <FileText size={11} /> Private Notes
            </div>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Add private notes about this athlete (only visible to you)…"
              rows={4}
              className="w-full bg-[#0A1628] border border-[#1E3A5F] rounded-md px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 resize-none transition-colors"
            />
            <div className="text-[10px] text-gray-600 mt-1">Auto-saved · Private to your account</div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Shortlists screen ────────────────────────────────────────────────────────

function ShortlistsScreen({
  shortlists, athletes, activeShortlist, setActiveShortlist,
  onAddList, onDeleteList, onToggleShortlist, onOpenAthlete, onPrint,
}) {
  const [newListName, setNewListName] = useState('');
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (showInput && inputRef.current) inputRef.current.focus();
  }, [showInput]);

  const handleAdd = () => {
    if (newListName.trim()) {
      onAddList(newListName.trim());
      setNewListName('');
      setShowInput(false);
    }
  };

  const listNames = Object.keys(shortlists);
  const currentIds = shortlists[activeShortlist] || [];
  const currentAthletes = athletes.filter((a) => currentIds.includes(a.uid || a.id));

  // Events where at least one shortlisted athlete has a time
  const relevantEvents = SWIM_EVENTS.filter(({ field }) =>
    currentAthletes.some((a) => a[field] && a[field].trim()),
  );

  return (
    <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Lists sidebar */}
      <aside className="w-52 shrink-0 bg-[#0D1F35] border-r border-[#1E3A5F] p-4 flex flex-col gap-1 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Your Lists</div>
        {listNames.map((name) => (
          <div
            key={name}
            className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer group transition-colors ${
              name === activeShortlist ? 'bg-[#1E3A5F] text-white' : 'text-gray-400 hover:bg-[#1E3A5F]/50'
            }`}
            onClick={() => setActiveShortlist(name)}
          >
            <span className="text-sm truncate">{name}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">{shortlists[name].length}</span>
              {listNames.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteList(name); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all ml-1"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          </div>
        ))}

        {showInput ? (
          <div className="flex gap-1 mt-2">
            <input
              ref={inputRef}
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="List name…"
              className="flex-1 bg-[#0A1628] border border-[#1E3A5F] rounded-md px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') { setShowInput(false); setNewListName(''); }
              }}
            />
            <button
              onClick={handleAdd}
              className="px-2 py-1.5 bg-amber-500 rounded-md text-[#0A1628] text-xs font-semibold hover:bg-amber-400 transition-colors"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-400 mt-2 px-3 py-2 transition-colors rounded-md"
          >
            <Plus size={11} /> New list
          </button>
        )}
      </aside>

      {/* Shortlist content */}
      <div className="flex-1 overflow-y-auto p-6 print-area">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">{activeShortlist}</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {currentAthletes.length} athlete{currentAthletes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onPrint}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-[#1E3A5F] text-gray-300 hover:text-white rounded-md transition-colors no-print"
          >
            <Printer size={14} />
            Export / Print
          </button>
        </div>

        {currentAthletes.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <Users size={42} className="mx-auto mb-3 opacity-25" />
            <p className="text-sm">No athletes in this list yet.</p>
            <p className="text-xs mt-1 text-gray-700">Star athletes from the dashboard to add them here.</p>
          </div>
        ) : (
          <>
            {/* Athlete cards */}
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mb-8">
              {currentAthletes.map((athlete) => {
                const id = athlete.uid || athlete.id;
                const verif = getVerificationLevel(athlete);
                const underserved = UNDERSERVED_STATES.has(athlete.state);
                const bestTime = getBestTimeForEvent(athlete, athlete.primaryEvent);
                return (
                  <div
                    key={athlete.id}
                    className="bg-[#0D1F35] border border-[#1E3A5F] rounded-lg p-4 cursor-pointer hover:border-amber-500/40 transition-colors"
                    onClick={() => onOpenAthlete(athlete)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-white text-sm truncate">{athlete.name}</div>
                        <div className="text-xs text-gray-400">
                          {athlete.age ? `Age ${athlete.age}` : ''}
                          {athlete.age && athlete.state ? ' · ' : ''}
                          {athlete.state || 'India'}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleShortlist(id, activeShortlist); }}
                        className="text-amber-400 hover:text-amber-300 ml-2 shrink-0 no-print"
                      >
                        <Star size={15} fill="currentColor" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">{athlete.primaryEvent || '—'}</div>
                    <div className="font-mono font-bold text-base text-white">{bestTime ? formatTime(bestTime) : '—'}</div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <VerifBadge level={verif} />
                      {underserved && <GrassBadge />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Contact info table — shows in print export */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                Contact Information
              </h3>
              <div className="rounded-lg border border-[#1E3A5F] overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-[#0D1F35]">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-gray-400 font-medium">Name</th>
                      <th className="px-4 py-2.5 text-left text-gray-400 font-medium">State</th>
                      <th className="px-4 py-2.5 text-left text-gray-400 font-medium">Club</th>
                      <th className="px-4 py-2.5 text-left text-gray-400 font-medium">Contact Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E3A5F]">
                    {currentAthletes.map((a) => (
                      <tr key={a.id} className="hover:bg-[#0D1F35]/50">
                        <td className="px-4 py-2 text-white font-medium">{a.name}</td>
                        <td className="px-4 py-2 text-gray-300">{a.state || '—'}</td>
                        <td className="px-4 py-2 text-gray-300">{a.clubName || '—'}</td>
                        <td className="px-4 py-2 text-amber-300 font-mono">{a.contactEmail || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Time comparison table */}
            {relevantEvents.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BarChart2 size={14} className="text-amber-400" />
                  Time Comparison
                </h3>
                <div className="rounded-lg border border-[#1E3A5F] overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#0D1F35]">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-gray-400 font-medium">Event</th>
                        {currentAthletes.map((a) => (
                          <th key={a.id} className="px-4 py-2.5 text-left text-gray-400 font-medium whitespace-nowrap">
                            {a.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E3A5F]">
                      {relevantEvents.map(({ label, field }) => {
                        const parsed = currentAthletes.map((a) => parseTime(a[field])).filter((v) => v !== null);
                        const fastest = parsed.length > 0 ? Math.min(...parsed) : null;
                        return (
                          <tr key={label} className="hover:bg-[#0D1F35]/50">
                            <td className="px-4 py-2 text-gray-300 font-medium">{label}</td>
                            {currentAthletes.map((a) => {
                              const secs = parseTime(a[field]);
                              const isBest = secs !== null && secs === fastest;
                              return (
                                <td
                                  key={a.id}
                                  className={`px-4 py-2 font-mono ${isBest ? 'text-amber-300 font-bold' : 'text-gray-400'}`}
                                >
                                  {a[field] || <span className="text-gray-700">—</span>}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Smart empty state ───────────────────────────────────────────────────────

function SmartEmptyState({
  filterVerifiedOnly, filterEvent, filterTimeMin, filterTimeMax, filterState,
  onClearVerified, onClearTimeRange, onClearState,
}) {
  let msg, sub, btnLabel, btnAction;

  if (filterVerifiedOnly) {
    msg = 'No verified athletes found.';
    sub = 'Try turning off "Verified times only" to see all athletes.';
    btnLabel = 'Turn off verified filter';
    btnAction = onClearVerified;
  } else if (filterEvent && (filterTimeMin || filterTimeMax)) {
    msg = 'No athletes found in this time range.';
    sub = 'Try widening your min/max times.';
    btnLabel = 'Clear time range';
    btnAction = onClearTimeRange;
  } else if (filterState) {
    msg = `No athletes found in ${filterState}.`;
    sub = 'Try searching all of India.';
    btnLabel = 'Search all states';
    btnAction = onClearState;
  } else {
    msg = 'No athletes match your filters.';
    sub = 'Try adjusting or clearing some filters.';
    btnLabel = null;
    btnAction = null;
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Users size={40} className="mb-3 text-gray-700 opacity-30" />
      <p className="text-sm text-gray-400 font-medium">{msg}</p>
      <p className="text-xs text-gray-600 mt-1">{sub}</p>
      {btnLabel && (
        <button
          onClick={btnAction}
          className="mt-4 px-4 py-1.5 text-xs bg-[#1E3A5F] text-amber-300 rounded-md hover:bg-[#2a4f7a] transition-colors"
        >
          {btnLabel}
        </button>
      )}
    </div>
  );
}

// ─── Main ScoutApp ────────────────────────────────────────────────────────────

export default function ScoutApp({ uid }) {
  const auth = getAuth();

  // View
  const [scoutView, setScoutView]           = useState('dashboard');
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [viewMode, setViewMode]             = useState('table');

  // Data
  const [athletes,  setAthletes]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [scoutName, setScoutName] = useState('Scout');

  // Filters
  const [search,             setSearch]             = useState('');
  const [filterEvent,        setFilterEvent]        = useState('');
  const [filterGender,       setFilterGender]       = useState('');
  const [filterState,        setFilterState]        = useState('');
  const [filterAgeMin,       setFilterAgeMin]       = useState('');
  const [filterAgeMax,       setFilterAgeMax]       = useState('');
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [filterUnderserved,  setFilterUnderserved]  = useState(false);
  const [filterTimeMin,      setFilterTimeMin]      = useState('');
  const [filterTimeMax,      setFilterTimeMax]      = useState('');

  // Shortlists  { listName: [uid, ...] }
  const [shortlists,      setShortlists]      = useState({ 'My Shortlist': [] });
  const [activeShortlist, setActiveShortlist] = useState('My Shortlist');

  // Notes  { athleteId: text }
  const [notes, setNotes] = useState({});
  const noteTimers = useRef({});

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const athleteQuery = query(collection(db, 'users'), where('type', '==', 'Athlete'));
      const [scoutDoc, sdDoc, notesDoc, snap] = await Promise.all([
        uid ? getDoc(doc(db, 'users', uid))      : Promise.resolve(null),
        uid ? getDoc(doc(db, 'scoutData', uid))  : Promise.resolve(null),
        uid ? getDoc(doc(db, 'scoutNotes', uid)) : Promise.resolve(null),
        getDocs(athleteQuery),
      ]);

      if (scoutDoc?.exists()) setScoutName(scoutDoc.data().name || 'Scout');
      if (sdDoc?.exists() && sdDoc.data().shortlists) setShortlists(sdDoc.data().shortlists);
      if (notesDoc?.exists() && notesDoc.data().athletes) setNotes(notesDoc.data().athletes);

      setAthletes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    load();
  }, [uid]);

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filtered = athletes.filter((a) => {
    if (search && !a.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterEvent) {
      const eventField = SWIM_EVENT_FIELDS[filterEvent];
      if (!eventField || !a[eventField] || !a[eventField].trim()) return false;
      const atSecs  = parseTime(a[eventField]);
      const minSecs = parseTime(filterTimeMin);
      const maxSecs = parseTime(filterTimeMax);
      if (minSecs !== null && atSecs !== null && atSecs < minSecs) return false;
      if (maxSecs !== null && atSecs !== null && atSecs > maxSecs) return false;
    }
    if (filterGender && a.gender?.toLowerCase() !== filterGender.toLowerCase()) return false;
    if (filterState && a.state !== filterState) return false;
    if (filterAgeMin && (!a.age || Number(a.age) < Number(filterAgeMin))) return false;
    if (filterAgeMax && (!a.age || Number(a.age) > Number(filterAgeMax))) return false;
    if (filterVerifiedOnly && !getVerificationLevel(a)) return false;
    if (filterUnderserved && !UNDERSERVED_STATES.has(a.state)) return false;
    return true;
  });

  // ── Shortlist helpers ────────────────────────────────────────────────────────
  const isShortlisted = (athleteId) =>
    Object.values(shortlists).some((list) => list.includes(athleteId));

  const toggleShortlist = async (athleteId, listName) => {
    const list = listName || activeShortlist;
    const updated = { ...shortlists };
    if (!updated[list]) updated[list] = [];
    const idx = updated[list].indexOf(athleteId);
    updated[list] = idx === -1
      ? [...updated[list], athleteId]
      : updated[list].filter((id) => id !== athleteId);
    setShortlists(updated);
    await setDoc(doc(db, 'scoutData', uid), { shortlists: updated }, { merge: true });
  };

  const addShortlist = async (name) => {
    if (!name || shortlists[name]) return;
    const updated = { ...shortlists, [name]: [] };
    setShortlists(updated);
    setActiveShortlist(name);
    await setDoc(doc(db, 'scoutData', uid), { shortlists: updated }, { merge: true });
  };

  const deleteShortlist = async (name) => {
    if (Object.keys(shortlists).length <= 1) return;
    const updated = { ...shortlists };
    delete updated[name];
    setShortlists(updated);
    if (activeShortlist === name) setActiveShortlist(Object.keys(updated)[0]);
    await setDoc(doc(db, 'scoutData', uid), { shortlists: updated }, { merge: true });
  };

  // ── Notes ───────────────────────────────────────────────────────────────────
  const handleNoteChange = (athleteId, text) => {
    setNotes((prev) => ({ ...prev, [athleteId]: text }));
    if (noteTimers.current[athleteId]) clearTimeout(noteTimers.current[athleteId]);
    noteTimers.current[athleteId] = setTimeout(async () => {
      await setDoc(
        doc(db, 'scoutNotes', uid),
        { athletes: { [athleteId]: text } },
        { merge: true },
      );
    }, 800);
  };

  // ── Open athlete (Fix 4: track scout views as a real signal) ────────────────
  // Increments two counters on the athlete's user doc:
  //   profileViews — lifetime total
  //   profileViewsThisWeek — surfaced on ProgressFeed + Profile
  // Profile.jsx rolls the weekly counter over at week boundary client-side.
  const openAthlete = async (athlete) => {
    setSelectedAthlete(athlete);
    try {
      await updateDoc(doc(db, 'users', athlete.uid || athlete.id), {
        profileViewEvents:     arrayUnion(new Date().toISOString()),
        profileViews:          increment(1),
        profileViewsThisWeek:  increment(1),
        lastViewedAt:          new Date().toISOString(),
      });
    } catch (_) { /* non-critical */ }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A1628] text-white flex flex-col" data-theme="scout">
      <ScoutTopNav
        scoutName={scoutName}
        scoutView={scoutView}
        setScoutView={setScoutView}
        onLogout={handleLogout}
      />

      {scoutView === 'dashboard' ? (
        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
          <FilterSidebar
            search={search}                   setSearch={setSearch}
            filterEvent={filterEvent}         setFilterEvent={setFilterEvent}
            filterGender={filterGender}       setFilterGender={setFilterGender}
            filterState={filterState}         setFilterState={setFilterState}
            filterAgeMin={filterAgeMin}       setFilterAgeMin={setFilterAgeMin}
            filterAgeMax={filterAgeMax}       setFilterAgeMax={setFilterAgeMax}
            filterVerifiedOnly={filterVerifiedOnly} setFilterVerifiedOnly={setFilterVerifiedOnly}
            filterUnderservedOnly={filterUnderserved} setFilterUnderservedOnly={setFilterUnderserved}
            filterTimeMin={filterTimeMin}   setFilterTimeMin={setFilterTimeMin}
            filterTimeMax={filterTimeMax}   setFilterTimeMax={setFilterTimeMax}
            resultCount={filtered.length}
          />

          <div className="flex-1 overflow-y-auto p-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">
                {loading ? 'Loading…' : `${filtered.length} athlete${filtered.length !== 1 ? 's' : ''}`}
              </span>
              <div className="flex items-center gap-1 bg-[#0D1F35] rounded-md p-0.5 border border-[#1E3A5F]">
                {[['table', <List size={15} />], ['cards', <LayoutGrid size={15} />]].map(([mode, icon]) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === mode ? 'bg-amber-500 text-[#0A1628]' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24 text-gray-500">
                <div className="text-sm">Loading athletes…</div>
              </div>
            ) : filtered.length === 0 ? (
              <SmartEmptyState
                filterVerifiedOnly={filterVerifiedOnly}
                filterEvent={filterEvent}
                filterTimeMin={filterTimeMin}
                filterTimeMax={filterTimeMax}
                filterState={filterState}
                onClearVerified={() => setFilterVerifiedOnly(false)}
                onClearTimeRange={() => { setFilterTimeMin(''); setFilterTimeMax(''); }}
                onClearState={() => setFilterState('')}
              />
            ) : viewMode === 'table' ? (
              <AthleteTable
                athletes={filtered}
                isShortlisted={isShortlisted}
                onOpen={openAthlete}
                onToggleShortlist={toggleShortlist}
                activeShortlist={activeShortlist}
              />
            ) : (
              <AthleteCards
                athletes={filtered}
                isShortlisted={isShortlisted}
                onOpen={openAthlete}
                onToggleShortlist={toggleShortlist}
                activeShortlist={activeShortlist}
              />
            )}
          </div>
        </div>
      ) : (
        <ShortlistsScreen
          shortlists={shortlists}
          athletes={athletes}
          activeShortlist={activeShortlist}
          setActiveShortlist={setActiveShortlist}
          onAddList={addShortlist}
          onDeleteList={deleteShortlist}
          onToggleShortlist={toggleShortlist}
          onOpenAthlete={openAthlete}
          onPrint={() => window.print()}
        />
      )}

      {/* Athlete detail panel — renders over either view */}
      {selectedAthlete && (
        <AthletePanel
          athlete={selectedAthlete}
          note={notes[selectedAthlete.uid || selectedAthlete.id] || ''}
          onNoteChange={(text) => handleNoteChange(selectedAthlete.uid || selectedAthlete.id, text)}
          shortlists={shortlists}
          onToggleShortlist={toggleShortlist}
          onClose={() => setSelectedAthlete(null)}
        />
      )}
    </div>
  );
}
