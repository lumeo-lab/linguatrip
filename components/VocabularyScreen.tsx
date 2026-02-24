'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import GameHUD from './GameHUD';

export default function VocabularyScreen() {
  const router = useRouter();
  const { vocabulary, markReviewed } = useGameStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'review'>('all');

  const now = new Date();
  const dueForReview = vocabulary.filter(
    (v) => !v.nextReviewAt || new Date(v.nextReviewAt) <= now
  );

  const filtered = vocabulary
    .filter((v) => {
      if (filter === 'review') return dueForReview.includes(v);
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return v.word.toLowerCase().includes(q) || v.translation.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d1117' }}>
      <GameHUD showBack onBack={() => router.push('/map')} title="Mój słowniczek" />

      {/* Header */}
      <div className="px-4 py-5 border-b" style={{ borderColor: 'rgba(48,54,61,0.5)' }}>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Słów', value: vocabulary.length, icon: '📚' },
            { label: 'Do powtórki', value: dueForReview.length, icon: '🔔', alert: dueForReview.length > 0 },
            { label: 'Poznane', value: vocabulary.filter((v) => v.reviewCount >= 3).length, icon: '✅' },
          ].map((s) => (
            <div
              key={s.label}
              className="glass-card p-3 text-center"
              style={s.alert ? { borderColor: 'rgba(255,107,107,0.3)' } : undefined}
            >
              <div className="text-xl mb-0.5">{s.icon}</div>
              <div className={`font-black text-xl ${s.alert ? 'text-ruby' : 'text-gold'}`}>{s.value}</div>
              <div className="text-xs text-[#8b949e]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Szukaj słówka..."
          className="w-full px-4 py-2.5 rounded-xl text-sm"
          style={{
            background: 'rgba(33,38,45,0.8)',
            border: '1px solid rgba(48,54,61,0.8)',
            color: '#f0f6fc',
            outline: 'none',
          }}
        />

        {/* Filter tabs */}
        <div className="flex gap-2 mt-3">
          {(['all', 'review'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: filter === f ? 'rgba(240,180,41,0.15)' : 'rgba(33,38,45,0.5)',
                border: `1px solid ${filter === f ? 'rgba(240,180,41,0.4)' : 'rgba(48,54,61,0.5)'}`,
                color: filter === f ? '#f0b429' : '#8b949e',
              }}
            >
              {f === 'all' ? '📖 Wszystkie' : `🔔 Do powtórki (${dueForReview.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Word list */}
      <div className="flex-1 overflow-auto px-4 py-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-bold mb-2">
              {vocabulary.length === 0 ? 'Brak słówek' : 'Brak wyników'}
            </h3>
            <p className="text-[#8b949e] text-sm">
              {vocabulary.length === 0
                ? 'Graj w scenariusze, aby budować swój słowniczek!'
                : 'Spróbuj innego wyszukiwania.'}
            </p>
            {vocabulary.length === 0 && (
              <button
                onClick={() => router.push('/map')}
                className="btn-primary mt-4"
              >
                Zacznij grę →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item, i) => {
              const isDue = dueForReview.includes(item);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-card p-4"
                  style={isDue ? { borderColor: 'rgba(255,159,67,0.3)' } : undefined}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-bold text-sapphire text-base">{item.word}</span>
                        <span className="text-xs text-[#484f58]">{item.partOfSpeech}</span>
                        <span className="text-xs text-[#484f58]">/{item.pronunciation}/</span>
                      </div>
                      <div className="text-[#f0f6fc] text-sm mb-1">{item.translation}</div>
                      {item.exampleSentence && (
                        <div className="text-xs text-[#8b949e] italic leading-relaxed">
                          &ldquo;{item.exampleSentence}&rdquo;
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <div
                              key={s}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                background: s <= item.reviewCount ? '#3ecf8e' : 'rgba(48,54,61,0.6)',
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-[#484f58]">
                          {item.reviewCount} powtórek
                        </span>
                        {isDue && (
                          <span className="text-xs text-amber font-semibold">⚡ Do powtórki</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button className="text-[#484f58] hover:text-sapphire transition-colors text-lg">
                        🔊
                      </button>
                      {isDue && (
                        <button
                          onClick={() => markReviewed(item.id)}
                          className="text-xs px-2 py-1 rounded-lg font-semibold"
                          style={{
                            background: 'rgba(62,207,142,0.1)',
                            border: '1px solid rgba(62,207,142,0.3)',
                            color: '#3ecf8e',
                          }}
                        >
                          ✓
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
