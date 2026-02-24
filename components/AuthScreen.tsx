'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim()) {
      setError('Wypełnij wszystkie pola.');
      return;
    }
    if (password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        // Supabase przy wyłączonym confirm email zwraca identities: [] dla istniejącego konta
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setError('Ten email jest już zarejestrowany. Zaloguj się.');
          setMode('login');
          setLoading(false);
          return;
        }
        setSuccess('Konto założone! Możesz się teraz zalogować.');
        setMode('login');
        setPassword('');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        // Strona wykryje zmianę sesji przez onAuthStateChange i odświeży widok
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Coś poszło nie tak.';
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setError('Nieprawidłowy email lub hasło.');
      } else if (msg.includes('User already registered') || msg.includes('already registered')) {
        setError('Ten email jest już zarejestrowany. Zaloguj się.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Potwierdź adres email przed logowaniem.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #080d18 0%, #0d1117 60%, #07111f 100%)' }}
    >
      {/* BG glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 40%, rgba(74,158,255,0.07) 0%, transparent 65%)',
        }}
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 relative z-10"
      >
        <div className="text-6xl mb-3 animate-float">✈️</div>
        <h1 className="text-4xl font-black">
          <span style={{ color: '#f0b429' }}>Lingua</span>
          <span className="text-white">Trip</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8b949e' }}>
          Ucz się języków, podróżując po świecie
        </p>
      </motion.div>

      {/* Karta */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="w-full max-w-sm relative z-10"
      >
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(16,22,32,0.9)',
            border: '1px solid rgba(48,54,61,0.8)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Zakładki */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: 'rgba(13,17,23,0.8)' }}
          >
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={
                  mode === m
                    ? { background: 'rgba(240,180,41,0.15)', color: '#f0b429', border: '1px solid rgba(240,180,41,0.3)' }
                    : { color: '#484f58', border: '1px solid transparent' }
                }
              >
                {m === 'login' ? 'Zaloguj się' : 'Zarejestruj się'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8b949e' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj@email.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none"
                style={{
                  background: 'rgba(13,17,23,0.9)',
                  border: '1px solid rgba(48,54,61,0.8)',
                  color: '#f0f6fc',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(240,180,41,0.5)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(48,54,61,0.8)')}
              />
            </div>

            {/* Hasło */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8b949e' }}>
                Hasło
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Min. 6 znaków' : '••••••••'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none"
                style={{
                  background: 'rgba(13,17,23,0.9)',
                  border: '1px solid rgba(48,54,61,0.8)',
                  color: '#f0f6fc',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(240,180,41,0.5)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(48,54,61,0.8)')}
              />
            </div>

            {/* Błąd / sukces */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm px-3 py-2.5 rounded-lg"
                  style={{ background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.25)' }}
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm px-3 py-2.5 rounded-lg"
                  style={{ background: 'rgba(62,207,142,0.1)', color: '#3ecf8e', border: '1px solid rgba(62,207,142,0.25)' }}
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 font-bold text-sm transition-all"
              style={loading ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            >
              {loading
                ? '⏳ Chwileczkę…'
                : mode === 'login'
                ? '→ Zaloguj się'
                : '✈️ Stwórz konto'}
            </button>
          </form>

          {/* Switch mode hint */}
          <p className="text-center text-xs mt-5" style={{ color: '#484f58' }}>
            {mode === 'login' ? (
              <>Nie masz konta?{' '}
                <button onClick={() => { setMode('register'); setError(null); }} className="underline" style={{ color: '#8b949e' }}>
                  Zarejestruj się
                </button>
              </>
            ) : (
              <>Masz już konto?{' '}
                <button onClick={() => { setMode('login'); setError(null); }} className="underline" style={{ color: '#8b949e' }}>
                  Zaloguj się
                </button>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
