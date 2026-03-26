import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';

type AuthMode = 'login' | 'register';

export default function Auth() {
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>(location.pathname === '/register' ? 'register' : 'login');
  const [rotateDirection, setRotateDirection] = useState(1);

  useEffect(() => {
    const requestedMode = location.pathname === '/register' ? 'register' : 'login';
    setMode(requestedMode);
  }, [location.pathname]);

  const handleSwitch = (newMode: AuthMode) => {
    setRotateDirection(newMode === 'register' ? 1 : -1);
    setMode(newMode);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-md mx-4 px-4 sm:px-0 py-8 sm:py-0">
        {/* Toggle Interface */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 sm:mb-8 flex gap-2 bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20"
        >
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => handleSwitch(m)}
              className="flex-1 relative py-2.5 sm:py-3 font-semibold text-xs sm:text-sm transition-all duration-300"
            >
              {mode === m && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className={mode === m ? 'text-white' : 'text-gray-400'}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </span>
            </button>
          ))}
        </motion.div>

        {/* 3D Card Container with Rotation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            perspective: '1000px',
          }}
          className="relative h-auto min-h-[520px] sm:h-[600px] lg:h-[650px]"
        >
          <motion.div
            key={mode}
            initial={{ rotateY: rotateDirection * 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: rotateDirection * -90, opacity: 0 }}
            transition={{
              rotateY: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.3 },
            }}
            style={{
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
            }}
            className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 sm:p-8 shadow-2xl overflow-y-auto sm:overflow-hidden"
          >
            {mode === 'login' ? (
              <LoginForm onSwitch={() => handleSwitch('register')} />
            ) : (
              <RegisterForm onSwitch={() => handleSwitch('login')} />
            )}
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 sm:mt-8 text-center text-gray-400 text-xs sm:text-sm"
        >
          <p>
            Part of <span className="text-cyan-400 font-semibold">Clinexa</span> - Modern Healthcare
            Platform
          </p>
        </motion.div>
      </div>

      {/* Gradient orbs for extra visual interest */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-tl from-blue-600/20 to-cyan-500/20 blur-3xl pointer-events-none"
      />
    </div>
  );
}
