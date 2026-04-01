import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Clock, Star, CheckCircle, ChevronRight, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AppointmentBooking() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [step, setStep] = useState(1);

  const doctors = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      specialty: 'Cardiologist',
      rating: 4.9,
      reviews: 234,
      location: 'San Francisco, CA',
      availability: 'Available Today',
      image: '👩‍⚕️',
      price: '$150',
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      specialty: 'General Practitioner',
      rating: 4.8,
      reviews: 512,
      location: 'San Francisco, CA',
      availability: 'Available Today',
      image: '👨‍⚕️',
      price: '$100',
    },
    {
      id: 3,
      name: 'Dr. Emily Rodriguez',
      specialty: 'Dermatologist',
      rating: 4.7,
      reviews: 189,
      location: 'San Francisco, CA',
      availability: 'Available Tomorrow',
      image: '👩‍⚕️',
      price: '$120',
    },
    {
      id: 4,
      name: 'Dr. James Wilson',
      specialty: 'Neurologist',
      rating: 4.9,
      reviews: 267,
      location: 'San Francisco, CA',
      availability: 'Available in 2 Days',
      image: '👨‍⚕️',
      price: '$180',
    },
  ];

  const timeSlots = [
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
    '5:00 PM',
  ];

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
    if (step < 4) setStep(step + 1);
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
                  placeholder="Search by name, specialty..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {doctors.map((doctor) => (
                <motion.div
                  key={doctor.id}
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  onClick={() => {
                    setSelectedDoctor(doctor.id);
                    handleNext();
                  }}
                  className={`cursor-pointer rounded-xl border-2 p-6 transition-all ${
                    selectedDoctor === doctor.id
                      ? 'border-blue-600 bg-blue-50/50'
                      : 'border-gray-200/30 hover:border-blue-200'
                  } bg-white`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{doctor.image}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                        <p className="text-sm text-gray-600">{doctor.specialty}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {doctor.rating}
                          </span>
                          <span className="text-sm text-gray-500">({doctor.reviews})</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{doctor.price}</span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {doctor.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-medium">{doctor.availability}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
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
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <motion.button
                  key={day}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(`2024-04-${15 + day}`)}
                  className={`py-4 rounded-lg border-2 font-semibold transition-all ${
                    selectedDate === `2024-04-${15 + day}`
                      ? 'border-blue-600 bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                      : 'border-gray-200/30 bg-white text-gray-700 hover:border-blue-200'
                  }`}
                >
                  <div className="text-sm font-medium">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day - 1]}
                  </div>
                  <div className="text-lg">{15 + day}</div>
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

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              {timeSlots.map((time) => (
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
                  {time}
                </motion.button>
              ))}
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              disabled={!selectedTime}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
            >
              Continue
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

              <h2 className="text-3xl font-bold text-gray-900 mb-2">Appointment Confirmed!</h2>
              <p className="text-gray-600 mb-8">
                Your appointment has been successfully booked
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
                    <p className="font-semibold text-gray-900">
                      {doctors.find((d) => d.id === selectedDoctor)?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date & Time</p>
                    <p className="font-semibold text-gray-900">
                      {selectedDate} at {selectedTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Confirmation Number</p>
                    <p className="font-semibold text-blue-600">CLX-2024-4567890</p>
                  </div>
                </div>
              </motion.div>

              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                >
                  Add to Calendar
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
