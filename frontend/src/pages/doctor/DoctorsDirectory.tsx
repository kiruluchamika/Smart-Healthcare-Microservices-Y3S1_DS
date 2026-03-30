import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ListFilter } from 'lucide-react';
import { DoctorCard } from '../../components/doctor/DoctorCard';
import { DoctorFilters } from '../../components/doctor/DoctorFilters';
import { getDoctors, searchDoctors } from '../../services/doctor/doctorApi';
import type { DoctorSearchParams, DoctorServiceDoctor, PagedResponse } from '../../types/doctor';

const defaultFilters: DoctorSearchParams = {};

export default function DoctorsDirectory() {
  const [filters, setFilters] = useState<DoctorSearchParams>(defaultFilters);
  const [queryFilters, setQueryFilters] = useState<DoctorSearchParams>(defaultFilters);
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
        if (isFilterMode) {
          const result = await searchDoctors(queryFilters);
          setDoctors(result);
          setPageState(null);
          return;
        }

        const result = await getDoctors({ page, size, sortBy: 'createdAt', sortDir: 'desc' });
        setDoctors(result.content);
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
    setQueryFilters(filters);
  };

  const handleResetFilters = () => {
    setPage(0);
    setFilters(defaultFilters);
    setQueryFilters(defaultFilters);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#99f6e4_0%,transparent_35%),radial-gradient(circle_at_90%_90%,#fed7aa_0%,transparent_40%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8"
        >
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 ring-1 ring-teal-100">
            <ListFilter className="h-3.5 w-3.5" />
            Doctor Service
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Discover Doctors</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Search verified professionals, filter by availability day, and explore profiles built from the doctor-service backend.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
          <DoctorFilters
            filters={filters}
            onChange={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />

          <section>
            {loading && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-white/80" />
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                <p className="text-sm font-semibold text-rose-700">{error}</p>
              </div>
            )}

            {!loading && !error && !doctors.length && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/90 p-10 text-center">
                <p className="text-lg font-semibold text-slate-800">No doctors found</p>
                <p className="mt-2 text-sm text-slate-600">Try adjusting your filters and run the search again.</p>
              </div>
            )}

            {!loading && !error && doctors.length > 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {doctors.map((doctor) => (
                    <DoctorCard key={doctor.id} doctor={doctor} />
                  ))}
                </div>

                {!isFilterMode && pageState && (
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm text-slate-600">
                      Page {pageState.page + 1} of {Math.max(pageState.totalPages, 1)} ({pageState.totalElements} total)
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                        disabled={pageState.page === 0}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage((prev) => prev + 1)}
                        disabled={pageState.page + 1 >= pageState.totalPages}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
