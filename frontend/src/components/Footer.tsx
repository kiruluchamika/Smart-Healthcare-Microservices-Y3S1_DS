import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Company',
      links: ['About Us', 'Blog', 'Careers', 'Press'],
    },
    {
      title: 'Services',
      links: ['Telemedicine', 'Appointments', 'Health Records', 'Prescriptions'],
    },
    {
      title: 'Support',
      links: ['Help Center', 'Contact Us', 'Feedback', 'Status'],
    },
    {
      title: 'Legal',
      links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Compliance'],
    },
  ];

  const socialIcons = [
    { icon: Facebook, label: 'Facebook' },
    { icon: Twitter, label: 'Twitter' },
    { icon: Linkedin, label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center">
                <img src="/fav.png" alt="Clinexa" className="h-10 w-10" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Clinexa
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              AI-powered healthcare platform connecting patients with trusted medical professionals.
            </p>
            <div className="flex gap-3">
              {socialIcons.map((social) => (
                <motion.button
                  key={social.label}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={social.label}
                  className="p-2 bg-gray-200/50 hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-500 rounded-lg transition-all group"
                >
                  <social.icon className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {footerSections.map((section, idx) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: (idx + 1) * 0.1 }}
            >
              <h3 className="font-semibold text-gray-900 mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-blue-600 text-sm transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="border-t border-gray-200/30 py-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-blue-600" />
                <span className="text-sm">1-800-CLINEXA</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm">support@clinexa.com</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-sm">San Francisco, CA 94105</span>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <p className="text-gray-600 text-sm">
                Copyright © {currentYear} Clinexa Inc. All rights reserved.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
