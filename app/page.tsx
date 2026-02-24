'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/lib/store';
import { loadProgress } from '@/lib/syncProgress';
import LandingPage from '@/components/LandingPage';
import AuthScreen from '@/components/AuthScreen';
import type { User } from '@supabase/supabase-js';

export default function Home() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [hydrated, setHydrated] = useState(false);
  const { setUserId, resetAll, restoreFromCloud } = useGameStore();

  // Krok 1: czekaj aż Zustand wczyta dane z localStorage
  useEffect(() => {
    if (useGameStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useGameStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  // Krok 2: sprawdź auth dopiero po rehydracji
  useEffect(() => {
    if (!hydrated) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) checkUser(u.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) checkUser(u.id);
    });

    return () => subscription.unsubscribe();
  }, [hydrated]);

  const checkUser = async (incomingId: string) => {
    const storedId = useGameStore.getState().userId;
    if (storedId !== incomingId) {
      resetAll();
      setUserId(incomingId);
    }
    // Zawsze wczytaj z chmury — Supabase = source of truth
    const cloudData = await loadProgress(incomingId);
    if (cloudData) {
      restoreFromCloud(cloudData);
    }
  };

  if (!hydrated || user === undefined) {
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
