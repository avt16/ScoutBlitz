import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './FireBase';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Waves, ShieldCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatTime } from '../data/swimData';

/**
 * Public coach-facing verification page.
 *
 * Flow:
 *   1. Athlete clicks "Request Verification" next to a time → app creates
 *      verificationRequests/{token} with {athleteId, field, label, time, status}.
 *   2. Athlete shares the URL /verify/{token} with their coach via WhatsApp.
 *   3. Coach opens the URL — no account required — sees the claim and clicks
 *      "Verify" or "Reject". We update the request doc AND patch the athlete's
 *      verifications field on users/{athleteId}.
 *
 * SECURITY: Firestore rules must allow:
 *   - public read of verificationRequests/{token}
 *   - public update of verificationRequests/{token}.status
 *   - public write to users/{athleteId}.verifications.{field}
 *     (gated on a matching pending verificationRequest existing)
 *
 * Without these rules, the verify click will fail silently. The UI surfaces
 * the error so the platform owner can update Firestore rules.
 */
export default function VerifyTime() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [coachName, setCoachName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null); // 'verified' | 'rejected'

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'verificationRequests', token));
        if (!snap.exists()) {
          setError('This verification link is not valid or has expired.');
        } else {
          setRequest({ id: snap.id, ...snap.data() });
        }
      } catch (e) {
        setError('Could not load the verification request. Please try again.');
      }
      setLoading(false);
    };
    load();
  }, [token]);

  const submit = async (verdict) => {
    if (!coachName.trim()) {
      setError('Please enter your name so the athlete knows who verified.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // Update the request doc (audit trail)
      await updateDoc(doc(db, 'verificationRequests', token), {
        status: verdict,
        verifiedBy: coachName.trim(),
        verifiedAt: serverTimestamp(),
      });

      // If approved, write to the athlete's user doc so it shows immediately
      if (verdict === 'verified') {
        await setDoc(
          doc(db, 'users', request.athleteId),
          {
            verifications: {
              [request.field]: {
                status: 'coach',
                meetName: `Verified by ${coachName.trim()}`,
                verifiedAt: new Date().toISOString(),
              },
            },
          },
          { merge: true },
        );
      }
      setDone(verdict);
    } catch (e) {
      setError(
        'Could not save verification. The platform administrator may need ' +
        'to update Firestore security rules to allow this action.',
      );
    }
    setSubmitting(false);
  };

  // ── Render states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <FullScreen>
        <div className="text-blue-300 text-sm">Loading verification request…</div>
      </FullScreen>
    );
  }

  if (error && !request) {
    return (
      <FullScreen>
        <Card>
          <XCircle size={32} className="text-red-500 mb-3" />
          <h1 className="text-lg font-bold text-[#0B2E4E] mb-1">Link Invalid</h1>
          <p className="text-sm text-gray-600">{error}</p>
        </Card>
      </FullScreen>
    );
  }

  if (request?.status === 'verified' || request?.status === 'rejected' || done) {
    const status = done || request.status;
    return (
      <FullScreen>
        <Card>
          {status === 'verified' ? (
            <>
              <CheckCircle2 size={36} className="text-green-500 mb-3" />
              <h1 className="text-lg font-bold text-[#0B2E4E] mb-1">Time Verified</h1>
              <p className="text-sm text-gray-600 mb-4">
                Thanks{request?.verifiedBy ? `, ${request.verifiedBy}` : ''}. {request.athleteName}'s
                time in {request.label} is now marked as coach-verified on SwimBlitz.
              </p>
            </>
          ) : (
            <>
              <XCircle size={36} className="text-gray-500 mb-3" />
              <h1 className="text-lg font-bold text-[#0B2E4E] mb-1">Verification Declined</h1>
              <p className="text-sm text-gray-600 mb-4">
                You marked this time as unverified. {request.athleteName} can submit a new request
                with an updated time.
              </p>
            </>
          )}
          <button
            onClick={() => navigate('/')}
            className="text-sm text-[#1565C0] hover:underline"
          >
            Visit SwimBlitz →
          </button>
        </Card>
      </FullScreen>
    );
  }

  // ── Main verify form ──────────────────────────────────────────────────────

  return (
    <FullScreen>
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-400 rounded-md p-1.5">
            <Waves size={16} className="text-[#0B2E4E]" />
          </div>
          <span className="font-bold text-[#0B2E4E]">SwimBlitz</span>
          <span className="text-xs text-gray-400 ml-1">Coach Verification</span>
        </div>

        <h1 className="text-xl font-bold text-[#0B2E4E] mb-1">
          Verify {request.athleteName}'s time
        </h1>
        <p className="text-sm text-gray-500 mb-5">
          {request.athleteName} has asked you to confirm this swim time.
          Verifying takes ten seconds and dramatically increases the credibility
          of their profile on SwimBlitz.
        </p>

        <div className="bg-blue-50 rounded-xl p-4 mb-5 space-y-2">
          <Row label="Athlete" value={request.athleteName} />
          <Row label="Event" value={request.label} />
          <Row label="Claimed Time" value={<span className="text-2xl font-extrabold text-[#0B2E4E]">{formatTime(request.time)}</span>} />
        </div>

        <label className="block text-xs font-medium text-gray-600 mb-1">Your name</label>
        <input
          type="text"
          value={coachName}
          onChange={(e) => setCoachName(e.target.value)}
          placeholder="e.g. Coach Anand Sharma"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
        />

        {error && (
          <div className="text-xs text-red-600 bg-red-50 rounded px-2 py-1.5 mb-3">{error}</div>
        )}

        <div className="flex gap-2">
          <button
            disabled={submitting}
            onClick={() => submit('verified')}
            className="flex-1 bg-[#0B2E4E] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#0d3a5c] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <ShieldCheck size={14} /> Verify Time
          </button>
          <button
            disabled={submitting}
            onClick={() => submit('rejected')}
            className="px-4 bg-gray-100 text-gray-600 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Decline
          </button>
        </div>

        {submitting && (
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
            <Clock size={12} className="animate-spin" /> Saving…
          </div>
        )}
      </Card>
    </FullScreen>
  );
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function FullScreen({ children }) {
  return (
    <div className="min-h-screen bg-[#0B2E4E] flex items-center justify-center px-4">
      {children}
    </div>
  );
}

function Card({ children }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-gray-500 uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-sm font-semibold text-[#0B2E4E] text-right">{value}</span>
    </div>
  );
}
