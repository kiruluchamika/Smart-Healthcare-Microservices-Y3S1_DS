import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Calendar, Award, Save, CreditCard as Edit2, ChevronRight } from 'lucide-react';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1990-05-15',
    location: 'San Francisco, CA',
    bio: 'Health-conscious individual focused on preventive care',
  });

  const [formData, setFormData] = useState(profile);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setProfile(formData);
    setIsEditing(false);
  };

  const sections = [
    {
      title: 'Health Records',
      items: [
        { label: 'Last Checkup', value: '2 months ago' },
        { label: 'Blood Type', value: 'O+' },
        { label: 'Allergies', value: 'Penicillin' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { label: 'Preferred Language', value: 'English' },
        { label: 'Notification', value: 'Enabled' },
        { label: 'Data Sharing', value: 'Restricted' },
      ],
    },
  ];

  const achievements = [
    { icon: '💪', label: 'Workout Streak', value: '15 days' },
    { icon: '🥗', label: 'Healthy Meals', value: '42 logged' },
    { icon: '😴', label: 'Sleep Goals', value: '8/10 nights' },
    { icon: '🚶', label: 'Steps Average', value: '8,234/day' },
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

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your personal information and preferences</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-200/30 shadow-lg overflow-hidden mb-8"
        >
          <div className="h-32 bg-gradient-to-r from-blue-600 to-cyan-500" />

          <div className="px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 -mt-16 mb-8">
              <div className="flex items-end gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-32 h-32 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-5xl border-4 border-white shadow-xl"
                >
                  👤
                </motion.div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{profile.fullName}</h2>
                  <p className="text-gray-600">{profile.bio}</p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsEditing(!isEditing);
                  if (isEditing) setFormData(profile);
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
              >
                {isEditing ? (
                  <>
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </>
                )}
              </motion.button>
            </div>

            {!isEditing ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <motion.div variants={itemVariants} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <p className="text-gray-900 font-medium">{profile.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </label>
                    <p className="text-gray-900 font-medium">{profile.phone}</p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4" />
                      Date of Birth
                    </label>
                    <p className="text-gray-900 font-medium">{profile.dateOfBirth}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </label>
                    <p className="text-gray-900 font-medium">{profile.location}</p>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="md:col-span-2 flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
        >
          {sections.map((section, idx) => (
            <motion.div
              key={section.title}
              variants={itemVariants}
              className="bg-white rounded-xl border border-gray-200/30 shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h3>
              <div className="space-y-3">
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-gray-600 font-medium">{item.label}</span>
                    <span className="text-gray-900 font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl border border-gray-200/30 shadow-lg p-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-6 h-6 text-blue-600" />
            <h3 className="text-2xl font-bold text-gray-900">Health Achievements</h3>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {achievements.map((achievement, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 text-center hover:shadow-lg transition-all"
              >
                <div className="text-4xl mb-3">{achievement.icon}</div>
                <h4 className="font-semibold text-gray-900 text-sm mb-2">{achievement.label}</h4>
                <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  {achievement.value}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200/30 hover:border-blue-200 hover:shadow-lg transition-all group"
          >
            <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
              Download Health Records
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200/30 hover:border-blue-200 hover:shadow-lg transition-all group"
          >
            <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
              Privacy Settings
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200/30 hover:border-red-200 hover:shadow-lg transition-all group"
          >
            <span className="font-medium text-gray-700 group-hover:text-red-600 transition-colors">
              Sign Out
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
