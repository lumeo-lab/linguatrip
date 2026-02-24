'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { BADGES, DESTINATIONS } from '@/lib/gameData';
import GameHUD from './GameHUD';
import { supabase } from '@/lib/supabase';

// Progi XP dla kolejnych poziomów
const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000];

function getXPProgress(xp: number, level: number) {
  const current = XP_THRESHOLDS[level - 1] ?? 0;
  const next = XP_THRESHOLDS[level] ?? (level * 500 + 1000);
  return { current, next, progress: Math.min(((xp - current) / (next - current)) * 100, 100) };
}

// Szukaj scenariusza po ID we wszystkich destynacjach
function findScenario(scenarioId: string) {
  for (const dest of DESTINATIONS) {
    for (const day of dest.days ?? []) {
      const s = day.scenarios.find((sc) => sc.id === scenarioId);
      if (s) return { scenario: s, dest, day };
    }
  }
  return null;
}

function StatCard({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl p-4 gap-1"
      style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid rgba(48,54,61,0.5)' }}
    >
      <div className="text-2xl">{icon}</div>
      <div className="text-xl font-black" style={{ color: '#f0f6fc' }}>{value}</div>
      <div className="text-[11px] text-center leading-tight" style={{ color: '#8b949e' }}>{label}</div>
    </div>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { player, scenarioResults, vocabulary } = useGameStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    // Nie czyścimy danych gry — zostaną w localStorage
    // checkUser() w app/page.tsx przywróci je przy ponownym logowaniu tego samego użytkownika
    // lub wyczyści jeśli zaloguje się ktoś inny
    router.push('/');
  };

  const { next, progress } = getXPProgress(player.xp, player.level);

  const totalCorrect = scenarioResults.reduce((acc, r) => acc + r.correctAnswers, 0);
  const totalAnswers = scenarioResults.reduce((acc, r) => acc + r.totalAnswers, 0);
  const accuracy = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;
  const totalStars = scenarioResults.reduce((acc, r) => acc + r.stars, 0);

  const difficultyColor: Record<string, string> = {
    A1: '#3ecf8e', A2: '#4a9eff', B1: '#f0b429',
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d1117' }}>
      <GameHUD showBack onBack={() => router.push('/map')} title="Profil" />

      <div className="flex-1 overflow-auto pb-10">

        {/* ── Hero ── */}
        <div
          className="relative px-6 pt-8 pb-10 text-center overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #0f1d2e 0%, #0d1117 100%)',
            borderBottom: '1px solid rgba(48,54,61,0.5)',
          }}
        >
          {/* BG glow */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 50% 60%, #4a9eff 0%, transparent 65%)' }}
          />

          {/* Avatar */}
          <div className="relative inline-flex mb-4">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
              style={{
                background: 'rgba(74,158,255,0.12)',
                border: '2px solid rgba(74,158,255,0.4)',
                boxShadow: '0 0 24px rgba(74,158,255,0.2)',
              }}
            >
              {player.avatar === 'tomek' ? '🧑' : '👩'}
            </div>
            {/* Level badge */}
            <div
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2"
              style={{
                background: '#f0b429',
                borderColor: '#0d1117',
                color: '#0d1117',
              }}
            >
              {player.level}
            </div>
          </div>

          <h1 className="text-2xl font-black mb-1">{player.name}</h1>

          <div className="flex items-center justify-center gap-2 mb-4">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: `${difficultyColor[player.difficultyLevel]}20`,
                color: difficultyColor[player.difficultyLevel],
                border: `1px solid ${difficultyColor[player.difficultyLevel]}40`,
              }}
            >
              {player.difficultyLevel}
            </span>
            <span className="text-xs" style={{ color: '#8b949e' }}>
              Poziom {player.level}
            </span>
          </div>

          {/* XP bar */}
          <div className="max-w-xs mx-auto">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: '#8b949e' }}>
              <span>{player.xp} XP</span>
              <span>Następny poziom: {next} XP</span>
            </div>
            <div className="xp-bar">
              <div className="xp-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">

          {/* ── Statystyki ── */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: '#8b949e' }}>
              Statystyki
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <StatCard icon="⭐" value={totalStars} label="Gwiazdek łącznie" />
              <StatCard icon="✅" value={scenarioResults.length} label="Ukończonych scenariuszy" />
              <StatCard icon="🎯" value={`${accuracy}%`} label="Celność odpowiedzi" />
              <StatCard icon="💷" value={`£${player.pounds}`} label="Funty" />
              <StatCard icon="🔥" value={player.streak} label={player.streak === 1 ? 'dzień z rzędu' : 'dni z rzędu'} />
              <StatCard icon="📚" value={vocabulary.length} label="Słówek w słowniczku" />
            </div>
          </section>

          {/* ── Odznaki ── */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: '#8b949e' }}>
              Odznaki ({player.badges.length}/{BADGES.length})
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {BADGES.map((badge) => {
                const earned = player.badges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className="flex items-center gap-3 rounded-2xl p-3"
                    style={{
                      background: earned ? 'rgba(240,180,41,0.07)' : 'rgba(22,27,34,0.5)',
                      border: `1px solid ${earned ? 'rgba(240,180,41,0.3)' : 'rgba(48,54,61,0.4)'}`,
                      opacity: earned ? 1 : 0.45,
                    }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{
                        background: earned ? 'rgba(240,180,41,0.15)' : 'rgba(22,27,34,0.8)',
                        filter: earned ? 'drop-shadow(0 0 6px rgba(240,180,41,0.5))' : 'grayscale(1)',
                      }}
                    >
                      {badge.icon}
                    </div>
                    <div className="min-w-0">
                      <div
                        className="font-bold text-sm truncate"
                        style={{ color: earned ? '#f0b429' : '#484f58' }}
                      >
                        {badge.name}
                      </div>
                      <div className="text-[11px] leading-snug mt-0.5" style={{ color: '#8b949e' }}>
                        {badge.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Historia scenariuszy ── */}
          {scenarioResults.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: '#8b949e' }}>
                Historia
              </h2>
              <div className="space-y-2">
                {[...scenarioResults]
                  .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                  .map((result) => {
                    const found = findScenario(result.scenarioId);
                    const title = found?.scenario.title ?? result.scenarioId;
                    const dest = found?.dest;
                    const day = found?.day;
                    const acc =
                      result.totalAnswers > 0
                        ? Math.round((result.correctAnswers / result.totalAnswers) * 100)
                        : 0;
                    const date = new Date(result.completedAt).toLocaleDateString('pl-PL', {
                      day: 'numeric', month: 'short',
                    });

                    return (
                      <div
                        key={result.scenarioId}
                        className="flex items-center gap-3 rounded-2xl px-4 py-3"
                        style={{
                          background: 'rgba(22,27,34,0.7)',
                          border: '1px solid rgba(48,54,61,0.4)',
                        }}
                      >
                        {/* Stars */}
                        <div className="flex gap-0.5 flex-shrink-0">
                          {[1, 2, 3].map((s) => (
                            <span
                              key={s}
                              className="text-sm"
                              style={{
                                opacity: result.stars >= s ? 1 : 0.2,
                                filter: result.stars >= s ? 'drop-shadow(0 0 3px rgba(240,180,41,0.8))' : 'none',
                              }}
                            >
                              ⭐
                            </span>
                          ))}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{title}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: '#8b949e' }}>
                            {dest ? `${dest.flag} ${dest.city}` : ''}{day ? ` · Dz.${day.dayNumber}` : ''}
                          </div>
                        </div>

                        {/* Right side */}
                        <div className="text-right flex-shrink-0">
                          <div
                            className="text-sm font-bold"
                            style={{ color: acc >= 80 ? '#3ecf8e' : acc >= 50 ? '#f0b429' : '#ff6b6b' }}
                          >
                            {acc}%
                          </div>
                          <div className="text-[11px]" style={{ color: '#484f58' }}>{date}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {scenarioResults.length === 0 && (
            <div className="text-center py-10" style={{ color: '#484f58' }}>
              <div className="text-4xl mb-3">✈️</div>
              <p className="text-sm">Nie ukończyłeś jeszcze żadnego scenariusza.</p>
              <p className="text-sm">Wróć na mapę i wybierz destynację!</p>
            </div>
          )}

          {/* ── Wyloguj ── */}
          <div className="pt-4 pb-2">
            <div
              className="rounded-2xl p-4"
              style={{ border: '1px solid rgba(48,54,61,0.4)', background: 'rgba(22,27,34,0.5)' }}
            >
              <div className="text-xs mb-3 px-1" style={{ color: '#484f58' }}>
                Zalogowany przez Supabase Auth
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: loggingOut ? 'rgba(255,107,107,0.05)' : 'rgba(255,107,107,0.08)',
                  border: '1px solid rgba(255,107,107,0.25)',
                  color: loggingOut ? '#484f58' : '#ff6b6b',
                  cursor: loggingOut ? 'not-allowed' : 'pointer',
                }}
              >
                {loggingOut ? '⏳ Wylogowywanie…' : '→ Wyloguj się'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
