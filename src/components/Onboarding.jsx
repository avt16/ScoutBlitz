import React, { useState, useMemo } from 'react';
import { setDoc, doc } from 'firebase/firestore';
import { db } from './FireBase';
import { Waves, ArrowRight, ArrowLeft, Check, Copy, Send, Sparkles } from 'lucide-react';
import { INDIAN_STATES, SWIM_EVENTS } from '../data/swimData';
import SmartTimeInput from './SmartTimeInput';

/**
 * Onboarding wizard (Fix 5)
 *
 * Renders inside Profile.jsx when the athlete is on their own profile and
 * onboardingCompleted is not yet true. Modal-style overlay — cannot be
 * dismissed via X or backdrop click until the final step.
 *
 * 4 steps:
 *   1. Basic info (name, age, state, city)
 *   2. Swimming background (primary event, club, coach)
 *   3. First swim time
 *   4. Profile link + share
 *
 * Each step saves to Firestore on Next so dropouts still get partial data
 * preserved. Step 4's "Get started" button writes onboardingCompleted:true
 * and closes the wizard.
 */
export default function Onboarding({ uid, initialData, onComplete }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    name:         initialData?.name || '',
    age:          initialData?.age || '',
    state:        initialData?.state || '',
    city:         initialData?.city || '',
    primaryEvent: initialData?.primaryEvent || '',
    clubName:     initialData?.clubName || '',
    coachName:    initialData?.coachName || '',
    firstTimeField: '',   // which swimming field gets the first time
    firstTimeValue: '',   // the raw time string
    gender:       initialData?.gender || '',
  });

  const update = (patch) => setData((d) => ({ ...d, ...patch }));

  const profileUrl = useMemo(
    () => uid ? `${window.location.origin}/profile/${uid}` : '',
    [uid],
  );

  // ── Validation per step ─────────────────────────────────────────────────
  const canAdvance = (() => {
    if (step === 1) return Boolean(data.name?.trim() && data.state);
    if (step === 2) return Boolean(data.primaryEvent);
    if (step === 3) return true;  // First time is optional — many athletes don't know one yet
    return true;
  })();

  // ── Persist partial progress on Next ────────────────────────────────────
  const saveStep = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      const payload = {
        name: data.name?.trim() || '',
        age: data.age || '',
        state: data.state || '',
        city: data.city || '',
        gender: data.gender || '',
        primaryEvent: data.primaryEvent || '',
        clubName: data.clubName || '',
        coachName: data.coachName || '',
      };
      // If a first time was entered on step 3, write it to the correct swim field
      if (step === 3 && data.firstTimeField && data.firstTimeValue?.trim()) {
        payload[data.firstTimeField] = data.firstTimeValue.trim();
      }
      await setDoc(doc(db, 'users', uid), payload, { merge: true });
    } catch (e) {
      console.error('Onboarding step save failed', e);
    }
    setSaving(false);
  };

  const next = async () => {
    if (!canAdvance) return;
    await saveStep();
    setStep((s) => s + 1);
  };

  const back = () => setStep((s) => Math.max(1, s - 1));

  const finish = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', uid), {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString(),
      }, { merge: true });
      // Hand back the collected data so Profile can update its formData
      // without a refetch round-trip
      const writeback = {
        name: data.name?.trim() || '',
        age: data.age || '',
        state: data.state || '',
        city: data.city || '',
        gender: data.gender || '',
        primaryEvent: data.primaryEvent || '',
        clubName: data.clubName || '',
        coachName: data.coachName || '',
        onboardingCompleted: true,
      };
      if (data.firstTimeField && data.firstTimeValue?.trim()) {
        writeback[data.firstTimeField] = data.firstTimeValue.trim();
      }
      onComplete?.(writeback);
    } catch (e) {
      console.error('Could not mark onboarding complete', e);
    }
    setSaving(false);
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(profileUrl); } catch (_) {}
  };

  const whatsappText = encodeURIComponent(
    `Check out my SwimBlitz profile — ${profileUrl}`
  );

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-[#0B2E4E]/80 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto">
        {/* Progress bar */}
        <div className="px-6 pt-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-400 rounded-md p-1.5">
              <Waves size={16} className="text-[#0B2E4E]" />
            </div>
            <span className="font-bold text-[#0B2E4E]">SwimBlitz</span>
            <span className="ml-auto text-xs font-medium text-gray-500">Step {step} of 4</span>
          </div>
          <div className="w-full bg-blue-50 rounded-full h-2 mb-5">
            <div
              className="bg-amber-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 pb-2">
          {step === 1 && <Step1 data={data} update={update} />}
          {step === 2 && <Step2 data={data} update={update} />}
          {step === 3 && <Step3 data={data} update={update} />}
          {step === 4 && <Step4 profileUrl={profileUrl} onCopy={copy} whatsappText={whatsappText} />}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex items-center gap-2">
          {step > 1 && step < 4 && (
            <button
              onClick={back}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1 disabled:opacity-50"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <div className="ml-auto">
            {step < 4 ? (
              <button
                onClick={next}
                disabled={!canAdvance || saving}
                className="px-5 py-2.5 bg-[#0B2E4E] text-white rounded-lg text-sm font-semibold hover:bg-[#0d3a5c] transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                {saving ? 'Saving…' : <>Continue <ArrowRight size={14} /></>}
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={saving}
                className="px-5 py-2.5 bg-amber-400 text-[#0B2E4E] rounded-lg text-sm font-bold hover:bg-amber-300 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {saving ? 'Finishing…' : <>Get Started <Sparkles size={14} /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step content components ────────────────────────────────────────────────

function Step1({ data, update }) {
  return (
    <>
      <h2 className="text-xl font-bold text-[#0B2E4E] mb-1">Welcome to SwimBlitz</h2>
      <p className="text-sm text-gray-500 mb-5">
        Tell us a bit about yourself. This is the bare minimum scouts need to find you.
      </p>
      <div className="space-y-3 mb-2">
        <Field label="Full name *">
          <input
            type="text"
            value={data.name}
            onChange={(e) => update({ name: e.target.value })}
            className={inputCls}
            placeholder="As it should appear to scouts"
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age">
            <input
              type="text"
              inputMode="numeric"
              value={data.age}
              onChange={(e) => update({ age: e.target.value })}
              className={inputCls}
              placeholder="e.g. 16"
            />
          </Field>
          <Field label="Gender">
            <select value={data.gender} onChange={(e) => update({ gender: e.target.value })} className={inputCls}>
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </Field>
        </div>
        <Field label="State *">
          <select value={data.state} onChange={(e) => update({ state: e.target.value })} className={inputCls}>
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="City">
          <input
            type="text"
            value={data.city}
            onChange={(e) => update({ city: e.target.value })}
            className={inputCls}
            placeholder="e.g. Pune"
          />
        </Field>
      </div>
    </>
  );
}

function Step2({ data, update }) {
  return (
    <>
      <h2 className="text-xl font-bold text-[#0B2E4E] mb-1">Your swimming background</h2>
      <p className="text-sm text-gray-500 mb-5">
        Pick your primary event — this drives benchmark comparisons and event-based search.
      </p>
      <div className="space-y-3 mb-2">
        <Field label="Primary event *">
          <select value={data.primaryEvent} onChange={(e) => update({ primaryEvent: e.target.value })} className={inputCls}>
            <option value="">Select primary event</option>
            {SWIM_EVENTS.map((e) => <option key={e.label}>{e.label}</option>)}
          </select>
        </Field>
        <Field label="Club name">
          <input
            type="text"
            value={data.clubName}
            onChange={(e) => update({ clubName: e.target.value })}
            className={inputCls}
            placeholder="e.g. Aqua Tigers Swimming Club"
          />
        </Field>
        <Field label="Coach name">
          <input
            type="text"
            value={data.coachName}
            onChange={(e) => update({ coachName: e.target.value })}
            className={inputCls}
            placeholder="Your coach's full name"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            We use this to gate coach verification — only the coach named here can verify your times.
          </p>
        </Field>
      </div>
    </>
  );
}

function Step3({ data, update }) {
  // Default the time entry to the primary event the athlete just selected
  const targetEvent = useMemo(
    () => SWIM_EVENTS.find((e) => e.label === data.primaryEvent) || SWIM_EVENTS[0],
    [data.primaryEvent],
  );

  // Set the firstTimeField when the user starts typing
  React.useEffect(() => {
    if (!data.firstTimeField && targetEvent) {
      update({ firstTimeField: targetEvent.field });
    }
  }, [targetEvent, data.firstTimeField]);

  return (
    <>
      <h2 className="text-xl font-bold text-[#0B2E4E] mb-1">Log your first time</h2>
      <p className="text-sm text-gray-500 mb-5">
        Skip if you don't have one handy — you can add times anytime from your profile.
      </p>
      <div className="space-y-3 mb-2">
        <Field label="Event">
          <select
            value={data.firstTimeField}
            onChange={(e) => update({ firstTimeField: e.target.value, firstTimeValue: '' })}
            className={inputCls}
          >
            {SWIM_EVENTS.map((e) => <option key={e.field} value={e.field}>{e.label}</option>)}
          </select>
        </Field>
        <Field label="Your best time">
          <SmartTimeInput
            value={data.firstTimeValue}
            onChange={(v) => update({ firstTimeValue: v })}
            event={SWIM_EVENTS.find((e) => e.field === data.firstTimeField)?.label || ''}
            gender={data.gender}
            className={inputCls}
          />
        </Field>
      </div>
    </>
  );
}

function Step4({ profileUrl, onCopy, whatsappText }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="text-center mb-5">
        <div className="inline-flex bg-green-100 rounded-full p-3 mb-3">
          <Check size={28} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-[#0B2E4E] mb-1">You're on SwimBlitz</h2>
        <p className="text-sm text-gray-500">
          Your profile is live. Share the link with your coach so they can verify your times.
        </p>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 mb-4">
        <div className="text-xs font-medium text-gray-500 mb-1">Your profile link</div>
        <div className="flex gap-2 items-center">
          <input
            readOnly
            value={profileUrl}
            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-2 bg-[#0B2E4E] text-white rounded-lg text-xs font-medium hover:bg-[#0d3a5c] inline-flex items-center gap-1.5"
          >
            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>

        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 w-full flex items-center justify-center gap-1.5 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
        >
          <Send size={14} /> Share via WhatsApp
        </a>
      </div>

      <p className="text-xs text-gray-500 text-center">
        You can come back to your profile anytime to add times, verify with your coach,
        and log competition results.
      </p>
    </>
  );
}

// ── Form helpers ────────────────────────────────────────────────────────────

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2E4E] bg-gray-50';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
