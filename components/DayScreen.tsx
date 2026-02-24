'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { DESTINATIONS, LONDON_DAYS_OVERVIEW } from '@/lib/gameData';
import GameHUD from './GameHUD';
import type { DestinationConfig } from '@/lib/types';

interface DayScreenProps {
  destination: string;
}

export default function DayScreen({ destination }: DayScreenProps) {
  const router = useRouter();
  const { scenarioResults, player } = useGameStore();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const dest = DESTINATIONS.find((d) => d.id === destination);
  useEffect(() => {
    if (!dest) router.push('/map');
  }, [dest, router]);
  if (!dest) return null;

  const daysOverview = destination === 'london' ? LONDON_DAYS_OVERVIEW : [];

  // Sprawdź wyniki scenariuszy
  const getScenarioStars = (scenarioId: string) => {
    const result = scenarioResults.find((r) => r.scenarioId === scenarioId);
    return result?.stars ?? 0;
  };

  const getDayScenarios = (dayNum: number) => {
    const day = dest.days?.find((d) => d.dayNumber === dayNum);
    return day?.scenarios ?? [];
  };

  const currentDayData = selectedDay !== null ? dest.days?.find((d) => d.dayNumber === selectedDay) : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d1117' }}>
      <GameHUD
        showBack
        onBack={() => (selectedDay !== null ? setSelectedDay(null) : router.push('/map'))}
        title={selectedDay !== null ? `Dzień ${selectedDay} — ${dest.city}` : dest.city}
      />

      {/* Nagłówek destynacji */}
      {selectedDay === null && (
        <div
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #1a1f2e 0%, #0d1117 100%)',
            borderBottom: '1px solid rgba(48,54,61,0.5)',
          }}
        >
          {/* BG decoration */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, #e63946 0%, transparent 60%)',
            }}
          />
          <div className="relative px-6 py-8 flex items-center gap-5">
            <div className="text-7xl animate-float">{dest.flag}</div>
            <div>
              <h1 className="text-3xl font-black mb-1">{dest.city}</h1>
              <p className="text-[#8b949e] text-sm mb-2">{dest.country} · {dest.language}</p>
              <p className="text-[#8b949e] text-sm max-w-md">{dest.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista dni */}
      {selectedDay === null ? (
        <div className="flex-1 px-4 py-6">
          <h2 className="text-sm font-semibold text-[#8b949e] uppercase tracking-wider mb-4 px-2">
            7 dni w Londynie
          </h2>

          <div className="space-y-3">
            {daysOverview.map((day, index) => {
              const dayScenarios = getDayScenarios(day.day);
              const completedScenarios = dayScenarios.filter(
                (s) => getScenarioStars(s.id) > 0
              ).length;
              const totalScenarios = dayScenarios.length;
              const totalStars = dayScenarios.reduce((acc, s) => acc + getScenarioStars(s.id), 0);
              const maxStars = totalScenarios * 3;
              const isCompleted = completedScenarios === totalScenarios && totalScenarios > 0;
              // Dzień 1 zawsze dostępny; kolejne — jeśli poprzedni ukończony
              const prevDayScenarios = day.day > 1 ? getDayScenarios(day.day - 1) : [];
              const prevDayCompleted =
                prevDayScenarios.length > 0 &&
                prevDayScenarios.every((s) => getScenarioStars(s.id) > 0);
              const isAvailable = day.day === 1 || day.isAvailable || prevDayCompleted;

              return (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  onClick={() => isAvailable && setSelectedDay(day.day)}
                  className={`scenario-card ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Day indicator */}
                    <div
                      className="w-14 h-14 rounded-xl flex flex-col items-center justify-center text-2xl flex-shrink-0 border"
                      style={{
                        background: isCompleted
                          ? 'rgba(62,207,142,0.15)'
                          : isAvailable
                          ? 'rgba(240,180,41,0.1)'
                          : 'rgba(22,27,34,0.5)',
                        borderColor: isCompleted
                          ? 'rgba(62,207,142,0.4)'
                          : isAvailable
                          ? 'rgba(240,180,41,0.3)'
                          : 'rgba(48,54,61,0.4)',
                      }}
                    >
                      <span>{isAvailable ? day.emoji : '🔒'}</span>
                      <span
                        className="text-xs font-bold mt-0.5"
                        style={{ color: isAvailable ? '#f0b429' : '#484f58' }}
                      >
                        Dz.{day.day}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-base leading-tight">
                            {day.title}
                          </h3>
                          <p className="text-xs text-[#8b949e] mt-0.5 italic">&ldquo;{day.titleEN}&rdquo;</p>
                        </div>
                        {isAvailable && (
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            {[1, 2, 3].map((s) => (
                              <span
                                key={s}
                                className="text-base"
                                style={{
                                  filter:
                                    totalStars >= s * Math.max(1, Math.floor(maxStars / 3))
                                      ? 'drop-shadow(0 0 4px rgba(240,180,41,0.8))'
                                      : 'none',
                                  opacity: totalStars >= s * Math.max(1, Math.floor(maxStars / 3)) ? 1 : 0.2,
                                }}
                              >
                                ⭐
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-[#484f58] mt-1">{day.subtitle}</p>
                      {isAvailable && totalScenarios > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 xp-bar">
                            <div
                              className="xp-bar-fill"
                              style={{
                                width: `${(completedScenarios / totalScenarios) * 100}%`,
                                background: isCompleted
                                  ? 'linear-gradient(90deg, #3ecf8e, #3ecf8e)'
                                  : undefined,
                              }}
                            />
                          </div>
                          <span className="text-xs text-[#8b949e]">
                            {completedScenarios}/{totalScenarios}
                          </span>
                        </div>
                      )}
                    </div>

                    {isAvailable && (
                      <div className="text-[#484f58] text-xl">›</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Widok wybranego dnia */
        currentDayData ? (
          <DayDetailView
            day={currentDayData}
            onScenarioSelect={(id) => router.push(`/scenario/${id}`)}
            getScenarioStars={getScenarioStars}
            playerName={player.name}
          />
        ) : (
          <ComingSoonDay dayNum={selectedDay} />
        )
      )}
    </div>
  );
}

// ---- Widok szczegółowy dnia ----
interface DayDetailViewProps {
  day: NonNullable<DestinationConfig['days']>[number];
  onScenarioSelect: (id: string) => void;
  getScenarioStars: (id: string) => number;
  playerName: string;
}

function DayDetailView({ day, onScenarioSelect, getScenarioStars, playerName }: DayDetailViewProps) {
  return (
    <div className="flex-1 overflow-auto">
      {/* Hero banner dnia */}
      <div
        className="relative px-6 py-8 border-b overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #1a1f2e 0%, #0d1117 100%)',
          borderColor: 'rgba(48,54,61,0.5)',
        }}
      >
        <div
          className="absolute inset-0 opacity-8"
          style={{
            backgroundImage: 'radial-gradient(circle at 80% 50%, #4a9eff 0%, transparent 60%)',
          }}
        />
        <div className="relative">
          <div className="text-5xl mb-3">{
            LONDON_DAYS_OVERVIEW.find((d) => d.day === day.dayNumber)?.emoji ?? '📍'
          }</div>
          <h2 className="text-2xl font-black mb-1">
            Dzień {day.dayNumber}: {day.title}
          </h2>
          <p className="text-sm text-[#8b949e] italic mb-3">&ldquo;{day.titleEN}&rdquo;</p>
          <p className="text-sm text-[#8b949e] max-w-lg leading-relaxed">{day.storyDescription}</p>
        </div>
      </div>

      {/* Scenariusze */}
      <div className="px-4 py-6">
        <h3 className="text-sm font-semibold text-[#8b949e] uppercase tracking-wider mb-4">
          Scenariusze dnia
        </h3>

        <div className="space-y-3">
          {day.scenarios.map((scenario, index) => {
            const stars = getScenarioStars(scenario.id);
            const isCompleted = stars > 0;
            const isLocked = index > 0 && getScenarioStars(day.scenarios[index - 1].id) === 0;

            return (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => !isLocked && onScenarioSelect(scenario.id)}
                className={`scenario-card ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Order badge */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 border"
                    style={{
                      background: isCompleted
                        ? 'rgba(62,207,142,0.15)'
                        : 'rgba(240,180,41,0.1)',
                      borderColor: isCompleted
                        ? 'rgba(62,207,142,0.4)'
                        : 'rgba(240,180,41,0.3)',
                      color: isCompleted ? '#3ecf8e' : '#f0b429',
                    }}
                  >
                    {isLocked ? '🔒' : isCompleted ? '✓' : index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h4 className="font-bold">{scenario.title}</h4>
                        <p className="text-xs text-[#8b949e] italic">{scenario.titleEN}</p>
                      </div>
                      {/* Stars */}
                      <div className="flex gap-0.5 flex-shrink-0">
                        {[1, 2, 3].map((s) => (
                          <span
                            key={s}
                            className="text-sm"
                            style={{
                              opacity: stars >= s ? 1 : 0.2,
                              filter: stars >= s ? 'drop-shadow(0 0 4px rgba(240,180,41,0.8))' : 'none',
                            }}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-[#8b949e] mb-2 leading-relaxed">{scenario.description}</p>

                    <div className="flex items-center gap-3 text-xs text-[#484f58]">
                      <span>📍 {scenario.location}</span>
                      <span>⏱ {scenario.duration}</span>
                      {scenario.npcName && <span>👤 {scenario.npcName}</span>}
                    </div>

                    {/* Vocab tags */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {scenario.vocabularyFocus.slice(0, 4).map((word) => (
                        <span
                          key={word}
                          className="px-2 py-0.5 rounded-md text-[10px]"
                          style={{
                            background: 'rgba(74,158,255,0.08)',
                            border: '1px solid rgba(74,158,255,0.2)',
                            color: '#4a9eff',
                          }}
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>

                  {!isLocked && (
                    <div className="text-[#484f58] text-xl mt-1">›</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bonus challenge */}
        {day.bonusChallenge && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-[#8b949e] uppercase tracking-wider mb-3">
              Bonus
            </h3>
            <div
              className="glass-card p-4 border"
              style={{ borderColor: 'rgba(240,180,41,0.2)' }}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🎯</div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-gold">{day.bonusChallenge.title}</div>
                  <div className="text-xs text-[#8b949e] mt-0.5">{day.bonusChallenge.description}</div>
                </div>
                <div className="text-xs font-bold text-gold">+{day.bonusChallenge.xpReward} XP</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ComingSoonDay({ dayNum }: { dayNum: number }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-4">🚧</div>
      <h3 className="text-xl font-bold mb-2">Dzień {dayNum} — wkrótce!</h3>
      <p className="text-[#8b949e]">Ten dzień jest jeszcze w produkcji. Sprawdź za kilka dni!</p>
    </div>
  );
}
