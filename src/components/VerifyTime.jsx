import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './FireBase';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Waves, ShieldCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatTime } from '../data/swimData';

/**
 * Public coach-facing verification page.
 *
 * Verification gate (defence-in-depth, client-side):
 *   Coach must enter BOTH their name and their club. We compare both
 *   (case-insensitive, trimmed) against what the athlete listed on their
 *   SwimBlitz profile. Outcomes:
 *
 *     name OK + club OK   → verify proceeds
 *     name BAD + club OK  → "Another coach at <club> must verify this"
 *     name OK + club BAD  → "<athlete> listed you at a different club"
 *     name BAD + club BAD → "You are not a verified coach for this athlete"
 *
 * IMPORTANT: We never echo the expected name or club back to the visitor.
 * Surfacing them would let any impostor copy the values directly from the
 * page. The athlete's public profile may show coach/club, but we don't
 * make that information easier to access from inside the verify flow.
 *
 * Firestore rules note:
 *   The same caveat from the previous commit applies — public update of
 *   verificationRequests/{token} and merge of users/{athleteId}.verifications
 *   must be allowed (ideally gated on a pending request existing). For real
 *   security this gate should also be enforced server-side via rules; the
 *   client check is UX + a first hurdle.
 */
export default function VerifyTime() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [coachName, setCoachName] = useState('');
  const [coachClub, setCoachClub] = useState('');
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

  // Normalise both sides of the comparison
  const norm = (s) => (s || '').trim().toLowerCase();

  const submit = async (verdict) => {
    const enteredName = coachName.trim();
    const enteredClub = coachClub.trim();

    if (!enteredName) {
      setError('Please enter your full name.');
      return;
    }
    // For declines we only need a name (the decline still helps the athlete
    // know the link reached someone). For verifies, club is also required.
    if (verdict === 'verified' && !enteredClub) {
      setError('Please enter the name of the club you coach at.');
      return;
    }

    if (verdict === 'verified') {
      const nameMatch = norm(enteredName) === norm(request.expectedCoach);
      const clubMatch = norm(enteredClub) === norm(request.expectedClub);

      // The athlete's listed club is the canonical name we should use in the
      // "another coach at X" message — that's what they actually swim at.
      const athleteClub = request.expectedClub?.trim() || enteredClub;

      if (!nameMatch && !clubMatch) {
        setError(
          `You are not a verified coach to verify this athlete's times. ` +
          `If you believe this is wrong, ask ${request.athleteName} to update ` +
          `their SwimBlitz profile with the correct coach and club, then send ` +
          `you a new link.`
        );
        return;
      }
      if (!nameMatch && clubMatch) {
        setError(
          `This time must be verified by another coach at ${athleteClub} — ` +
          `specifically the coach ${request.athleteName} listed on their ` +
          `SwimBlitz profile. If the listed coach is no longer at the club, ` +
          `ask ${request.athleteName} to update their profile.`
        );
        return;
      }
      if (nameMatch && !clubMatch) {
        setError(
          `${request.athleteName} has listed you as working at a different ` +
          `club on their SwimBlitz profile. Ask them to correct the club ` +
          `name on their profile and send a new verification link.`
        );
        return;
      }
      // Both match — fall through to submit.
    }

    setSubmitting(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'verificationRequests', token), {
        status: verdict,
        verifiedBy: enteredName,
        verifiedByClub: enteredClub || null,
        verifiedAt: serverTimestamp(),
      });

      if (verdict === 'verified') {
        await setDoc(
          doc(db, 'users', request.athleteId),
          {
            verifications: {
              [request.field]: {
                status: 'coach',
                meetName: `Verified by ${enteredName}${enteredClub ? ` (${enteredClub})` : ''}`,
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
          <Row
            label="Claimed Time"
            value={<span className="text-2xl font-extrabold text-[#0B2E4E]">{formatTime(request.time)}</span>}
          />
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Your full name</label>
            <input
              type="text"
              value={coachName}
              onChange={(e) => setCoachName(e.target.value)}
              placeholder="e.g. Anand Sharma"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Your club</label>
            <input
              type="text"
              value={coachClub}
              onChange={(e) => setCoachClub(e.target.value)}
              placeholder="e.g. Aqua Tigers Swimming Club"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
            />
          </div>
          <p className="text-[11px] text-gray-500">
            Both must match what {request.athleteName} listed on their SwimBlitz profile.
            We don't show you the expected values — if you're the right coach, you already know them.
          </p>
        </div>

        {error && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2.5 mb-3 leading-relaxed">
            {error}
          </div>
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
    <div className="min-h-screen bg-[#0B2E4E] flex items-center justify-center px-4 py-6">
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
