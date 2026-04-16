import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import { Heart } from 'lucide-react';

type AuthMode = 'login' | 'register';

export default function Auth() {
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>(location.pathname === '/register' ? 'register' : 'login');

  useEffect(() => {
    const requestedMode = location.pathname === '/register' ? 'register' : 'login';
    setMode(requestedMode);
  }, [location.pathname]);

  const handleSwitch = (newMode: AuthMode) => {
    setMode(newMode);
  };

  const isLogin = mode === 'login';

  return (
    <div className="min-h-[calc(100vh-var(--header-height,5rem))] bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4 sm:p-6 py-10 lg:py-16">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden flex flex-col lg:flex-row min-h-[600px] border border-slate-200">
        
        {/* Form Side */}
        <motion.div 
          layout
          className={`w-full lg:w-1/2 p-8 sm:p-12 lg:px-16 flex flex-col justify-center bg-white z-10 ${isLogin ? 'lg:order-1' : 'lg:order-2'}`}
        >
          <div className="flex items-center gap-2 mb-10">
            <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-2 rounded-xl">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Clinexa
            </span>
          </div>

          <div className="flex-1 w-full flex flex-col justify-center relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                transition={{ duration: 0.3 }}
              >
                {mode === 'login' ? (
                  <LoginForm onSwitch={() => handleSwitch('register')} />
                ) : (
                  <RegisterForm onSwitch={() => handleSwitch('login')} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Image Side */}
        <motion.div 
          layout
          className={`w-full lg:w-1/2 relative bg-slate-900 hidden lg:block overflow-hidden transition-all duration-500 ${isLogin ? 'lg:order-2' : 'lg:order-1'}`}
        >
          <img 
            src="https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=1920" 
            alt="Healthcare Professional"
            className="absolute inset-0 w-full h-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/30 to-transparent flex items-end p-12">
            <motion.div 
              key={mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-white max-w-lg"
            >
              <h3 className="text-4xl font-bold mb-4 leading-tight">
                {isLogin ? 'Welcome back to better health.' : 'Begin your journey to better health.'}
              </h3>
              <p className="text-blue-100 text-lg">
                Join thousands of patients and doctors experiencing the future of AI-assisted healthcare management.
              </p>
            </motion.div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
