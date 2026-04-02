import { useState } from 'react';
import { motion } from 'framer-motion';
import { Minimize2, Maximize2, Mic, MicOff, Volume2, Phone, MessageCircle, Share2, Download, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Telemedicine() {
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'doctor',
      name: 'Dr. Sarah Johnson',
      message: 'Good afternoon! How are you feeling today?',
      time: '2:00 PM',
    },
    {
      id: 2,
      sender: 'patient',
      name: 'You',
      message: 'I have been having some headaches recently',
      time: '2:01 PM',
    },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          sender: 'patient',
          name: 'You',
          message: newMessage,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setNewMessage('');
    }
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 pt-0' : 'min-h-screen pt-32 pb-20'} px-4 sm:px-6 lg:px-8 bg-black`}>
      <div className={`${isFullscreen ? 'h-screen' : 'max-w-7xl mx-auto'} flex flex-col`}>
        {!isFullscreen && (
          <div className="mb-4 flex justify-end">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-teal-500/40 bg-teal-500/20 px-5 py-2.5 font-bold text-teal-200 hover:bg-teal-500/30 transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`${!isFullscreen && 'mb-6'} bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl flex-1 flex flex-col`}
        >
          <div className="relative flex-1 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden group">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-transparent to-cyan-500/20" />
            </div>

            <div className="relative text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-5xl shadow-2xl"
              >
                👩‍⚕️
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Dr. Sarah Johnson</h2>
              <p className="text-gray-400 mb-4">Cardiologist</p>
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-full text-sm font-medium"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Connected
              </motion.div>
            </div>

            <div className="absolute top-4 right-4 flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-200 transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-200 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          <div className="bg-gray-900 border-t border-gray-700 px-6 py-6">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMuted(!isMuted)}
                className={`p-4 rounded-full transition-all ${
                  isMuted
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-200 transition-all"
              >
                <Volume2 className="w-6 h-6" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all"
              >
                <Phone className="w-6 h-6" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowChat(!showChat)}
                className={`p-4 rounded-full transition-all relative ${
                  showChat
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                }`}
              >
                <MessageCircle className="w-6 h-6" />
                {!showChat && (
                  <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-200 transition-all"
              >
                <Download className="w-6 h-6" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`${!isFullscreen && 'mt-6'} bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl flex flex-col h-96`}
          >
            <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
              <h3 className="font-semibold text-white">Consultation Chat</h3>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs ${
                      msg.sender === 'patient'
                        ? 'bg-blue-600 text-white rounded-l-xl rounded-tr-xl'
                        : 'bg-gray-800 text-gray-200 rounded-r-xl rounded-tl-xl'
                    } px-4 py-3`}
                  >
                    {msg.sender === 'doctor' && (
                      <p className="text-xs font-semibold mb-1 opacity-75">{msg.name}</p>
                    )}
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs mt-2 opacity-60">{msg.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Send
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
