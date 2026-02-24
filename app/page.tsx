'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/lib/store';
import LandingPage from '@/components/LandingPage';
import AuthScreen from '@/components/AuthScreen';
import type { User } from '@supabase/supabase-js';

export default function Home() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const { userId, setUserId, resetAll } = useGameStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) handleUserLogin(u.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) handleUserLogin(u.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserLogin = (incomingId: string) => {
    // Jeśli store należy do innego użytkownika — resetuj
    const storedId = useGameStore.getState().userId;
    if (storedId !== incomingId) {
      resetAll();
      setUserId(incomingId);
    }
  };

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
        <div className="text-center">
          <div className="text-5xl mb-4 animate-float">✈️</div>
          <div className="text-sm animate-pulse" style={{ color: '#4a9eff' }}>Ładowanie…</div>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return <LandingPage />;
}
