// ============================================================
// LINGUATRIP — Typy TypeScript
// ============================================================

export type Avatar = 'kasia' | 'tomek';
export type Destination = 'london' | 'berlin' | 'madrid' | 'paris';
export type DifficultyLevel = 'A1' | 'A2' | 'B1';

// ---------- Gracz ----------
export interface Player {
  name: string;
  avatar: Avatar;
  xp: number;
  level: number;
  pounds: number; // waluta gry
  streak: number;
  lastPlayedDate: string | null;
  badges: string[];
  difficultyLevel: DifficultyLevel;
}

// ---------- Słowniczek ----------
export interface VocabularyItem {
  id: string;
  word: string;         // EN
  translation: string;  // PL
  pronunciation: string;
  partOfSpeech: string;
  exampleSentence: string;
  exampleTranslation: string;
  addedAt: string;
  lastReviewedAt: string | null;
  reviewCount: number;
  nextReviewAt: string | null;
  scenarioId: string;
}

// ---------- Postęp ----------
export interface DestinationProgress {
  destination: Destination;
  completedDays: number[];
  currentDay: number;
  totalStars: number;
}

export interface ScenarioResult {
  scenarioId: string;
  stars: number;          // 1-3
  completedAt: string;
  correctAnswers: number;
  totalAnswers: number;
  errors: ErrorRecord[];
}

export interface ErrorRecord {
  questionText: string;
  playerAnswer: string;
  correctAnswer: string;
  explanation: string;
}

// ---------- Typy interakcji ----------
export type InteractionType =
  | 'choice'        // Dialog z wyborem
  | 'fill_blank'    // Uzupełnianie luki
  | 'sentence_build'// Budowanie zdania
  | 'listening'     // Słuchanie (bez tekstu)
  | 'free_answer'   // Wolna odpowiedź (AI)
  | 'minigame'      // Minigra
  | 'cutscene';     // Cutscene narracyjny

// ---------- Odpowiedzi ----------
export interface ChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;      // Wyjaśnienie po polsku
  npcReaction?: string;   // Jak NPC reaguje
}

export interface Interaction {
  id: string;
  type: InteractionType;
  npcDialogue?: string;   // EN — co mówi NPC
  npcDialoguePL?: string; // PL — tłumaczenie
  npcEmotion?: 'neutral' | 'happy' | 'surprised' | 'impatient' | 'confused' | 'friendly';
  audioUrl?: string;

  // Dla 'choice'
  choices?: ChoiceOption[];

  // Dla 'fill_blank'
  sentence?: string;      // Zdanie z {blank} jako placeholderem
  options?: string[];     // Opcje do wyboru
  correctFill?: string;

  // Dla 'sentence_build'
  words?: string[];       // Rozsypanka słów
  correctSentence?: string;
  timeLimit?: number;     // w sekundach

  // Dla 'listening'
  audioText?: string;     // Tekst (ukryty dla gracza)
  listeningChoices?: ChoiceOption[];

  // Dla 'free_answer'
  prompt?: string;        // PL — co gracz ma powiedzieć
  exampleAnswer?: string; // EN — przykładowa odpowiedź
  keyWords?: string[];    // Kluczowe słowa które powinny być w odpowiedzi

  // Dla 'cutscene'
  narration?: string;     // PL — narracja
  image?: string;         // URL ilustracji

  // Dla 'minigame'
  minigameType?: 'pub_quiz' | 'menu_reading' | 'signs';
  minigameData?: unknown;

  // XP za poprawną odpowiedź
  xpReward?: number;
}

// ---------- Scenariusz ----------
export interface Scenario {
  id: string;
  destinationId: Destination;
  dayNumber: number;
  orderInDay: number;
  title: string;           // PL
  titleEN: string;         // EN
  description: string;     // PL — krótki opis
  location: string;        // np. "Heathrow Airport"
  locationImage: string;   // URL ilustracji lokacji
  duration: string;        // np. "~8 min"
  npcName?: string;
  npcImage?: string;
  interactions: Interaction[];
  vocabularyFocus: string[]; // Kluczowe słowa
  grammarFocus?: string;    // Gramatyka
  isOptional?: boolean;
}

// ---------- Dzień ----------
export interface Day {
  destinationId: Destination;
  dayNumber: number;
  title: string;           // PL
  titleEN: string;         // EN
  storyDescription: string;// PL — opis fabuły
  locationImage: string;   // URL ilustracji
  scenarios: Scenario[];
  bonusChallenge?: {
    title: string;
    description: string;
    xpReward: number;
  };
}

// ---------- Destynacja ----------
export interface DestinationConfig {
  id: Destination;
  city: string;
  country: string;
  language: string;
  flag: string;
  description: string;
  mapPosition: { x: number; y: number }; // % pozycja na mapie SVG
  isUnlocked: boolean;
  totalDays: number;
  days?: Day[];
}

// ---------- Stan rozgrywki (aktywny scenariusz) ----------
export interface ActiveScenarioState {
  scenarioId: string;
  currentInteractionIndex: number;
  answers: Record<string, string>;
  correctCount: number;
  totalCount: number;
  errors: ErrorRecord[];
  startedAt: string;
  hintsUsed: number;
}

// ---------- Odznaka ----------
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
}
