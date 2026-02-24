'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { BADGES } from '@/lib/gameData';
import GameHUD from './GameHUD';

export default function FeedbackScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { player, vocabulary, activeScenario, resetActiveScenario } = useGameStore();

  const scenarioId = params.get('scenario') ?? '';
  const starsParam = parseInt(params.get('stars') ?? '1') as 1 | 2 | 3;
  const xpGained = parseInt(params.get('xp') ?? '0');

  const [starsShown, setStarsShown] = useState(0);
  const [showBadge, setShowBadge] = useState(false);

  // Animacja gwiazdek
  useEffect(() => {
    const timers = [
      setTimeout(() => setStarsShown(1), 300),
      setTimeout(() => setStarsShown(2), 600),
      setTimeout(() => setStarsShown(3), 900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Check for new badges
  const newBadges = BADGES.filter((b) => player.badges.includes(b.id)).slice(-3);
  useEffect(() => {
    if (newBadges.length > 0) {
      setTimeout(() => setShowBadge(true), 1200);
    }
  }, [newBadges.length]);

  // Recent vocab (last 5 items)
  const recentVocab = vocabulary.slice(-5);

  const handleContinue = () => {
    resetActiveScenario();
    const dest = scenarioId.split('_')[0]; // np. "ldn"
    const destMap: Record<string, string> = { ldn: 'london', brl: 'berlin', mdr: 'madrid', prs: 'paris' };
    router.push(`/day/${destMap[dest] ?? 'london'}`);
  };

  const starConfigs = [1, 2, 3];
  const performanceText =
    starsParam === 3
      ? 'Perfekcyjnie! 🏆'
      : starsParam === 2
      ? 'Bardzo dobrze! 👍'
      : 'Dobry start! 💪';
  const performanceSubtext =
    starsParam === 3
      ? 'Opanowałeś ten scenariusz na maksa!'
      : starsParam === 2
      ? 'Prawie idealnie! Jeden więcej trening i będzie 3 gwiazdki.'
      : 'Spróbuj ponownie, żeby zdobyć więcej gwiazdek.';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d1117' }}>
      <GameHUD title="Wyniki" />

      <div className="flex-1 overflow-auto px-4 py-8 max-w-lg w-full mx-auto">

        {/* Stars */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="text-5xl font-black mb-2"
            style={{ color: starsParam === 3 ? '#f0b429' : starsParam === 2 ? '#4a9eff' : '#8b949e' }}
          >
            {performanceText}
          </motion.div>
          <p className="text-[#8b949e] text-sm">{performanceSubtext}</p>

          {/* Star animation */}
          <div className="flex items-center justify-center gap-4 my-6">
            {starConfigs.map((s) => (
              <motion.div
                key={s}
                initial={{ scale: 0, rotate: -30, opacity: 0 }}
                animate={
                  starsShown >= s
                    ? { scale: 1, rotate: 0, opacity: 1 }
                    : { scale: 0, rotate: -30, opacity: 0 }
                }
                transition={{ type: 'spring', duration: 0.5, delay: (s - 1) * 0.2 }}
                className="text-6xl"
                style={{
                  filter: starsParam >= s ? 'drop-shadow(0 0 12px rgba(240,180,41,0.8))' : 'grayscale(1)',
                  opacity: starsParam >= s ? 1 : 0.2,
                }}
              >
                ⭐
              </motion.div>
            ))}
          </div>

          {/* XP earned */}
          {xpGained > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold"
              style={{
                background: 'rgba(240,180,41,0.15)',
                border: '1px solid rgba(240,180,41,0.3)',
                color: '#f0b429',
              }}
            >
              <span>⚡</span>
              <span>+{xpGained} XP zdobyte!</span>
            </motion.div>
          )}
        </div>

        {/* New badge notification */}
        {showBadge && newBadges.length > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-5 mb-6 text-center"
            style={{ borderColor: 'rgba(240,180,41,0.4)' }}
          >
            <div className="text-xs font-semibold text-gold uppercase tracking-widest mb-3">
              🎉 Nowa odznaka!
            </div>
            {newBadges.slice(-1).map((badge) => (
              <div key={badge.id} className="flex flex-col items-center gap-2">
                <div className="text-4xl">{badge.icon}</div>
                <div className="font-bold">{badge.name}</div>
                <div className="text-xs text-[#8b949e]">{badge.description}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Gwiazdki', value: `${starsParam}/3`, icon: '⭐' },
            { label: 'XP zdobyte', value: `+${xpGained}`, icon: '⚡' },
            { label: 'Poziom', value: player.level.toString(), icon: '🏆' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-4 text-center"
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="font-black text-xl text-gold">{stat.value}</div>
              <div className="text-xs text-[#8b949e]">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Vocabulary learned */}
        {recentVocab.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card p-5 mb-6"
          >
            <h3 className="text-sm font-semibold text-[#8b949e] uppercase tracking-wider mb-4">
              📚 Nowe słownictwo
            </h3>
            <div className="space-y-2">
              {recentVocab.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(48,54,61,0.4)' }}>
                  <div>
                    <span className="font-semibold text-sapphire">{item.word}</span>
                    <span className="text-[#484f58] text-xs ml-2">{item.partOfSpeech}</span>
                  </div>
                  <span className="text-[#8b949e] text-sm">{item.translation}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Errors */}
        {activeScenario?.errors && activeScenario.errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="glass-card p-5 mb-6"
            style={{ borderColor: 'rgba(255,107,107,0.2)' }}
          >
            <h3 className="text-sm font-semibold text-[#8b949e] uppercase tracking-wider mb-4">
              🔍 Co poprawić?
            </h3>
            <div className="space-y-3">
              {activeScenario.errors.slice(0, 3).map((err, i) => (
                <div key={i} className="text-sm">
                  <div className="text-[#ff6b6b] line-through text-xs mb-0.5">{err.playerAnswer}</div>
                  <div className="text-emerald font-medium">→ {err.correctAnswer}</div>
                  {err.explanation && (
                    <div className="text-[#8b949e] text-xs mt-0.5">{err.explanation}</div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="flex flex-col gap-3"
        >
          <button onClick={handleContinue} className="btn-primary w-full py-4 text-base font-bold">
            Następna scena →
          </button>
          <button
            onClick={() => {
              resetActiveScenario();
              router.push(`/scenario/${scenarioId}`);
            }}
            className="btn-secondary w-full py-3 text-sm"
          >
            Spróbuj ponownie (powtórka) 🔄
          </button>
        </motion.div>

        {/* Streak reminder */}
        {player.streak > 0 && (
          <div className="text-center mt-6">
            <div className="inline-flex items-center gap-2 text-sm text-[#8b949e]">
              <span>🔥</span>
              <span>
                Twoja seria: <strong className="text-gold">{player.streak} dni</strong> — wróć jutro, żeby nie stracić!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
