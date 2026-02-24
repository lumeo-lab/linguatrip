'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';

interface StarProps {
  width: number; height: number; left: number; top: number;
  opacity: number; duration: number; delay: number;
}

function StarField() {
  const [stars, setStars] = useState<StarProps[]>([]);
  useEffect(() => {
    setStars(
      Array.from({ length: 40 }, () => ({
        width: Math.random() * 2 + 1,
        height: Math.random() * 2 + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        opacity: Math.random() * 0.5 + 0.1,
        duration: Math.random() * 4 + 3,
        delay: Math.random() * 5,
      }))
    );
  }, []);
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: s.width + 'px',
            height: s.height + 'px',
            left: s.left + '%',
            top: s.top + '%',
            opacity: s.opacity,
            animation: `float ${s.duration}s ease-in-out infinite`,
            animationDelay: s.delay + 's',
          }}
        />
      ))}
    </div>
  );
}

type Step = 'hero' | 'choose_avatar' | 'enter_name' | 'choose_level' | 'ready';

export default function LandingPage() {
  const router = useRouter();
  const { player, setPlayerName, setAvatar, setDifficulty, completeOnboarding, isOnboarded } = useGameStore();
  const [step, setStep] = useState<Step>('hero');
  const [localName, setLocalName] = useState('');

  // Jeśli już onboarded → idź na mapę (przez useEffect, nie podczas renderowania)
  useEffect(() => {
    if (isOnboarded) router.push('/map');
  }, [isOnboarded, router]);

  if (isOnboarded) return null;

  const handleAvatarSelect = (avatar: 'kasia' | 'tomek') => {
    setAvatar(avatar);
    setStep('enter_name');
  };

  const handleNameSubmit = () => {
    if (!localName.trim()) return;
    setPlayerName(localName.trim());
    setStep('choose_level');
  };

  const handleLevelSelect = (level: 'A1' | 'A2' | 'B1') => {
    setDifficulty(level);
    setStep('ready');
  };

  const handleStart = () => {
    completeOnboarding();
    router.push('/map');
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col overflow-hidden">
      <StarField />

      <AnimatePresence mode="wait">
        {step === 'hero' && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -40 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.8 }}
              className="mb-6"
            >
              <div className="text-8xl animate-float">✈️</div>
            </motion.div>

            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-6xl md:text-7xl font-black tracking-tight mb-4"
            >
              <span className="text-gold glow-gold">Lingua</span>
              <span className="text-white">Trip</span>
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl text-[#8b949e] mb-3 max-w-lg"
            >
              Ucz się języków, podróżując po świecie
            </motion.p>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-base text-[#484f58] mb-12 max-w-md"
            >
              Przeglądarkowa gra RPG, w której nauka odbywa się przez przeżywanie historii
            </motion.p>

            {/* Feature highlights */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-3 gap-4 mb-12 max-w-lg w-full"
            >
              {[
                { icon: '🗺️', text: 'Mapa świata' },
                { icon: '🤖', text: 'AI dialogi' },
                { icon: '🎮', text: 'RPG system' },
              ].map((f) => (
                <div key={f.text} className="glass-card p-4 text-center">
                  <div className="text-2xl mb-1">{f.icon}</div>
                  <div className="text-xs text-[#8b949e]">{f.text}</div>
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep('choose_avatar')}
              className="btn-primary text-lg px-10 py-4 text-base font-bold"
            >
              Zacznij grę — Londyn czeka! 🇬🇧
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-4 text-xs text-[#484f58]"
            >
              Dzień 1 za darmo • Bez karty kredytowej
            </motion.p>
          </motion.div>
        )}

        {step === 'choose_avatar' && (
          <motion.div
            key="avatar"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10"
          >
            <h2 className="text-3xl font-bold mb-2">Kim jesteś?</h2>
            <p className="text-[#8b949e] mb-10">Wybierz swoją postać, która poleci do Londynu</p>

            <div className="grid grid-cols-2 gap-6 max-w-sm w-full mb-8">
              {([
                { id: 'tomek', emoji: '🧑', name: 'Tomek', desc: 'Ambitny programista z Krakowa' },
                { id: 'kasia', emoji: '👩', name: 'Kasia', desc: 'Graficzka z Warszawy, uwielbia podróże' },
              ] as const).map((avatar) => (
                <motion.button
                  key={avatar.id}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAvatarSelect(avatar.id)}
                  className="glass-card p-6 text-center transition-all duration-200 hover:border-[#f0b429] hover:shadow-lg group"
                >
                  <div className="text-6xl mb-3 group-hover:animate-float">{avatar.emoji}</div>
                  <div className="font-bold text-lg mb-1">{avatar.name}</div>
                  <div className="text-xs text-[#8b949e]">{avatar.desc}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'enter_name' && (
          <motion.div
            key="name"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10"
          >
            <div className="text-6xl mb-4">{player.avatar === 'tomek' ? '🧑' : '👩'}</div>
            <h2 className="text-3xl font-bold mb-2">Jak masz na imię?</h2>
            <p className="text-[#8b949e] mb-8">Twoje imię pojawi się w grze</p>

            <div className="w-full max-w-xs mb-6">
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                placeholder="Twoje imię..."
                maxLength={20}
                className="w-full px-6 py-4 rounded-xl text-lg text-center font-semibold
                  bg-[#161b22] border border-[#30363d] text-white
                  focus:outline-none focus:border-[#f0b429] focus:shadow-[0_0_20px_rgba(240,180,41,0.15)]
                  transition-all duration-200"
                autoFocus
              />
            </div>

            <button
              onClick={handleNameSubmit}
              disabled={!localName.trim()}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            >
              Dalej →
            </button>
          </motion.div>
        )}

        {step === 'choose_level' && (
          <motion.div
            key="level"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10"
          >
            <h2 className="text-3xl font-bold mb-2">Jaki jest Twój poziom angielskiego?</h2>
            <p className="text-[#8b949e] mb-10">Gra dostosuje trudność do Ciebie</p>

            <div className="flex flex-col gap-4 w-full max-w-sm">
              {([
                {
                  level: 'A1',
                  label: 'Znam podstawy',
                  sub: 'Umiem się przedstawić, liczyć i zadawać proste pytania',
                  emoji: '🌱',
                  color: 'rgba(62,207,142,0.15)',
                  border: 'rgba(62,207,142,0.4)',
                },
                {
                  level: 'A2',
                  label: 'Radzę sobie',
                  sub: 'Rozumiem proste teksty, dogaduję się w prostych sytuacjach',
                  emoji: '🌿',
                  color: 'rgba(74,158,255,0.15)',
                  border: 'rgba(74,158,255,0.4)',
                },
                {
                  level: 'B1',
                  label: 'Całkiem nieźle',
                  sub: 'Prowadzę rozmowy, rozumiem filmy z napisami',
                  emoji: '🌳',
                  color: 'rgba(240,180,41,0.15)',
                  border: 'rgba(240,180,41,0.4)',
                },
              ] as const).map((l) => (
                <motion.button
                  key={l.level}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleLevelSelect(l.level)}
                  className="glass-card p-4 text-left flex items-center gap-4 transition-all"
                  style={{ '--hover-bg': l.color, '--hover-border': l.border } as React.CSSProperties}
                >
                  <div className="text-3xl">{l.emoji}</div>
                  <div>
                    <div className="font-bold">
                      {l.level} — {l.label}
                    </div>
                    <div className="text-xs text-[#8b949e] mt-0.5">{l.sub}</div>
                  </div>
                  <div className="ml-auto font-mono text-sm text-[#484f58]">{l.level}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="text-8xl mb-6"
            >
              🎒
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-black mb-3"
            >
              Gotowy, <span className="text-gold">{player.name}</span>!
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-[#8b949e] mb-4 max-w-sm"
            >
              Twój samolot do Londynu odlatuje za chwilę. Bez Google Translate — radzisz sobie SAM!
            </motion.p>

            {/* Misja */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="glass-card p-5 mb-8 max-w-sm w-full text-left"
            >
              <div className="text-xs text-[#8b949e] uppercase tracking-wider mb-3 font-semibold">Twoja misja</div>
              <div className="flex items-start gap-3 mb-2">
                <span>✈️</span>
                <span className="text-sm">Przejdź kontrolę paszportową na Heathrow</span>
              </div>
              <div className="flex items-start gap-3 mb-2">
                <span>🏨</span>
                <span className="text-sm">Zamelduj się w hotelu w Paddington</span>
              </div>
              <div className="flex items-start gap-3">
                <span>👋</span>
                <span className="text-sm">Poznaj Emily — Twoją londyńską przewodniczkę</span>
              </div>
            </motion.div>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleStart}
              className="btn-primary text-lg px-10 py-4 font-bold"
            >
              ✈️ Lecimy do Londynu!
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
