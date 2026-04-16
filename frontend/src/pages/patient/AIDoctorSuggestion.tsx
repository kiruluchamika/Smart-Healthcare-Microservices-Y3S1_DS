import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Stethoscope, Loader2, AlertCircle, ArrowRight, BrainCircuit, Activity, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 relative overflow-hidden text-slate-900 font-sans selection:bg-indigo-500/30">
      {/* Dynamic Background Elements - Light Theme */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-300/40 rounded-full blur-[120px] opacity-70 pointer-events-none" />
      <div className="absolute bottom-0 right-[-10%] w-[600px] h-[600px] bg-fuchsia-300/30 rounded-full blur-[120px] opacity-60 pointer-events-none" />
      <div className="absolute top-1/4 left-[-10%] w-[500px] h-[500px] bg-cyan-300/30 rounded-full blur-[100px] opacity-60 pointer-events-none" />
      
      <div className="relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8 mx-auto max-w-7xl">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, ease: "easeOut" }}
           className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-indigo-100 backdrop-blur-md mb-6 shadow-sm">
             <BrainCircuit className="w-4 h-4 text-indigo-600" />
             <span className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">AI Triage Intelligence</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-slate-900">
            Intelligent <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500">Doctor Matching</span>
          </h1>
          <p className="text-base md:text-lg text-slate-600 leading-relaxed">
            {currentUser?.firstName ? `Hi ${currentUser.firstName}, describe` : 'Describe'} your symptoms naturally. Our advanced neural engine will analyze your condition, recommend the precise medical specialty, and find the perfect specialists for your care.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1fr_350px] items-start">
           <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative group"
           >
              {/* Glow border effect */}
              <div className="absolute -inset-[1px] bg-gradient-to-b from-indigo-200 to-fuchsia-200 rounded-[2rem] blur-sm opacity-50 group-hover:opacity-100 transition duration-500" />
              
              <div className="relative rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white p-6 md:p-10 shadow-xl">
                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                       <label htmlFor="symptom-query" className="flex items-center gap-2 text-sm font-semibold text-slate-700 ml-1">
                          <Activity className="w-4 h-4 text-fuchsia-600" />
                          What are you experiencing?
                       </label>
                       <div className="relative">
                           <textarea
                             id="symptom-query"
                             value={query}
                             onChange={(event) => setQuery(event.target.value)}
                             maxLength={QUERY_MAX_LENGTH}
                             rows={6}
                             placeholder="E.g., I've been feeling unusually tired for the last week with occasional sharp pains in my lower back, especially in the mornings..."
                             className="w-full rounded-2xl bg-white/90 border border-slate-200 px-5 py-4 text-base text-slate-900 placeholder-slate-400 outline-none transition-all duration-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 resize-none shadow-sm"
                           />
                           <div className="absolute bottom-4 right-4 flex items-center justify-between text-xs font-medium">
                             <span className={`${remainingChars < 100 ? 'text-rose-600' : 'text-slate-500'} bg-white/90 px-2 py-1 rounded-md backdrop-blur-md border border-slate-100 shadow-sm`}>
                               {remainingChars} chars remaining
                             </span>
                           </div>
                       </div>
                    </div>

                    <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                         <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 backdrop-blur-md">
                           <div className="flex items-start gap-3">
                             <AlertCircle className="mt-0.5 h-5 w-5 text-rose-500 shrink-0" />
                             <span>{error}</span>
                           </div>
                         </div>
                      </motion.div>
                    )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative w-full inline-flex items-center justify-center gap-3 rounded-xl bg-indigo-600 px-6 py-4 text-base font-bold text-white transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden"
                    >
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                      
                      {loading ? (
                         <>
                           <Loader2 className="h-5 w-5 animate-spin text-white" />
                           <span>Analyzing symptoms...</span>
                         </>
                      ) : (
                         <>
                           <Sparkles className="h-5 w-5 text-indigo-100 group-hover:text-white transition-colors" />
                           <span>Initiate AI Triage</span>
                         </>
                      )}
                    </button>
                 </form>
              </div>
           </motion.section>

           <motion.aside
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.5, delay: 0.3 }}
             className="flex flex-col gap-6"
           >
              <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white p-6 shadow-xl">
                 <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                    <BrainCircuit className="w-5 h-5 text-indigo-600" />
                    How it Works
                 </h2>
                 <div className="relative space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-slate-200">
                    {[
                      { step: 1, title: 'Describe Context', desc: 'Enter your symptoms and concerns securely.' },
                      { step: 2, title: 'AI Analysis', desc: 'Neural network identifies potential medical fields.' },
                      { step: 3, title: 'Smart Match', desc: 'Finds top-rated doctors uniquely suited for you.' }
                    ].map((item, idx) => (
                      <div key={idx} className="relative flex gap-4 items-start">
                         <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white ring-4 ring-white shadow-sm">
                            {item.step}
                         </div>
                         <div>
                            <h3 className="text-sm font-bold text-slate-800">{item.title}</h3>
                            <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-xs text-rose-800 backdrop-blur-md shadow-sm flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <p className="leading-relaxed">This is an AI guidance tool, not a medical diagnosis. In case of emergency, please contact 911 or visit the nearest ER immediately.</p>
              </div>
           </motion.aside>
        </div>

        <AnimatePresence>
        {result && (
           <motion.section
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
              className="mt-16 space-y-8"
           >
              <div className="rounded-[2.5rem] bg-gradient-to-br from-indigo-50 to-fuchsia-50 border border-white p-8 md:p-12 text-center relative overflow-hidden backdrop-blur-xl shadow-xl shadow-indigo-100/50">
                 <div className="absolute top-0 right-0 p-10 opacity-5">
                    <Stethoscope className="w-48 h-48 rotate-12 text-indigo-900" />
                 </div>
                 <div className="relative z-10 max-w-3xl mx-auto">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-fuchsia-600 mb-4">Recommended Specialty</p>
                    <h3 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">{result.recommendedSpecialty}</h3>
                    <p className="text-base md:text-lg leading-relaxed text-indigo-900/80 bg-white/60 p-6 rounded-2xl border border-white backdrop-blur-md shadow-sm">
                       "{result.explanation}"
                    </p>
                 </div>
              </div>

              <div className="flex items-center justify-between mb-2 px-2">
                 <h3 className="text-xl font-bold text-slate-800">Top Doctor Matches</h3>
                 <span className="text-xs font-semibold px-3 py-1 bg-white rounded-full text-slate-600 ring-1 ring-slate-200 shadow-sm">
                    {result.topDoctors.length} found
                 </span>
              </div>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                 {result.topDoctors.map((doctor, i) => (
                    <motion.article
                       key={doctor.doctorId}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ duration: 0.4, delay: 0.1 * i }}
                       className="group relative rounded-3xl bg-white/70 hover:bg-white transition-all duration-300 border border-white hover:border-indigo-200 p-6 backdrop-blur-md hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col h-full shadow-md"
                    >
                       <div className="flex items-start justify-between mb-4">
                          <div className="inline-flex rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-3 text-white shadow-lg shadow-indigo-500/20">
                             <Stethoscope className="h-6 w-6" />
                          </div>
                          <div className="flex flex-col items-end">
                             <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-600">
                                {(doctor.finalScore * 100).toFixed(0)}%
                             </div>
                             <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Match</div>
                          </div>
                       </div>
                       
                       <h4 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{doctor.doctorName}</h4>
                       <p className="mt-1 text-sm font-medium text-indigo-600/80">{doctor.specialization}</p>

                       <div className="mt-6 mb-8 grid grid-cols-2 gap-3 text-sm text-slate-600 flex-grow">
                          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                             <Clock className="w-4 h-4 text-indigo-500" />
                             <span>{doctor.experienceYears} Yrs Exp</span>
                          </div>
                          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                             <ShieldCheck className="w-4 h-4 text-emerald-500" />
                             <span className="truncate">{doctor.verificationStatus}</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                             <Activity className="w-4 h-4 text-cyan-500" />
                             <span className="truncate">Next: {doctor.nextAvailableSlot || 'Contact for slot'}</span>
                          </div>
                       </div>

                       <Link
                          to={`/doctors/${doctor.doctorId}`}
                          className="mt-auto w-full inline-flex items-center justify-between rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition-all overflow-hidden group/btn"
                       >
                          <span>View Profile</span>
                          <div className="bg-indigo-100 text-indigo-600 rounded-full p-1 group-hover/btn:translate-x-1 group-hover/btn:bg-indigo-600 group-hover/btn:text-white transition-all text-indigo-600">
                             <ChevronRight className="h-4 w-4" />
                          </div>
                       </Link>
                    </motion.article>
                 ))}
              </div>
           </motion.section>
        )}
        </AnimatePresence>
      </div>
      
      {/* Global simple styles for shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
