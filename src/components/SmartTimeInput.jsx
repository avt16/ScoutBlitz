import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { parseTimeSmart, fmtSecs, validateTime } from '../data/swimData';

/**
 * SmartTimeInput — single source of truth for swim-time entry.
 *
 * Accepts casual formats ("54", "54.32", "1:54.32", "1.54.32"), normalises
 * on blur to canonical "m:ss.xx" or "ss.xx", and surfaces an inline warning
 * when the time is faster than the current world record for the event.
 *
 * Props:
 *   - value: current raw string from formData
 *   - onChange: (newRawString) => void  — called on blur with normalised value
 *   - event:    event label (e.g. "100m Freestyle") for validation
 *   - gender:   "Male" | "Female" — for world-record comparison
 *   - placeholder, className, disabled — standard input props
 */
export default function SmartTimeInput({
  value, onChange, event, gender, course = 'LCM',
  placeholder, className = '', disabled = false,
  showHint = true,
}) {
  const [draft, setDraft] = useState(value || '');
  const [warning, setWarning] = useState(null);

  // Keep draft in sync if parent value changes externally
  useEffect(() => { setDraft(value || ''); }, [value]);

  const handleBlur = () => {
    if (!draft.trim()) {
      setWarning(null);
      onChange('');
      return;
    }
    const secs = parseTimeSmart(draft);
    if (secs === null) {
      setWarning('Could not parse time. Try "54.32" or "1:54.32".');
      return;
    }
    const v = validateTime(secs, event, gender, course);
    setWarning(v.ok ? null : v.reason);
    const normalised = fmtSecs(secs);
    setDraft(normalised);
    onChange(normalised);
  };

  return (
    <div>
      <input
        type="text"
        inputMode="decimal"
        disabled={disabled}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder || 'e.g. 1:52.34 or 112.34'}
        className={className}
      />
      {showHint && (
        <div className="mt-1 text-[10px] text-gray-400 leading-tight">
          Accepts <span className="font-mono">54.32</span> or <span className="font-mono">1:54.32</span>
        </div>
      )}
      {warning && (
        <div className="mt-1 flex items-start gap-1 text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
}
