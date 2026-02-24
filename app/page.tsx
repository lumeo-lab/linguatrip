'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import LandingPage from '@/components/LandingPage';
import AuthScreen from '@/components/AuthScreen';
import type { User } from '@supabase/supabase-js';

export default function Home() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    // Pobierz aktualną sesję
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Nasłuchuj na zmiany auth (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Ładowanie — czekamy na odpowiedź Supabase
  if (user === undefined) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0d1117' }}
      >
        <div className="text-center">
          <div className="text-5xl mb-4 animate-float">✈️</div>
          <div className="text-sm animate-pulse" style={{ color: '#4a9eff' }}>
            Ładowanie…
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return <LandingPage />;
}
