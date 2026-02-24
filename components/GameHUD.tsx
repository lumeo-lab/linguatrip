'use client';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';

// XP potrzebne do kolejnego poziomu
function xpForNextLevel(level: number): number {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000];
  return thresholds[level] ?? level * 500;
}
function xpForCurrentLevel(level: number): number {
  const thresholds = [0, 0, 100, 300, 600, 1000, 1500, 2200];
  return thresholds[level] ?? (level - 1) * 500;
}

interface GameHUDProps {
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
}

export default function GameHUD({ showBack, onBack, title }: GameHUDProps) {
  const { player } = useGameStore();

  const currentLevelXP = xpForCurrentLevel(player.level);
  const nextLevelXP = xpForNextLevel(player.level);
  const progressXP = player.xp - currentLevelXP;
  const neededXP = nextLevelXP - currentLevelXP;
  const xpPercent = Math.min(100, Math.round((progressXP / neededXP) * 100));

  return (
    <header className="sticky top-0 z-50 w-full">
      <div
        className="flex items-center gap-3 px-4 py-3 border-b"
        style={{
          background: 'rgba(13,17,23,0.92)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgba(48,54,61,0.8)',
        }}
      >
        {/* Back button */}
        {showBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-[#8b949e] hover:text-white transition-colors mr-1"
          >
            <span className="text-lg">←</span>
          </button>
        )}

        {/* Logo / Title */}
        <div className="flex items-center gap-2 mr-auto">
          <span className="text-xl">✈️</span>
          {title ? (
            <span className="font-bold text-sm text-white">{title}</span>
          ) : (
            <span className="font-black text-base">
              <span className="text-gold">Lingua</span>
              <span className="text-white">Trip</span>
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3">
          {/* Streak */}
          {player.streak > 0 && (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="streak-badge flex items-center gap-1"
            >
              <span>🔥</span>
              <span>{player.streak}</span>
            </motion.div>
          )}

          {/* Funty */}
          <div className="flex items-center gap-1.5 glass-card px-3 py-1.5">
            <span className="text-sm">💷</span>
            <span className="font-bold text-sm text-gold">{player.pounds}</span>
          </div>

          {/* Level + XP */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm"
              style={{ background: 'linear-gradient(135deg, #f0b429, #ff9f43)', color: '#0d1117' }}
            >
              {player.level}
            </div>
            <div className="hidden sm:flex flex-col gap-0.5 min-w-[80px]">
              <div className="text-xs text-[#8b949e]">
                {player.xp} / {nextLevelXP} XP
              </div>
              <div className="xp-bar w-20">
                <motion.div
                  className="xp-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg border"
            style={{ borderColor: 'rgba(240,180,41,0.5)', background: 'rgba(240,180,41,0.1)' }}
          >
            {player.avatar === 'tomek' ? '🧑' : '👩'}
          </div>
        </div>
      </div>
    </header>
  );
}
