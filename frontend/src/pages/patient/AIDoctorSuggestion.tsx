import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Stethoscope, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAuthUser } from '../../services/authSession';
import { suggestDoctors } from '../../services/aiDoctorSuggestionApi';
import type { SuggestDoctorResponse } from '../../types/aiDoctorSuggestion';

const QUERY_MAX_LENGTH = 1000;

export default function AIDoctorSuggestion() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SuggestDoctorResponse | null>(null);

  const currentUser = useMemo(() => getAuthUser() as { id?: number; firstName?: string } | null, []);

  const remainingChars = QUERY_MAX_LENGTH - query.length;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const cleanQuery = query.trim();
    if (!cleanQuery) {
      setError('Please describe your symptoms before requesting a suggestion.');
      return;
    }

    if (cleanQuery.length > QUERY_MAX_LENGTH) {
      setError(`Symptoms cannot exceed ${QUERY_MAX_LENGTH} characters.`);
      return;
    }

    if (!currentUser?.id) {
      setError('Unable to find your patient identity. Please log in again.');
      return;
    }

    try {
      setLoading(true);
      const response = await suggestDoctors({
        patientId: currentUser.id,
        query: cleanQuery,
      });
      setResult(response);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to get doctor suggestions.';
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,#bae6fd_0%,transparent_35%),radial-gradient(circle_at_85%_90%,#fde68a_0%,transparent_35%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8"
        >
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 ring-1 ring-orange-100">
            <Sparkles className="h-3.5 w-3.5" />
            AI Triage
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">AI Doctor Suggestion</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
            Describe your symptoms in plain language. The system suggests a suitable specialty and ranked doctors you can review.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Hello {currentUser?.firstName || 'Patient'}, this tool helps triage but does not replace medical diagnosis.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06 }}
            className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <label htmlFor="symptom-query" className="block text-sm font-semibold text-slate-800">
                Symptoms and concerns
              </label>
              <textarea
                id="symptom-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                maxLength={QUERY_MAX_LENGTH}
                rows={8}
                placeholder="Example: I have had chest discomfort for 3 days, shortness of breath while climbing stairs, and fatigue."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none ring-orange-400 transition focus:ring-2"
              />
              <div className="flex items-center justify-between text-xs">
                <span className={`${remainingChars < 120 ? 'text-amber-700' : 'text-slate-500'}`}>
                  {remainingChars} characters left
                </span>
                <span className="text-slate-500">Maximum {QUERY_MAX_LENGTH}</span>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? 'Analyzing symptoms...' : 'Get AI Suggestion'}
              </button>
            </form>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
            className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold text-slate-900">How this works</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>1. You describe symptoms and context.</li>
              <li>2. AI suggests a medical specialty.</li>
              <li>3. System ranks matching doctors.</li>
              <li>4. You review doctor profiles before booking.</li>
            </ul>
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              If symptoms are severe or emergency-related, contact emergency services immediately.
            </div>
          </motion.aside>
        </div>

        {result && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-8 space-y-5"
          >
            <div className="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Recommended Specialty</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">{result.recommendedSpecialty}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">{result.explanation}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {result.topDoctors.map((doctor) => (
                <article
                  key={doctor.doctorId}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-3 inline-flex rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 p-2 text-white">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">{doctor.doctorName}</h4>
                  <p className="mt-1 text-sm text-slate-600">{doctor.specialization}</p>

                  <div className="mt-4 space-y-1 text-xs text-slate-600">
                    <p>Experience: {doctor.experienceYears} years</p>
                    <p>Status: {doctor.verificationStatus}</p>
                    <p>Next slot: {doctor.nextAvailableSlot || 'Not available'}</p>
                    <p>Match score: {(doctor.finalScore * 100).toFixed(1)}%</p>
                  </div>

                  <Link
                    to={`/doctors/${doctor.doctorId}`}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-500"
                  >
                    View doctor profile
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
