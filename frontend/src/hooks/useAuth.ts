import { useEffect, useState } from 'react';
import { auth } from '../services/supabase';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const userData = await auth.getCurrentUser();
        setUser(userData);
      } catch (err) {
        setError('Failed to fetch user');
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const { data } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, []);

  return { user, loading, error };
}
