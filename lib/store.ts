'use client';
// ============================================================
// LINGUATRIP — Zustand Store (stan gry)
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, VocabularyItem, DestinationProgress, ScenarioResult, ActiveScenarioState, DifficultyLevel } from './types';

interface GameStore {
  // ---------- Gracz ----------
  player: Player;
  isOnboarded: boolean;
  userId: string | null;  // Supabase user ID — guard przed mieszaniem kont

  // ---------- Postęp ----------
  destinationProgress: DestinationProgress[];
  scenarioResults: ScenarioResult[];

  // ---------- Aktywna rozgrywka ----------
  activeScenario: ActiveScenarioState | null;

  // ---------- Słowniczek ----------
  vocabulary: VocabularyItem[];

  // ---------- Akcje gracza ----------
  setPlayerName: (name: string) => void;
  setAvatar: (avatar: 'kasia' | 'tomek') => void;
  setDifficulty: (level: DifficultyLevel) => void;
  completeOnboarding: () => void;
  addXP: (amount: number) => void;
  spendPounds: (amount: number) => boolean;
  earnPounds: (amount: number) => void;
  addBadge: (badgeId: string) => void;
  updateStreak: () => void;

  // ---------- Akcje gry ----------
  startScenario: (scenarioId: string) => void;
  submitAnswer: (interactionId: string, answer: string, isCorrect: boolean, xpReward: number) => void;
  advanceIndex: () => void;  // osobna akcja — przesuwa indeks do następnej interakcji
  useHint: () => boolean;
  completeScenario: (stars: 1 | 2 | 3, errors: ScenarioResult['errors']) => void;
  resetActiveScenario: () => void;

  // ---------- Słowniczek ----------
  addVocabularyItem: (item: VocabularyItem) => void;
  markReviewed: (wordId: string) => void;

  // ---------- Reset ----------
  resetAll: () => void;
  setUserId: (id: string) => void;
}

const DEFAULT_PLAYER: Player = {
  name: '',
  avatar: 'tomek',
  xp: 0,
  level: 1,
  pounds: 100, // startowe funty
  streak: 0,
  lastPlayedDate: null,
  badges: [],
  difficultyLevel: 'A2',
};

// Przelicznik XP → Level
function calculateLevel(xp: number): number {
  if (xp < 100) return 1;
  if (xp < 300) return 2;
  if (xp < 600) return 3;
  if (xp < 1000) return 4;
  if (xp < 1500) return 5;
  if (xp < 2200) return 6;
  if (xp < 3000) return 7;
  return Math.floor(xp / 500) + 1;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      player: DEFAULT_PLAYER,
      isOnboarded: false,
      userId: null,
      destinationProgress: [],
      scenarioResults: [],
      activeScenario: null,
      vocabulary: [],

      setPlayerName: (name) =>
        set((state) => ({ player: { ...state.player, name } })),

      setAvatar: (avatar) =>
        set((state) => ({ player: { ...state.player, avatar } })),

      setDifficulty: (level) =>
        set((state) => ({ player: { ...state.player, difficultyLevel: level } })),

      completeOnboarding: () => set({ isOnboarded: true }),

      addXP: (amount) =>
        set((state) => {
          const newXP = state.player.xp + amount;
          return {
            player: {
              ...state.player,
              xp: newXP,
              level: calculateLevel(newXP),
            },
          };
        }),

      spendPounds: (amount) => {
        const { player } = get();
        if (player.pounds < amount) return false;
        set((state) => ({
          player: { ...state.player, pounds: state.player.pounds - amount },
        }));
        return true;
      },

      earnPounds: (amount) =>
        set((state) => ({
          player: { ...state.player, pounds: state.player.pounds + amount },
        })),

      addBadge: (badgeId) =>
        set((state) => ({
          player: {
            ...state.player,
            badges: state.player.badges.includes(badgeId)
              ? state.player.badges
              : [...state.player.badges, badgeId],
          },
        })),

      updateStreak: () => {
        const today = new Date().toDateString();
        const { player } = get();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        let newStreak = player.streak;
        if (player.lastPlayedDate === yesterday) {
          newStreak += 1;
        } else if (player.lastPlayedDate !== today) {
          newStreak = 1;
        }

        set((state) => ({
          player: {
            ...state.player,
            streak: newStreak,
            lastPlayedDate: today,
          },
        }));
      },

      startScenario: (scenarioId) =>
        set({
          activeScenario: {
            scenarioId,
            currentInteractionIndex: 0,
            answers: {},
            correctCount: 0,
            totalCount: 0,
            errors: [],
            startedAt: new Date().toISOString(),
            hintsUsed: 0,
          },
        }),

      // Rejestruje odpowiedź i XP — NIE przesuwa indeksu
      submitAnswer: (interactionId, answer, isCorrect, xpReward) =>
        set((state) => {
          if (!state.activeScenario) return state;
          const newXP = isCorrect ? state.player.xp + xpReward : state.player.xp;
          const poundsEarned = isCorrect ? Math.floor(xpReward / 5) : 0;
          return {
            activeScenario: {
              ...state.activeScenario,
              // indeks NIE jest inkrementowany tutaj
              answers: { ...state.activeScenario.answers, [interactionId]: answer },
              correctCount: isCorrect
                ? state.activeScenario.correctCount + 1
                : state.activeScenario.correctCount,
              totalCount: state.activeScenario.totalCount + 1,
            },
            player: {
              ...state.player,
              xp: newXP,
              level: calculateLevel(newXP),
              pounds: state.player.pounds + poundsEarned,
            },
          };
        }),

      // Przesuwa do następnej interakcji — wywoływane dopiero gdy gracz kliknie "Dalej"
      advanceIndex: () =>
        set((state) => {
          if (!state.activeScenario) return state;
          return {
            activeScenario: {
              ...state.activeScenario,
              currentInteractionIndex: state.activeScenario.currentInteractionIndex + 1,
            },
          };
        }),

      useHint: () => {
        const { player, activeScenario } = get();
        if (!activeScenario || player.pounds < 5) return false;
        set((state) => ({
          player: { ...state.player, pounds: state.player.pounds - 5 },
          activeScenario: state.activeScenario
            ? { ...state.activeScenario, hintsUsed: state.activeScenario.hintsUsed + 1 }
            : null,
        }));
        return true;
      },

      completeScenario: (stars, errors) => {
        const { activeScenario, player } = get();
        if (!activeScenario) return;

        const result: ScenarioResult = {
          scenarioId: activeScenario.scenarioId,
          stars,
          completedAt: new Date().toISOString(),
          correctAnswers: activeScenario.correctCount,
          totalAnswers: activeScenario.totalCount,
          errors,
        };

        // Nagroda za gwiazdki
        const bonusXP = stars === 3 ? 50 : stars === 2 ? 25 : 0;
        const bonusPounds = stars === 3 ? 20 : stars === 2 ? 10 : 5;

        set((state) => ({
          scenarioResults: [
            ...state.scenarioResults.filter((r) => r.scenarioId !== activeScenario.scenarioId),
            result,
          ],
          player: {
            ...state.player,
            xp: state.player.xp + bonusXP,
            level: calculateLevel(player.xp + bonusXP),
            pounds: state.player.pounds + bonusPounds,
            badges:
              state.player.badges.includes('first_words')
                ? state.player.badges
                : [...state.player.badges, 'first_words'],
          },
        }));
      },

      resetActiveScenario: () => set({ activeScenario: null }),

      resetAll: () =>
        set({
          player: DEFAULT_PLAYER,
          isOnboarded: false,
          userId: null,
          destinationProgress: [],
          scenarioResults: [],
          activeScenario: null,
          vocabulary: [],
        }),

      setUserId: (id) => set({ userId: id }),

      addVocabularyItem: (item) =>
        set((state) => ({
          vocabulary: state.vocabulary.some((v) => v.id === item.id)
            ? state.vocabulary
            : [...state.vocabulary, item],
        })),

      markReviewed: (wordId) =>
        set((state) => ({
          vocabulary: state.vocabulary.map((v) =>
            v.id === wordId
              ? {
                  ...v,
                  lastReviewedAt: new Date().toISOString(),
                  reviewCount: v.reviewCount + 1,
                  nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * (v.reviewCount + 1)).toISOString(),
                }
              : v
          ),
        })),
    }),
    {
      name: 'linguatrip-game-state',
    }
  )
);
