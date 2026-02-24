'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { DESTINATIONS } from '@/lib/gameData';
import GameHUD from './GameHUD';
import type { Interaction, Scenario, ErrorRecord } from '@/lib/types';

interface ScenarioScreenProps {
  scenarioId: string;
}

type AnswerState = 'idle' | 'waiting';

// ---- Typy wpisów w historii konwersacji ----
type NpcEntry = {
  kind: 'npc';
  id: string;
  text: string;
  textPL?: string;
  npcName?: string;
  emotion: string;
  isListening?: boolean;
  audioText?: string;
};
type PlayerEntry = {
  kind: 'player';
  id: string;
  text: string;
  isCorrect: boolean;
  xpGained: number;
  feedback: string;
};
type NarratorEntry = {
  kind: 'narrator';
  id: string;
  text: string;
};
type LogEntry = NpcEntry | PlayerEntry | NarratorEntry;

const EMOTION_EMOJI: Record<string, string> = {
  neutral: '😐',
  happy: '😊',
  surprised: '😮',
  impatient: '😤',
  confused: '🤔',
  friendly: '😄',
};

function buildLogEntry(interaction: Interaction, npcName?: string): LogEntry {
  if (interaction.type === 'cutscene') {
    return { kind: 'narrator', id: interaction.id, text: interaction.narration ?? '' };
  }
  return {
    kind: 'npc',
    id: interaction.id,
    text: interaction.npcDialogue ?? '',
    textPL: interaction.npcDialoguePL,
    npcName,
    emotion: interaction.npcEmotion ?? 'neutral',
    isListening: interaction.type === 'listening',
    audioText: interaction.audioText,
  };
}

export default function ScenarioScreen({ scenarioId }: ScenarioScreenProps) {
  const router = useRouter();
  const { startScenario, submitAnswer, advanceIndex, completeScenario, activeScenario, useHint, player } =
    useGameStore();

  const [log, setLog] = useState<LogEntry[]>([]);
  const [localIdx, setLocalIdx] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [sentenceWords, setSentenceWords] = useState<string[]>([]);
  const [builtSentence, setBuiltSentence] = useState<string[]>([]);
  const [freeAnswerText, setFreeAnswerText] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [xpGained, setXpGained] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Znajdź scenariusz
  const scenario: Scenario | null = (() => {
    for (const dest of DESTINATIONS) {
      for (const day of dest.days ?? []) {
        for (const s of day.scenarios) {
          if (s.id === scenarioId) return s;
        }
      }
    }
    return null;
  })();

  // Inicjalizacja — tylko przy zmianie scenarioId
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!scenario) return;
    if (!activeScenario || activeScenario.scenarioId !== scenarioId) {
      startScenario(scenarioId);
    }
    const first = scenario.interactions[0];
    setLog([buildLogEntry(first, scenario.npcName)]);
    setLocalIdx(0);
    setAnswerState('idle');
    setErrors([]);
    setXpGained(0);
    setFreeAnswerText('');
    setBuiltSentence([]);
    if (first.type === 'sentence_build' && first.words) {
      setSentenceWords([...first.words].sort(() => Math.random() - 0.5));
    }
  }, [scenarioId]);

  useEffect(() => {
    if (!scenario) router.push('/map');
  }, [scenario, router]);

  // Auto-scroll do dołu po każdym nowym wpisie lub po odpowiedzi
  useEffect(() => {
    const t = setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    return () => clearTimeout(t);
  }, [log.length, answerState]);

  if (!scenario) return null;

  const currentInteraction: Interaction | null = scenario.interactions[localIdx] ?? null;
  const totalInteractions = scenario.interactions.length;
  const progress = totalInteractions > 0 ? ((localIdx + 1) / totalInteractions) * 100 : 0;
  const isCutscene = currentInteraction?.type === 'cutscene';

  // ---- Advance helper (shared logic) ----
  const advanceToNext = (skipAnswer = false) => {
    if (!skipAnswer) {
      setAnswerState('idle');
      setShowHint(false);
      setFreeAnswerText('');
      setBuiltSentence([]);
    }
    const isLast = localIdx + 1 >= totalInteractions;
    if (isLast) {
      const correct = activeScenario?.correctCount ?? 0;
      const total = Math.max(activeScenario?.totalCount ?? 1, 1);
      const pct = correct / total;
      const stars: 1 | 2 | 3 = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
      completeScenario(stars, errors);
      router.push(`/feedback?scenario=${scenarioId}&stars=${stars}&xp=${xpGained}`);
    } else {
      const nextIdx = localIdx + 1;
      setLocalIdx(nextIdx);
      advanceIndex();
      const next = scenario.interactions[nextIdx];
      setLog((prev) => [...prev, buildLogEntry(next, scenario.npcName)]);
      if (next.type === 'sentence_build' && next.words) {
        setSentenceWords([...next.words].sort(() => Math.random() - 0.5));
      }
    }
  };

  const handleAnswer = (
    answer: string,
    isCorrect: boolean,
    xp: number,
    feedback?: string,
    correctAnswer?: string
  ) => {
    if (answerState !== 'idle') return;
    const earned = isCorrect ? xp : 0;
    setXpGained((prev) => prev + earned);

    if (!isCorrect && currentInteraction) {
      setErrors((prev) => [
        ...prev,
        {
          questionText: currentInteraction.npcDialogue ?? '',
          playerAnswer: answer,
          correctAnswer: correctAnswer ?? '',
          explanation: feedback ?? '',
        },
      ]);
    }

    submitAnswer(currentInteraction?.id ?? '', answer, isCorrect, xp);

    setLog((prev) => [
      ...prev,
      {
        kind: 'player',
        id: (currentInteraction?.id ?? '') + '_player_' + Date.now(),
        text: answer,
        isCorrect,
        xpGained: earned,
        feedback:
          feedback ?? (isCorrect ? 'Doskonale!' : 'Niepoprawnie — spróbuj zapamiętać poprawną odpowiedź.'),
      },
    ]);
    setAnswerState('waiting');
  };

  const handleCutsceneNext = () => {
    submitAnswer(currentInteraction?.id ?? '', 'cutscene_read', true, 0);
    advanceToNext(true);
  };

  const handleContinue = () => advanceToNext(false);

  const handleHintRequest = () => {
    const ok = useHint();
    if (ok) setShowHint(true);
  };

  const handleSentenceWordClick = (word: string, fromBuilt: boolean) => {
    if (fromBuilt) {
      setBuiltSentence((prev) => {
        const idx = prev.lastIndexOf(word);
        return prev.filter((_, i) => i !== idx);
      });
      setSentenceWords((prev) => [...prev, word]);
    } else {
      setBuiltSentence((prev) => [...prev, word]);
      setSentenceWords((prev) => {
        const idx = prev.indexOf(word);
        return prev.filter((_, i) => i !== idx);
      });
    }
  };

  const handleSentenceSubmit = () => {
    if (!currentInteraction?.correctSentence) return;
    const built = builtSentence.join(' ');
    const isCorrect =
      built.toLowerCase().trim() === currentInteraction.correctSentence.toLowerCase().trim();
    handleAnswer(
      built,
      isCorrect,
      currentInteraction.xpReward ?? 30,
      isCorrect
        ? 'Doskonale! Zdanie jest poprawne!'
        : `Poprawna wersja: "${currentInteraction.correctSentence}"`,
      currentInteraction.correctSentence
    );
  };

  const handleFreeAnswerSubmit = () => {
    if (!freeAnswerText.trim()) return;
    const keyWords = currentInteraction?.keyWords ?? [];
    const text = freeAnswerText.toLowerCase();
    const matched = keyWords.filter((kw) => text.includes(kw.toLowerCase()));
    const isGood = matched.length >= Math.ceil(keyWords.length * 0.5);
    handleAnswer(
      freeAnswerText,
      isGood,
      currentInteraction?.xpReward ?? 35,
      isGood
        ? `Świetnie! Użyłeś kluczowych słów: ${matched.join(', ')}`
        : `Przykładowa odpowiedź: "${currentInteraction?.exampleAnswer}"`,
      currentInteraction?.exampleAnswer
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d1117' }}>
      <GameHUD
        showBack
        onBack={() => router.push(`/day/${scenario.destinationId}`)}
        title={scenario.title}
      />

      {/* Pasek postępu */}
      <div className="w-full" style={{ height: '3px', background: 'rgba(48,54,61,0.5)' }}>
        <motion.div
          className="h-full"
          style={{ background: 'linear-gradient(90deg, #f0b429, #ff9f43)' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Pasek licznika + podpowiedź */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: 'rgba(48,54,61,0.4)' }}
      >
        <span className="text-xs text-[#8b949e]">
          {localIdx + 1} / {totalInteractions}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8b949e]">💷 {player.pounds}</span>
          <button
            onClick={handleHintRequest}
            disabled={player.pounds < 5 || showHint || answerState === 'waiting'}
            className="text-xs px-3 py-1 rounded-lg transition-all disabled:opacity-30"
            style={{
              background: 'rgba(240,180,41,0.1)',
              border: '1px solid rgba(240,180,41,0.3)',
              color: '#f0b429',
            }}
          >
            💡 Podpowiedź (5 £)
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════
          KONWERSACJA — przewijalna w dół
          ════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

          {log.map((entry, i) => {
            const isLastEntry = i === log.length - 1;

            if (entry.kind === 'narrator') {
              return (
                <NarratorCard
                  key={entry.id}
                  text={entry.text}
                  showButton={isLastEntry && isCutscene}
                  onContinue={handleCutsceneNext}
                />
              );
            }

            if (entry.kind === 'npc') {
              return <NPCBubble key={entry.id} entry={entry} />;
            }

            if (entry.kind === 'player') {
              const isActive = isLastEntry && answerState === 'waiting';
              return (
                <PlayerBubble
                  key={entry.id}
                  entry={entry}
                  isActive={isActive}
                  playerName={player.name}
                  playerAvatar={player.avatar}
                  onContinue={isActive ? handleContinue : undefined}
                />
              );
            }

            return null;
          })}

          {/* ---- Panel wejściowy (tylko gdy idle i nie cutscene) ---- */}
          <AnimatePresence>
            {answerState === 'idle' && currentInteraction && !isCutscene && (
              <motion.div
                key={`input-${localIdx}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                {/* Etykieta "Twoja kolej" */}
                <div className="flex justify-end items-center gap-2">
                  <div
                    className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded"
                    style={{
                      color: '#f0b429',
                      background: 'rgba(240,180,41,0.08)',
                      border: '1px solid rgba(240,180,41,0.2)',
                    }}
                  >
                    Twoja kolej
                  </div>
                </div>

                {/* Podpowiedź */}
                {showHint && currentInteraction.npcDialoguePL && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="glass-card p-3 border"
                    style={{ borderColor: 'rgba(240,180,41,0.3)' }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">💡</span>
                      <div>
                        <div className="text-xs font-semibold text-gold mb-1">Podpowiedź</div>
                        <div className="text-sm text-[#f0f6fc]">{currentInteraction.npcDialoguePL}</div>
                        {currentInteraction.prompt && (
                          <div className="text-xs text-[#8b949e] mt-1">
                            Zadanie: {currentInteraction.prompt}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Choice */}
                {currentInteraction.type === 'choice' && currentInteraction.choices && (
                  <ChoicePanel
                    choices={currentInteraction.choices}
                    onSelect={(c) =>
                      handleAnswer(c.text, c.isCorrect, currentInteraction.xpReward ?? 20, c.feedback, c.npcReaction)
                    }
                  />
                )}

                {/* Listening */}
                {currentInteraction.type === 'listening' && currentInteraction.listeningChoices && (
                  <ListeningChoicePanel
                    choices={currentInteraction.listeningChoices}
                    onSelect={(c) =>
                      handleAnswer(c.text, c.isCorrect, currentInteraction.xpReward ?? 25, c.feedback)
                    }
                  />
                )}

                {/* Fill blank */}
                {currentInteraction.type === 'fill_blank' && currentInteraction.options && (
                  <FillBlankPanel
                    sentence={currentInteraction.sentence ?? ''}
                    options={currentInteraction.options}
                    correctFill={currentInteraction.correctFill ?? ''}
                    onSelect={(opt) =>
                      handleAnswer(
                        opt,
                        opt === currentInteraction.correctFill,
                        currentInteraction.xpReward ?? 15,
                        opt === currentInteraction.correctFill
                          ? 'Doskonale! To właśnie to słowo!'
                          : `Poprawna odpowiedź: "${currentInteraction.correctFill}"`
                      )
                    }
                  />
                )}

                {/* Sentence build */}
                {currentInteraction.type === 'sentence_build' && (
                  <SentenceBuildPanel
                    prompt={currentInteraction.prompt ?? ''}
                    availableWords={sentenceWords}
                    builtSentence={builtSentence}
                    onWordClick={handleSentenceWordClick}
                    onSubmit={handleSentenceSubmit}
                  />
                )}

                {/* Free answer */}
                {currentInteraction.type === 'free_answer' && (
                  <FreeAnswerPanel
                    prompt={currentInteraction.prompt ?? ''}
                    exampleAnswer={showHint ? currentInteraction.exampleAnswer : undefined}
                    value={freeAnswerText}
                    onChange={setFreeAnswerText}
                    onSubmit={handleFreeAnswerSubmit}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Anchor do auto-scroll */}
          <div ref={bottomRef} className="h-2" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

// ---- Karta narracyjna (cutscene) ----
function NarratorCard({
  text,
  showButton,
  onContinue,
}: {
  text: string;
  showButton: boolean;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-2xl p-6 text-center overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #1a2a3a 0%, #0d1117 100%)',
        border: '1px solid rgba(74,158,255,0.2)',
      }}
    >
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 30%, #4a9eff 0%, transparent 60%)' }}
      />
      <div className="relative">
        <div className="text-xs font-semibold text-sapphire uppercase tracking-widest mb-3">
          📖 Narracja
        </div>
        <p className="text-base text-[#f0f6fc] leading-relaxed">{text}</p>
        {showButton && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={onContinue}
            className="btn-primary mt-5 px-8 py-2.5 text-sm font-bold"
          >
            Kontynuuj →
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ---- Dymek NPC (lewa strona) ----
function NPCBubble({ entry }: { entry: NpcEntry }) {
  const [showPL, setShowPL] = useState(false);
  const [audioRevealed, setAudioRevealed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayAudio = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setTimeout(() => {
      setIsPlaying(false);
      setAudioRevealed(true);
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="flex items-start gap-3"
      style={{ maxWidth: '82%' }}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border"
          style={{
            background: 'rgba(33,38,45,0.9)',
            borderColor: 'rgba(74,158,255,0.3)',
          }}
        >
          {EMOTION_EMOJI[entry.emotion] ?? '😐'}
        </div>
        {entry.npcName && (
          <div className="text-[9px] text-[#8b949e] font-medium text-center leading-tight">
            {entry.npcName.split(' ')[0]}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className="flex-1 min-w-0">
        <div
          className="rounded-2xl rounded-tl-sm px-4 py-3"
          style={{
            background: 'rgba(33,38,45,0.95)',
            border: '1px solid rgba(74,158,255,0.18)',
          }}
        >
          {entry.isListening ? (
            /* Interakcja słuchania */
            <div className="flex flex-col items-center gap-2 py-1">
              <button
                onClick={handlePlayAudio}
                disabled={isPlaying}
                className="flex flex-col items-center gap-1.5 transition-all"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all"
                  style={{
                    background: isPlaying ? 'rgba(74,158,255,0.2)' : 'rgba(74,158,255,0.1)',
                    border: `2px solid ${isPlaying ? 'rgba(74,158,255,0.9)' : 'rgba(74,158,255,0.3)'}`,
                    boxShadow: isPlaying ? '0 0 16px rgba(74,158,255,0.35)' : 'none',
                  }}
                >
                  {isPlaying ? '🔊' : '▶️'}
                </div>
                <span className="text-xs text-[#8b949e]">
                  {isPlaying
                    ? 'Odtwarzanie...'
                    : audioRevealed
                    ? 'Odtwórz ponownie'
                    : 'Kliknij, aby odsłuchać'}
                </span>
              </button>

              {isPlaying && (
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: '3px',
                        borderRadius: '2px',
                        background: '#4a9eff',
                        animation: `float ${0.5 + i * 0.1}s ease-in-out infinite`,
                        height: `${10 + i * 4}px`,
                      }}
                    />
                  ))}
                </div>
              )}

              {audioRevealed && (entry.audioText || entry.text) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-[#f0f6fc] text-center italic mt-1 px-2"
                >
                  &ldquo;{entry.audioText ?? entry.text}&rdquo;
                </motion.div>
              )}
              {!audioRevealed && !isPlaying && (
                <div className="text-xs text-[#484f58] text-center">
                  Odsłuchaj i odpowiedz na pytanie poniżej
                </div>
              )}
            </div>
          ) : (
            /* Zwykły dialog */
            <p className="text-sm text-[#f0f6fc] leading-relaxed">{entry.text}</p>
          )}

          {/* Tłumaczenie PL */}
          {!entry.isListening && entry.textPL && showPL && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-xs text-[#8b949e] italic mt-2 pt-2 border-t"
              style={{ borderColor: 'rgba(74,158,255,0.12)' }}
            >
              🇵🇱 {entry.textPL}
            </motion.p>
          )}
        </div>

        {/* Toggle tłumaczenia */}
        {!entry.isListening && entry.textPL && (
          <button
            onClick={() => setShowPL((v) => !v)}
            className="text-[10px] text-[#484f58] hover:text-[#8b949e] mt-1 ml-1 transition-colors"
          >
            {showPL ? 'Ukryj tłumaczenie' : '🇵🇱 Pokaż tłumaczenie'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ---- Dymek gracza (prawa strona) ----
function PlayerBubble({
  entry,
  isActive,
  playerName,
  playerAvatar,
  onContinue,
}: {
  entry: PlayerEntry;
  isActive: boolean;
  playerName: string;
  playerAvatar: string;
  onContinue?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="flex flex-col items-end"
    >
      {/* Avatar + imię po prawej */}
      <div className="flex items-end gap-2 mb-1">
        <div className="text-[9px] text-[#8b949e] font-medium">{playerName || 'Ty'}</div>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-base border flex-shrink-0"
          style={{
            background: 'rgba(33,38,45,0.9)',
            borderColor: 'rgba(240,180,41,0.3)',
          }}
        >
          {playerAvatar === 'kasia' ? '👩' : '🧑'}
        </div>
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: '80%' }}>
        <div
          className="rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-[#f0f6fc]"
          style={{
            background: entry.isCorrect ? 'rgba(62,207,142,0.12)' : 'rgba(255,107,107,0.1)',
            border: `1px solid ${entry.isCorrect ? 'rgba(62,207,142,0.35)' : 'rgba(255,107,107,0.3)'}`,
          }}
        >
          {entry.text}
        </div>

        {/* Feedback — zawsze widoczny po udzieleniu odpowiedzi */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-2 rounded-xl px-3 py-2 text-xs"
          style={{
            background: entry.isCorrect ? 'rgba(62,207,142,0.07)' : 'rgba(255,107,107,0.07)',
            border: `1px solid ${entry.isCorrect ? 'rgba(62,207,142,0.2)' : 'rgba(255,107,107,0.2)'}`,
          }}
        >
          <span style={{ color: entry.isCorrect ? '#3ecf8e' : '#ff6b6b' }}>
            {entry.isCorrect ? '✅ Poprawnie!' : '❌ Niepoprawnie'}
          </span>
          <span className="text-[#8b949e] ml-2">{entry.feedback}</span>
          {entry.isCorrect && entry.xpGained > 0 && (
            <span className="text-gold ml-2 font-semibold">+{entry.xpGained} XP</span>
          )}
        </motion.div>

        {/* Przycisk Dalej (tylko dla aktywnego wpisu) */}
        {isActive && onContinue && (
          <motion.button
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
            onClick={onContinue}
            className="mt-3 w-full py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{
              background: entry.isCorrect ? 'rgba(62,207,142,0.15)' : 'rgba(255,107,107,0.12)',
              border: `1px solid ${entry.isCorrect ? 'rgba(62,207,142,0.5)' : 'rgba(255,107,107,0.4)'}`,
              color: entry.isCorrect ? '#3ecf8e' : '#ff6b6b',
            }}
          >
            {entry.isCorrect ? 'Dalej →' : 'Rozumiem, dalej →'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ---- Wybór odpowiedzi ----
interface ChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
  npcReaction?: string;
}

function ChoicePanel({
  choices,
  onSelect,
}: {
  choices: ChoiceOption[];
  onSelect: (c: ChoiceOption) => void;
}) {
  return (
    <div className="space-y-2.5">
      {choices.map((choice, i) => (
        <motion.button
          key={choice.id}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
          onClick={() => onSelect(choice)}
          className="answer-btn w-full text-left"
        >
          <div className="flex items-start gap-3">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
              style={{
                background: 'rgba(74,158,255,0.1)',
                border: '1px solid rgba(74,158,255,0.25)',
                color: '#4a9eff',
              }}
            >
              {String.fromCharCode(65 + i)}
            </div>
            <span className="text-sm leading-relaxed">{choice.text}</span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// ---- Wybór słuchania ----
interface ListeningOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
}

function ListeningChoicePanel({
  choices,
  onSelect,
}: {
  choices: ListeningOption[];
  onSelect: (c: ListeningOption) => void;
}) {
  return (
    <div className="space-y-2.5">
      <div className="text-xs text-[#8b949e] uppercase tracking-wider font-semibold mb-1">
        Co powiedział rozmówca?
      </div>
      {choices.map((choice, i) => (
        <motion.button
          key={choice.id}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
          onClick={() => onSelect(choice)}
          className="answer-btn w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
              style={{
                background: 'rgba(74,158,255,0.1)',
                border: '1px solid rgba(74,158,255,0.25)',
                color: '#4a9eff',
              }}
            >
              {String.fromCharCode(65 + i)}
            </div>
            <span className="text-sm">{choice.text}</span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// ---- Uzupełnianie luki ----
function FillBlankPanel({
  sentence,
  options,
  correctFill,
  onSelect,
}: {
  sentence: string;
  options: string[];
  correctFill: string;
  onSelect: (opt: string) => void;
}) {
  const parts = sentence.split('____');
  return (
    <div>
      <div className="text-xs text-[#8b949e] uppercase tracking-wider font-semibold mb-3">
        Uzupełnij lukę
      </div>
      <div
        className="glass-card p-4 mb-4 text-base font-medium text-center leading-relaxed"
      >
        {parts[0]}
        <span
          className="inline-block min-w-[72px] mx-2 px-3 py-0.5 rounded-lg border-b-2 text-center align-middle"
          style={{
            background: 'rgba(74,158,255,0.08)',
            borderColor: '#4a9eff',
            color: '#4a9eff',
          }}
        >
          ___
        </span>
        {parts[1]}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className="answer-btn text-center justify-center py-3 text-sm font-medium"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Budowanie zdania ----
function SentenceBuildPanel({
  prompt,
  availableWords,
  builtSentence,
  onWordClick,
  onSubmit,
}: {
  prompt: string;
  availableWords: string[];
  builtSentence: string[];
  onWordClick: (word: string, fromBuilt: boolean) => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <div className="text-xs text-[#8b949e] uppercase tracking-wider font-semibold mb-3">
        Ułóż zdanie
      </div>
      {prompt && (
        <div
          className="glass-card p-3 mb-4 text-sm text-[#f0f6fc]"
          style={{ borderColor: 'rgba(74,158,255,0.2)' }}
        >
          🇵🇱 {prompt}
        </div>
      )}

      {/* Obszar ułożonego zdania */}
      <div
        className="min-h-[52px] p-3 rounded-xl mb-4 flex flex-wrap gap-2 items-center"
        style={{
          background: 'rgba(22,27,34,0.6)',
          border: '1px solid rgba(48,54,61,0.6)',
        }}
      >
        {builtSentence.length === 0 ? (
          <span className="text-[#484f58] text-sm">Kliknij słowa poniżej...</span>
        ) : (
          builtSentence.map((word, i) => (
            <button
              key={`built-${i}`}
              onClick={() => onWordClick(word, true)}
              className="word-chip selected"
            >
              {word}
            </button>
          ))
        )}
      </div>

      {/* Dostępne słowa */}
      <div className="flex flex-wrap gap-2 mb-4">
        {availableWords.map((word, i) => (
          <button
            key={`avail-${i}`}
            onClick={() => onWordClick(word, false)}
            className="word-chip"
          >
            {word}
          </button>
        ))}
      </div>

      <button
        onClick={onSubmit}
        disabled={builtSentence.length === 0}
        className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Sprawdź zdanie ✓
      </button>
    </div>
  );
}

// ---- Wolna odpowiedź ----
function FreeAnswerPanel({
  prompt,
  exampleAnswer,
  value,
  onChange,
  onSubmit,
}: {
  prompt: string;
  exampleAnswer?: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <div className="text-xs text-[#8b949e] uppercase tracking-wider font-semibold mb-3">
        Napisz po angielsku
      </div>
      {prompt && (
        <div
          className="glass-card p-3 mb-3 text-sm"
          style={{ borderColor: 'rgba(74,158,255,0.2)', color: '#f0f6fc' }}
        >
          🇵🇱 {prompt}
        </div>
      )}
      {exampleAnswer && (
        <div
          className="p-3 rounded-xl mb-3 text-sm"
          style={{
            background: 'rgba(240,180,41,0.08)',
            border: '1px solid rgba(240,180,41,0.2)',
            color: '#f0b429',
          }}
        >
          💡 Przykład: <em>{exampleAnswer}</em>
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSubmit()}
        placeholder="Napisz tutaj po angielsku..."
        rows={3}
        className="w-full px-4 py-3 rounded-xl text-sm resize-none transition-all duration-200"
        style={{
          background: 'rgba(22,27,34,0.8)',
          border: '1px solid rgba(48,54,61,0.8)',
          color: '#f0f6fc',
          outline: 'none',
        }}
      />
      <button
        onClick={onSubmit}
        disabled={!value.trim()}
        className="btn-primary w-full mt-3 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Wyślij odpowiedź →
      </button>
      <p className="text-xs text-[#484f58] text-center mt-2">
        Enter = wyślij · Shift+Enter = nowa linia
      </p>
    </div>
  );
}
