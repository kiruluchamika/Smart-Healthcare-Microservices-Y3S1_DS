import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BrainCircuit,
  ClipboardList,
  Loader2,
  ShieldAlert,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import { analyzeSymptoms, getSymptomAnalysisById, getSymptomHistory } from '../../services/aiSymptomApi';
import { getAuthUser } from '../../services/authSession';
import { patientApi } from '../../services/patientApi';
import type { AnalyzeSymptomResponse, SymptomHistoryItem } from '../../types/aiSymptom';
import type { PatientProfile } from '../../types/patient';

const SYMPTOM_MAX_LENGTH = 3000;

type SexOption = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

type SymptomFormState = {
  symptomsText: string;
  age: string;
  sex: SexOption;
  durationHours: string;
  chronicConditions: string;
  currentMedications: string;
  allergies: string;
  locale: string;
};

const INITIAL_FORM: SymptomFormState = {
  symptomsText: '',
  age: '',
  sex: 'PREFER_NOT_TO_SAY',
  durationHours: '24',
  chronicConditions: '',
  currentMedications: '',
  allergies: '',
  locale: 'en-US',
};

function parseCsvInput(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function calculateAgeFromDateOfBirth(dateOfBirth: string | null) {
  if (!dateOfBirth) {
    return '';
  }

  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) {
    return '';
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 0 ? String(age) : '';
}

function urgencyBadgeClasses(level: string) {
  switch (level) {
    case 'EMERGENCY':
      return 'bg-rose-100 text-rose-700 border border-rose-200';
    case 'HIGH':
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'MODERATE':
      return 'bg-sky-100 text-sky-700 border border-sky-200';
    default:
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  }
}

export default function AISymptomPage() {
  const currentUser = useMemo(() => getAuthUser() as { id?: number; firstName?: string } | null, []);
  const [form, setForm] = useState<SymptomFormState>(INITIAL_FORM);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeSymptomResponse | null>(null);
  const [historyItems, setHistoryItems] = useState<SymptomHistoryItem[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SymptomHistoryItem | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    if (!currentUser?.id) {
      setLoadingProfile(false);
      setLoadingHistory(false);
      setError('Unable to find your patient identity. Please log in again.');
      return;
    }

    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        const response = await patientApi.getProfile();
        if (!response.success) {
          return;
        }

        const patientProfile = response.data;
        setProfile(patientProfile);
        setForm((currentForm) => ({
          ...currentForm,
          age: currentForm.age || calculateAgeFromDateOfBirth(patientProfile.dateOfBirth),
          sex: (patientProfile.gender as SexOption | null) || currentForm.sex,
          chronicConditions: currentForm.chronicConditions || patientProfile.chronicConditions || '',
          allergies: currentForm.allergies || patientProfile.allergies || '',
        }));
      } catch {
        // Form remains usable without profile defaults.
      } finally {
        setLoadingProfile(false);
      }
    };

    void loadProfile();
    void refreshHistory();
  }, [currentUser?.id]);

  const remainingChars = SYMPTOM_MAX_LENGTH - form.symptomsText.length;

  const setField = (field: keyof SymptomFormState, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const refreshHistory = async (preferredId?: number) => {
    if (!currentUser?.id) {
      return;
    }

    try {
      setLoadingHistory(true);
      setHistoryError('');
      const response = await getSymptomHistory(currentUser.id);
      setHistoryItems(response.items);

      const selectedId = preferredId ?? selectedAnalysis?.id ?? response.items[0]?.id;
      if (selectedId) {
        const details = await getSymptomAnalysisById(selectedId);
        setSelectedAnalysis(details);
      } else {
        setSelectedAnalysis(null);
      }
    } catch (requestError) {
      const message = requestError instanceof Error
        ? requestError.message
        : 'Failed to load symptom analysis history.';
      setHistoryError(message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAnalyze = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!currentUser?.id) {
      setError('Unable to find your patient identity. Please log in again.');
      return;
    }

    const symptomsText = form.symptomsText.trim();
    const age = Number(form.age);
    const durationHours = Number(form.durationHours);

    if (!symptomsText) {
      setError('Please describe the symptoms before analyzing.');
      return;
    }

    if (Number.isNaN(age) || age < 0) {
      setError('Please enter a valid age.');
      return;
    }

    if (Number.isNaN(durationHours) || durationHours < 0) {
      setError('Please enter a valid duration in hours.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await analyzeSymptoms({
        patientId: currentUser.id,
        symptomsText,
        age,
        sex: form.sex,
        durationHours,
        chronicConditions: parseCsvInput(form.chronicConditions),
        currentMedications: parseCsvInput(form.currentMedications),
        allergies: parseCsvInput(form.allergies),
        locale: form.locale.trim() || 'en-US',
      });

      setAnalysisResult(response);
      await refreshHistory(response.analysisId);
    } catch (requestError) {
      const message = requestError instanceof Error
        ? requestError.message
        : 'Failed to analyze symptoms.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectHistory = async (id: number) => {
    try {
      setLoadingDetailId(id);
      const details = await getSymptomAnalysisById(id);
      setSelectedAnalysis(details);
    } catch (requestError) {
      const message = requestError instanceof Error
        ? requestError.message
        : 'Failed to load analysis details.';
      setError(message);
    } finally {
      setLoadingDetailId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_12%,#cffafe_0%,transparent_35%),radial-gradient(circle_at_88%_88%,#fed7aa_0%,transparent_35%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 ring-1 ring-teal-100">
            <BrainCircuit className="h-3.5 w-3.5" />
            AI Symptom Triage
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">AI Symptom Assistant</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
            Submit symptom details for structured triage guidance, urgency analysis, warning signs, and recommended doctor specialization.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Hello {currentUser?.firstName || 'Patient'}, this feature supports triage guidance only and is not a medical diagnosis.
          </p>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Analyze Symptoms</h2>
                <p className="mt-1 text-sm text-slate-500">Use profile context and patient-entered details for the triage request.</p>
              </div>
              {loadingProfile && (
                <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading defaults
                </div>
              )}
            </div>

            <form onSubmit={handleAnalyze} className="space-y-5">
              <div>
                <label htmlFor="symptoms" className="block text-sm font-semibold text-slate-800">Symptoms and concerns</label>
                <textarea
                  id="symptoms"
                  rows={7}
                  maxLength={SYMPTOM_MAX_LENGTH}
                  value={form.symptomsText}
                  onChange={(event) => setField('symptomsText', event.target.value)}
                  placeholder="Example: I have had fever, sore throat, body aches, and dry cough for two days."
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none ring-teal-400 transition focus:ring-2"
                />
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className={remainingChars < 150 ? 'text-amber-700' : 'text-slate-500'}>{remainingChars} characters left</span>
                  <span className="text-slate-500">Maximum {SYMPTOM_MAX_LENGTH}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <h3 className="mb-4 text-sm font-bold text-slate-900">Patient Details & Context</h3>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <label htmlFor="age" className="block text-sm font-medium text-slate-700">Age (Years)</label>
                    <input id="age" type="number" min="0" max="120" value={form.age} onChange={(event) => setField('age', event.target.value)} placeholder="e.g. 35" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none ring-teal-400 transition placeholder:text-slate-400 focus:ring-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="sex" className="block text-sm font-medium text-slate-700">Biological Sex</label>
                    <div className="relative">
                      <select id="sex" value={form.sex} onChange={(event) => setField('sex', event.target.value)} className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-800 outline-none ring-teal-400 transition focus:ring-2">
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                        <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="durationHours" className="block text-sm font-medium text-slate-700">Duration of Symptoms</label>
                    <div className="relative">
                      <select id="durationHours" value={form.durationHours} onChange={(event) => setField('durationHours', event.target.value)} className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-800 outline-none ring-teal-400 transition focus:ring-2">
                        <option value="1">Just started (&lt; 1 hour)</option>
                        <option value="6">A few hours</option>
                        <option value="12">Half a day (~12 hours)</option>
                        <option value="24">1 day</option>
                        <option value="48">2 days</option>
                        <option value="72">3 days</option>
                        <option value="168">1 week</option>
                        <option value="336">2 weeks</option>
                        <option value="720">More than 2 weeks</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-3">
                  <div className="space-y-2">
                    <label htmlFor="chronicConditions" className="block text-sm font-medium text-slate-700">Chronic Conditions</label>
                    <input id="chronicConditions" type="text" value={form.chronicConditions} onChange={(event) => setField('chronicConditions', event.target.value)} placeholder="e.g. Asthma, Diabetes" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none ring-teal-400 transition placeholder:text-slate-400 focus:ring-2" />
                    <p className="text-[11px] text-slate-500">Separate multiple with commas</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="currentMedications" className="block text-sm font-medium text-slate-700">Current Medications</label>
                    <input id="currentMedications" type="text" value={form.currentMedications} onChange={(event) => setField('currentMedications', event.target.value)} placeholder="e.g. Inhaler, Paracetamol" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none ring-teal-400 transition placeholder:text-slate-400 focus:ring-2" />
                    <p className="text-[11px] text-slate-500">Separate multiple with commas</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="allergies" className="block text-sm font-medium text-slate-700">Known Allergies</label>
                    <input id="allergies" type="text" value={form.allergies} onChange={(event) => setField('allergies', event.target.value)} placeholder="e.g. Penicillin, Peanuts" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none ring-teal-400 transition placeholder:text-slate-400 focus:ring-2" />
                    <p className="text-[11px] text-slate-500">Separate multiple with commas</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-3">
                  <div className="space-y-2">
                    <label htmlFor="locale" className="block text-sm font-medium text-slate-700">Response Language</label>
                    <div className="relative">
                      <select id="locale" value={form.locale} onChange={(event) => setField('locale', event.target.value)} className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-800 outline-none ring-teal-400 transition focus:ring-2">
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="fr-FR">French</option>
                        <option value="es-ES">Spanish</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {submitting ? 'Analyzing symptoms...' : 'Analyze Symptoms'}
                </button>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  For emergencies, contact emergency services immediately.
                </div>
              </div>
            </form>
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Latest Result</h2>
              {!analysisResult ? (
                <p className="mt-3 text-sm text-slate-500">Submit a symptom analysis to display the most recent triage response here.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${urgencyBadgeClasses(analysisResult.urgencyLevel)}`}>{analysisResult.urgencyLevel}</span>
                    <span className="text-xs text-slate-500">{new Date(analysisResult.generatedAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm leading-6 text-slate-700">{analysisResult.symptomSummary}</p>
                  <p className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700">
                    <Stethoscope className="h-4 w-4" />
                    {analysisResult.recommendedDoctorSpecialization}
                  </p>
                  <p className="text-sm leading-6 text-slate-700">{analysisResult.nextStepRecommendation}</p>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                    <p><span className="font-semibold">Provider:</span> {analysisResult.provider} / {analysisResult.model}</p>
                    <p className="mt-1"><span className="font-semibold">Correlation ID:</span> {analysisResult.correlationId}</p>
                    {analysisResult.fallbackUsed && <p className="mt-2 font-semibold text-amber-700">Fallback safety guidance was used for this result.</p>}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-amber-200 bg-amber-50/90 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-700" />
                <div>
                  <h3 className="text-sm font-bold text-amber-900">Safety Reminder</h3>
                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    Severe chest pain, difficulty breathing, stroke-like symptoms, fainting, seizures, or severe bleeding should be treated as emergencies.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Analysis History</h2>
                <p className="mt-1 text-sm text-slate-500">Review previously saved triage outputs.</p>
              </div>
              <button type="button" onClick={() => void refreshHistory()} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                Refresh
              </button>
            </div>

            {loadingHistory ? (
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading symptom history
              </div>
            ) : historyError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{historyError}</div>
            ) : historyItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">No symptom triage history yet.</div>
            ) : (
              <div className="space-y-3">
                {historyItems.map((item) => (
                  <button key={item.id} type="button" onClick={() => void handleSelectHistory(item.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedAnalysis?.id === item.id ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.symptomSummary}</p>
                        <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${urgencyBadgeClasses(item.urgencyLevel)}`}>
                        {loadingDetailId === item.id ? 'Loading...' : item.urgencyLevel}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Selected Analysis Details</h2>
            {!selectedAnalysis ? (
              <p className="mt-3 text-sm text-slate-500">Select a history item to inspect the full triage response.</p>
            ) : (
              <div className="mt-5 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${urgencyBadgeClasses(selectedAnalysis.urgencyLevel)}`}>{selectedAnalysis.urgencyLevel}</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    <ClipboardList className="h-3.5 w-3.5" />
                    Analysis #{selectedAnalysis.id}
                  </span>
                  <span className="text-xs text-slate-500">{new Date(selectedAnalysis.createdAt).toLocaleString()}</span>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Symptom summary</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{selectedAnalysis.symptomSummary}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Possible condition categories</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedAnalysis.possibleConditionCategories.map((category) => (
                      <span key={category} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">{category}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Recommended doctor specialization</p>
                  <p className="mt-2 inline-flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700">
                    <Stethoscope className="h-4 w-4" />
                    {selectedAnalysis.recommendedDoctorSpecialization}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Red-flag warning signs</p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-700">
                    {selectedAnalysis.redFlagWarningSigns.map((flag) => (
                      <li key={flag} className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 text-rose-500" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Next-step recommendation</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{selectedAnalysis.nextStepRecommendation}</p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  {selectedAnalysis.disclaimer}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                  <p><span className="font-semibold">Correlation ID:</span> {selectedAnalysis.correlationId}</p>
                  {profile?.emergencyContactPhone && <p className="mt-1"><span className="font-semibold">Emergency contact:</span> {profile.emergencyContactPhone}</p>}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
