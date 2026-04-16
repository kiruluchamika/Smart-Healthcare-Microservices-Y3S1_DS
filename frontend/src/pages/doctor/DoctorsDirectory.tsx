import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ListFilter } from 'lucide-react';
import { DoctorCard } from '../../components/doctor/DoctorCard';
import { DoctorFilters } from '../../components/doctor/DoctorFilters';
import { getDoctors, searchDoctors } from '../../services/doctor/doctorApi';
import type { DoctorSearchParams, DoctorServiceDoctor, PagedResponse } from '../../types/doctor';

const defaultFilters: DoctorSearchParams = {};
const discoveryBaselineFilters: DoctorSearchParams = { verified: true, active: true };

export default function DoctorsDirectory() {
  const [filters, setFilters] = useState<DoctorSearchParams>(defaultFilters);
  const [queryFilters, setQueryFilters] = useState<DoctorSearchParams>(discoveryBaselineFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [doctors, setDoctors] = useState<DoctorServiceDoctor[]>([]);
  const [pageState, setPageState] = useState<PagedResponse<DoctorServiceDoctor> | null>(null);
  const [page, setPage] = useState(0);
  const [size] = useState(9);

  const isFilterMode = useMemo(
    () => Object.values(queryFilters).some((value) => value !== undefined && value !== ''),
    [queryFilters],
  );

  useEffect(() => {
    const loadDoctors = async () => {
      setLoading(true);
      setError('');

      try {
        const effectiveFilters: DoctorSearchParams = { ...queryFilters, ...discoveryBaselineFilters };

        if (isFilterMode) {
          const result = await searchDoctors(effectiveFilters);
          setDoctors(result);
          setPageState(null);
          return;
        }

        const result = await getDoctors({ page, size, sortBy: 'createdAt', sortDir: 'desc' });
        setDoctors(
          result.content.filter(
            (doctor) => doctor.verificationStatus === 'APPROVED' && doctor.active,
          ),
        );
        setPageState(result);
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'Failed to fetch doctors.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadDoctors();
  }, [isFilterMode, page, queryFilters, size]);

  const handleApplyFilters = () => {
    setPage(0);
    setQueryFilters({ ...filters, ...discoveryBaselineFilters });
  };

  const handleResetFilters = () => {
    setPage(0);
    setFilters(defaultFilters);
    setQueryFilters(discoveryBaselineFilters);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 lg:px-8 text-slate-900 font-sans selection:bg-teal-500/30">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-200/40 rounded-full blur-[120px] pointer-events-none opacity-60" />
      <div className="absolute bottom-0 left-[-10%] w-[600px] h-[600px] bg-blue-200/30 rounded-full blur-[100px] pointer-events-none opacity-60" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-teal-100 backdrop-blur-sm shadow-sm mb-4">
             <ListFilter className="h-4 w-4 text-teal-600" />
             <span className="text-xs font-bold uppercase tracking-widest text-teal-700">Verified Specialists</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mb-2">Discover Doctors</h1>
          <p className="text-base text-slate-500 max-w-2xl mx-auto">
            Search verified professionals, filter by availability, and explore detailed profiles from our premium network.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <DoctorFilters
              filters={filters}
              onChange={setFilters}
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
            />
          </motion.div>

          <section>
            {loading && (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="h-[320px] animate-pulse rounded-[2rem] border border-white bg-white/60 backdrop-blur-md shadow-sm" />
                ))}
              </div>
            )}

            {!loading && error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[2rem] border border-rose-200 bg-rose-50/80 backdrop-blur-sm p-6 shadow-sm">
                <p className="text-sm font-semibold text-rose-700">{error}</p>
              </motion.div>
            )}

            {!loading && !error && !doctors.length && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[2.5rem] border border-white bg-white/70 p-16 text-center shadow-xl shadow-teal-900/[0.04] backdrop-blur-xl">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-200">
                   <ListFilter className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">No Specialists Found</h2>
                <p className="text-base text-slate-500 mb-8 max-w-md mx-auto">We couldn't find any verified professionals matching your exact criteria right now.</p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="rounded-2xl bg-teal-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-teal-600/30 transition-all hover:bg-teal-700 hover:shadow-teal-600/50 hover:-translate-y-0.5"
                >
                  Clear All Filters
                </button>
              </motion.div>
            )}

            {!loading && !error && doctors.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {doctors.map((doctor) => (
                    <DoctorCard key={doctor.id} doctor={doctor} />
                  ))}
                </div>

                {!isFilterMode && pageState && (
                  <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white bg-white/70 backdrop-blur-xl px-8 py-5 shadow-lg shadow-teal-900/[0.04]">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-bold text-slate-900">Page {pageState.page + 1}</span>
                       <span className="text-sm font-medium text-slate-500">of {Math.max(pageState.totalPages, 1)}</span>
                       <span className="text-xs font-semibold px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full ml-2">
                         {pageState.totalElements} Total
                       </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                        disabled={pageState.page === 0}
                        className="inline-flex items-center justify-center p-3 rounded-xl border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:hover:bg-white hover:bg-slate-50 hover:shadow-sm transition-all"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage((prev) => prev + 1)}
                        disabled={pageState.page + 1 >= pageState.totalPages}
                        className="inline-flex items-center justify-center p-3 rounded-xl border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:hover:bg-white hover:bg-slate-50 hover:shadow-sm transition-all"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
