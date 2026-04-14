import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Clock,
  LayoutDashboard,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  createAppointment,
  getDoctorAvailability,
  type AppointmentResponse,
} from '../services/appointmentsApi';
import { getBookableDoctors } from '../services/doctor/doctorApi';
import type { AppointmentBookingDoctor } from '../types/doctor';
import { formatDisplayAmount } from '../utils/currency';

const APPOINTMENT_DURATION_MINUTES = 60;
const FIXED_VIDEO_PRICE = 15;
const FIXED_PHYSICAL_PRICE = 20;

function formatTimeLabel(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const normalizedHours = hours % 12 || 12;
  return `${normalizedHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function addMinutes(time: string, minutesToAdd: number) {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const nextHours = Math.floor(totalMinutes / 60);
  const nextMinutes = totalMinutes % 60;
  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
}

function getNextSevenDates() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const isoDate = date.toISOString().split('T')[0];

    return {
      value: isoDate,
      dayLabel: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate(),
      fullLabel: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
  });
}

function getDefaultTimeSlots() {
  return ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
}

function resetBookingState(
  setSelectedDoctor: (value: number | null) => void,
  setSelectedDate: (value: string | null) => void,
  setSelectedTime: (value: string | null) => void,
  setReasonForVisit: (value: string) => void,
  setAvailabilityTimes: (value: string[]) => void,
  setAvailabilityMessage: (value: string) => void,
  setAvailabilityError: (value: string) => void,
  setSubmitError: (value: string) => void,
  setCreatedAppointment: (value: AppointmentResponse | null) => void,
  setStep: (value: number) => void,
) {
  setStep(1);
  setSelectedDoctor(null);
  setSelectedDate(null);
  setSelectedTime(null);
  setReasonForVisit('');
  setAvailabilityTimes([]);
  setAvailabilityMessage('');
  setAvailabilityError('');
  setSubmitError('');
  setCreatedAppointment(null);
}

export default function AppointmentBooking() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [appointmentType, setAppointmentType] = useState<'VIDEO' | 'PHYSICAL'>('PHYSICAL');
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [availabilityTimes, setAvailabilityTimes] = useState<string[]>([]);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<AppointmentResponse | null>(null);
  const [doctors, setDoctors] = useState<AppointmentBookingDoctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [doctorsError, setDoctorsError] = useState('');

  const dateOptions = useMemo(() => getNextSevenDates(), []);

  useEffect(() => {
    let isActive = true;

    const loadDoctors = async () => {
      setIsLoadingDoctors(true);
      setDoctorsError('');

      try {
        const response = await getBookableDoctors();

        if (isActive) {
          setDoctors(response);
        }
      } catch (error) {
        if (isActive) {
          setDoctors([]);
          setDoctorsError(error instanceof Error ? error.message : 'Failed to load doctors');
        }
      } finally {
        if (isActive) {
          setIsLoadingDoctors(false);
        }
      }
    };

    void loadDoctors();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredDoctors = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return doctors;
    }

    return doctors.filter((doctor) =>
      [
        doctor.fullName,
        doctor.specialty,
        doctor.qualifications,
        doctor.location,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [doctors, searchTerm]);

  const selectedDoctorDetails = useMemo(
    () => doctors.find((doctor) => doctor.id === selectedDoctor) || null,
    [doctors, selectedDoctor],
  );

  const resolvedPrice = useMemo(() => {
    if (selectedDoctorDetails?.consultationFee) {
      const custom = Number(selectedDoctorDetails.consultationFee);
      if (!Number.isNaN(custom) && custom > 0) {
        return custom;
      }
    }

    return appointmentType === 'VIDEO' ? FIXED_VIDEO_PRICE : FIXED_PHYSICAL_PRICE;
  }, [appointmentType, selectedDoctorDetails]);

  const pricingSourceLabel =
    selectedDoctorDetails?.consultationFee && Number(selectedDoctorDetails.consultationFee) > 0
      ? 'Doctor custom price'
      : 'Fixed system price';

  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      setAvailabilityTimes([]);
      setAvailabilityMessage('');
      setAvailabilityError('');
      return;
    }

    let isActive = true;

    const loadAvailability = async () => {
      setIsLoadingAvailability(true);
      setAvailabilityError('');
      setSelectedTime(null);

      try {
        const response = await getDoctorAvailability(selectedDoctor, selectedDate);
        const bookedStartTimes = new Set(response.bookedSlots.map((slot) => slot.startTime.slice(0, 5)));
        const availableSlots = getDefaultTimeSlots().filter((time) => !bookedStartTimes.has(time));

        if (isActive) {
          setAvailabilityTimes(availableSlots);
          setAvailabilityMessage(response.message);
        }
      } catch (error) {
        if (isActive) {
          setAvailabilityTimes([]);
          setAvailabilityError(
            error instanceof Error ? error.message : 'Failed to load doctor availability',
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingAvailability(false);
        }
      }
    };

    void loadAvailability();

    return () => {
      isActive = false;
    };
  }, [selectedDoctor, selectedDate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleDoctorSelect = (doctor: AppointmentBookingDoctor) => {
    setSelectedDoctor(doctor.id);
    setSelectedDate(null);
    setSelectedTime(null);
    setAvailabilityTimes([]);
    setAvailabilityMessage('');
    setAvailabilityError('');
    setSubmitError('');
    setCreatedAppointment(null);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      setSubmitError('Please select doctor, date, and time before booking');
      return;
    }

    if (!reasonForVisit.trim()) {
      setSubmitError('Please enter a reason for visit');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await createAppointment({
        doctorId: selectedDoctor,
        appointmentDate: selectedDate,
        startTime: selectedTime,
        endTime: addMinutes(selectedTime, APPOINTMENT_DURATION_MINUTES),
        appointmentType,
        reasonForVisit: reasonForVisit.trim(),
      });

      setCreatedAppointment(response);
      setStep(4);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Book an Appointment</h1>
            <p className="text-gray-600">Find and book with a healthcare professional</p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-white px-5 py-3 font-bold text-teal-700 shadow-sm hover:bg-teal-50 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12 flex justify-between items-center"
        >
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center flex-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= stepNum
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {step > stepNum ? <CheckCircle className="w-6 h-6" /> : stepNum}
              </motion.div>
              {stepNum < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step > stepNum ? 'bg-gradient-to-r from-blue-600 to-cyan-500' : 'bg-gray-200'
                  } transition-all`}
                />
              )}
            </div>
          ))}
        </motion.div>

        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Find a Doctor</h2>

            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-blue-600" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, specialty..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {isLoadingDoctors && (
              <div className="rounded-2xl border border-gray-200/40 bg-white p-10 text-center shadow-lg">
                <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
                <p className="text-gray-600">Loading doctors from doctor-service...</p>
              </div>
            )}

            {!isLoadingDoctors && doctorsError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-700">Unable to load doctors</p>
                    <p className="mt-1 text-sm text-red-600">{doctorsError}</p>
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!isLoadingDoctors && !doctorsError && filteredDoctors.length === 0 && (
              <div className="rounded-2xl border border-gray-200/40 bg-white p-10 text-center shadow-lg">
                <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900">
                  {doctors.length === 0 ? 'No doctors available right now' : 'No matching doctors found'}
                </h3>
                <p className="mt-2 text-gray-600">
                  {doctors.length === 0
                    ? 'Doctor-service did not return any approved active doctors for booking.'
                    : 'Try a different name, specialty, or clinic location.'}
                </p>
              </div>
            )}

            {!isLoadingDoctors && !doctorsError && filteredDoctors.length > 0 && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {filteredDoctors.map((doctor) => (
                  <motion.div
                    key={doctor.id}
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                    onClick={() => handleDoctorSelect(doctor)}
                    className={`cursor-pointer rounded-xl border-2 p-6 transition-all ${
                      selectedDoctor === doctor.id
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-gray-200/30 hover:border-blue-200'
                    } bg-white`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {doctor.profilePictureUrl ? (
                          <img src={doctor.profilePictureUrl} alt={doctor.fullName} className="h-14 w-14 rounded-2xl object-cover shadow-sm border border-gray-100" />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-lg font-bold text-white shrink-0 shadow-sm">
                            {doctor.initials}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{doctor.fullName}</h3>
                          <p className="text-sm text-gray-600">{doctor.specialty}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {doctor.profileCompletenessScore}% profile complete
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{doctor.experienceYears}+ yrs</span>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600">{doctor.qualifications}</p>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {doctor.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium">{doctor.availabilityLabel}</span>
                      </div>
                      <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-orange-800">
                        <span className="text-xs font-semibold uppercase tracking-wide">Channeling Price</span>
                        <p className="mt-1 text-sm font-semibold">{doctor.pricingLabel}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Date</h2>

            <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-8">
              {dateOptions.map((dateOption) => (
                <motion.button
                  key={dateOption.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(dateOption.value)}
                  className={`py-4 rounded-lg border-2 font-semibold transition-all ${
                    selectedDate === dateOption.value
                      ? 'border-blue-600 bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                      : 'border-gray-200/30 bg-white text-gray-700 hover:border-blue-200'
                  }`}
                >
                  <div className="text-sm font-medium">{dateOption.dayLabel}</div>
                  <div className="text-lg">{dateOption.dayNumber}</div>
                </motion.button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              disabled={!selectedDate}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
            >
              Continue
            </motion.button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Time</h2>

            <div className="mb-6 rounded-xl border border-gray-200/40 bg-white p-5">
              <div className="flex flex-col gap-2 text-sm text-gray-600">
                <p>
                  <span className="font-semibold text-gray-900">Doctor:</span>{' '}
                  {selectedDoctorDetails?.fullName || 'Not selected'}
                </p>
                <p>
                  <span className="font-semibold text-gray-900">Date:</span>{' '}
                  {selectedDate
                    ? dateOptions.find((option) => option.value === selectedDate)?.fullLabel || selectedDate
                    : 'Not selected'}
                </p>
                <p>
                  <span className="font-semibold text-gray-900">Consultation Type:</span> {appointmentType}
                </p>
                <p>
                  <span className="font-semibold text-gray-900">Estimated Channeling Fee:</span>{' '}
                  {formatDisplayAmount(resolvedPrice, 'USD')} ({pricingSourceLabel})
                </p>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAppointmentType('PHYSICAL')}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                  appointmentType === 'PHYSICAL'
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                }`}
              >
                Physical Consultation
              </button>
              <button
                type="button"
                onClick={() => setAppointmentType('VIDEO')}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                  appointmentType === 'VIDEO'
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                }`}
              >
                Video Consultation
              </button>
            </div>

            {isLoadingAvailability && (
              <div className="mb-6 flex items-center gap-2 text-blue-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading available time slots...
              </div>
            )}

            {availabilityError && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {availabilityError}
              </div>
            )}

            {!availabilityError && availabilityMessage && (
              <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {availabilityMessage}
              </div>
            )}

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              {availabilityTimes.map((time) => (
                <motion.button
                  key={time}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTime(time)}
                  className={`py-4 rounded-lg border-2 font-semibold transition-all ${
                    selectedTime === time
                      ? 'border-blue-600 bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                      : 'border-gray-200/30 bg-white text-gray-700 hover:border-blue-200'
                  }`}
                >
                  {formatTimeLabel(time)}
                </motion.button>
              ))}
            </motion.div>

            {!isLoadingAvailability && !availabilityError && availabilityTimes.length === 0 && (
              <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                No free slots are available for this doctor on the selected date.
              </div>
            )}

            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Reason for Visit</label>
              <textarea
                value={reasonForVisit}
                onChange={(e) => setReasonForVisit(e.target.value)}
                rows={4}
                placeholder="Briefly describe your symptoms or the reason for your appointment"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {submitError && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {submitError}
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => void handleSubmit()}
              disabled={!selectedTime || isSubmitting || isLoadingAvailability}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Booking appointment...
                </>
              ) : (
                'Confirm Appointment'
              )}
            </motion.button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl border border-gray-200/30 p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-6"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>

              <h2 className="text-3xl font-bold text-gray-900 mb-2">Appointment Submitted!</h2>
              <p className="text-gray-600 mb-8">
                Your appointment request has been created successfully and is currently pending.
              </p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 mb-8 text-left"
              >
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Doctor</p>
                    <p className="font-semibold text-gray-900">{selectedDoctorDetails?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date & Time</p>
                    <p className="font-semibold text-gray-900">
                      {createdAppointment?.appointmentDate || selectedDate} at{' '}
                      {createdAppointment?.startTime
                        ? formatTimeLabel(createdAppointment.startTime.slice(0, 5))
                        : selectedTime
                          ? formatTimeLabel(selectedTime)
                          : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Appointment ID</p>
                    <p className="font-semibold text-blue-600">APT-{createdAppointment?.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold text-gray-900">{createdAppointment?.status || 'PENDING'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimated Channeling Fee</p>
                    <p className="font-semibold text-gray-900">
                      {formatDisplayAmount(resolvedPrice, 'USD')} ({pricingSourceLabel})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reason for Visit</p>
                    <p className="font-semibold text-gray-900">
                      {createdAppointment?.reasonForVisit || reasonForVisit}
                    </p>
                  </div>
                </div>
              </motion.div>

              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    resetBookingState(
                      setSelectedDoctor,
                      setSelectedDate,
                      setSelectedTime,
                      setReasonForVisit,
                      setAvailabilityTimes,
                      setAvailabilityMessage,
                      setAvailabilityError,
                      setSubmitError,
                      setCreatedAppointment,
                      setStep,
                    )
                  }
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                >
                  Book Another Appointment
                </motion.button>
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href="/dashboard"
                  className="w-full border border-gray-200/30 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-all inline-flex items-center justify-center gap-2"
                >
                  Back to Dashboard
                  <ChevronRight className="w-4 h-4" />
                </motion.a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
