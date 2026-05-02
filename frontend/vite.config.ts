import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';

function createProxyOptions(target: string, rewrite?: ProxyOptions['rewrite']): ProxyOptions {
  return {
    target,
    changeOrigin: false,
    xfwd: true,
    ...(rewrite ? { rewrite } : {}),
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const authTarget = env.VITE_DEV_AUTH_PROXY_TARGET || 'http://localhost:8080';
  const appointmentTarget = env.VITE_DEV_APPOINTMENT_PROXY_TARGET || 'http://localhost:8082';
  const patientTarget = env.VITE_DEV_PATIENT_PROXY_TARGET || 'http://localhost:8085';
  const doctorTarget = env.VITE_DEV_DOCTOR_PROXY_TARGET || 'http://localhost:8083';
  const notificationTarget = env.VITE_DEV_NOTIFICATION_PROXY_TARGET || 'http://localhost:8084';
  const paymentTarget = env.VITE_DEV_PAYMENT_PROXY_TARGET || 'http://localhost:8086';
  const telemedicineTarget = env.VITE_DEV_TELEMEDICINE_PROXY_TARGET || 'http://localhost:8087';
  const aiSymptomTarget = env.VITE_DEV_AI_SYMPTOM_PROXY_TARGET || 'http://localhost:8093';
  const gatewayTarget = env.VITE_DEV_GATEWAY_PROXY_TARGET || 'http://localhost:8088';

  return {
    plugins: [react()],
    server: {
      host: 'localhost',
      proxy: {
        '/api/auth': createProxyOptions(authTarget, (path) => path.replace(/^\/api\/auth/, '/auth')),
        '/api/appointments': createProxyOptions(
          appointmentTarget,
          (path) => path.replace(/^\/api\/appointments/, '/appointments'),
        ),
        '/api/patients': createProxyOptions(
          patientTarget,
          (path) => path.replace(/^\/api\/patients/, '/patients'),
        ),
        '/api/doctors': createProxyOptions(
          doctorTarget,
          (path) => path.replace(/^\/api\/doctors/, '/api/v1/doctors'),
        ),
        '/api/prescriptions': createProxyOptions(
          doctorTarget,
          (path) => path.replace(/^\/api\/prescriptions/, '/api/v1/prescriptions'),
        ),
        '/api/notifications': createProxyOptions(
          notificationTarget,
          (path) => path.replace(/^\/api\/notifications/, '/api/v1/notifications'),
        ),
        '/api/payments': createProxyOptions(
          paymentTarget,
          (path) => path.replace(/^\/api\/payments/, '/api/v1/payments'),
        ),
        '/api/telemedicine': createProxyOptions(telemedicineTarget),
        '/api/ai-symptoms': createProxyOptions(
          aiSymptomTarget,
          (path) => path.replace(/^\/api\/ai-symptoms/, '/api/v1/ai-symptoms'),
        ),
        '/api/ai': createProxyOptions(gatewayTarget),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
