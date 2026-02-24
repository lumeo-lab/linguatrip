'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { DESTINATIONS, LONDON_DAYS_OVERVIEW } from '@/lib/gameData';
import type { DestinationConfig } from '@/lib/types';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';

const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000];

const GEO_URL = '/countries-110m.json';

// Twemoji CDN — flagi jako obrazki (działają na Windows, Mac, Linux)
const TW = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg';
const FLAG_URLS: Record<string, string> = {
  london:     `${TW}/1f1ec-1f1e7.svg`, // 🇬🇧
  berlin:     `${TW}/1f1e9-1f1ea.svg`, // 🇩🇪
  madrid:     `${TW}/1f1ea-1f1f8.svg`, // 🇪🇸
  paris:      `${TW}/1f1eb-1f1f7.svg`, // 🇫🇷
  rome:       `${TW}/1f1ee-1f1f9.svg`, // 🇮🇹
  amsterdam:  `${TW}/1f1f3-1f1f1.svg`, // 🇳🇱
  vienna:     `${TW}/1f1e6-1f1f9.svg`, // 🇦🇹
  prague:     `${TW}/1f1e8-1f1ff.svg`, // 🇨🇿
  warsaw:     `${TW}/1f1f5-1f1f1.svg`, // 🇵🇱
  barcelona:  `${TW}/1f1ea-1f1f8.svg`, // 🇪🇸
  lisbon:     `${TW}/1f1f5-1f1f9.svg`, // 🇵🇹
  athens:     `${TW}/1f1ec-1f1f7.svg`, // 🇬🇷
  budapest:   `${TW}/1f1ed-1f1fa.svg`, // 🇭🇺
  stockholm:  `${TW}/1f1f8-1f1ea.svg`, // 🇸🇪
  copenhagen: `${TW}/1f1e9-1f1f0.svg`, // 🇩🇰
  dublin:     `${TW}/1f1ee-1f1ea.svg`, // 🇮🇪
  brussels:   `${TW}/1f1e7-1f1ea.svg`, // 🇧🇪
  zurich:     `${TW}/1f1e8-1f1ed.svg`, // 🇨🇭
  krakow:     `${TW}/1f1f5-1f1f1.svg`, // 🇵🇱
  edinburgh:  `${TW}/1f1ec-1f1e7.svg`, // 🇬🇧 (UK jako fallback dla Szkocji)
};

// Grywalane destynacje [lng, lat]
const CITY_COORDS: Record<string, [number, number]> = {
  london: [-0.1278, 51.5074],
  berlin: [13.4050, 52.5200],
  madrid: [-3.7038, 40.4168],
  paris:  [2.3522,  48.8566],
};

// Dodatkowe 16 miast — wizualne markery "wkrótce"
const EXTRA_CITIES: { id: string; name: string; coords: [number, number]; flag: string }[] = [
  { id: 'rome',       name: 'Rzym',       coords: [12.4964, 41.9028],  flag: '🇮🇹' },
  { id: 'amsterdam',  name: 'Amsterdam',  coords: [4.9041,  52.3676],  flag: '🇳🇱' },
  { id: 'vienna',     name: 'Wiedeń',     coords: [16.3738, 48.2082],  flag: '🇦🇹' },
  { id: 'prague',     name: 'Praga',      coords: [14.4208, 50.0880],  flag: '🇨🇿' },
  { id: 'warsaw',     name: 'Warszawa',   coords: [21.0122, 52.2297],  flag: '🇵🇱' },
  { id: 'barcelona',  name: 'Barcelona',  coords: [2.1734,  41.3851],  flag: '🇪🇸' },
  { id: 'lisbon',     name: 'Lizbona',    coords: [-9.1393, 38.7223],  flag: '🇵🇹' },
  { id: 'athens',     name: 'Ateny',      coords: [23.7275, 37.9838],  flag: '🇬🇷' },
  { id: 'budapest',   name: 'Budapeszt',  coords: [19.0402, 47.4979],  flag: '🇭🇺' },
  { id: 'stockholm',  name: 'Sztokholm',  coords: [18.0686, 59.3293],  flag: '🇸🇪' },
  { id: 'copenhagen', name: 'Kopenhaga',  coords: [12.5683, 55.6761],  flag: '🇩🇰' },
  { id: 'dublin',     name: 'Dublin',     coords: [-6.2603, 53.3498],  flag: '🇮🇪' },
  { id: 'brussels',   name: 'Bruksela',   coords: [4.3517,  50.8503],  flag: '🇧🇪' },
  { id: 'zurich',     name: 'Zurych',     coords: [8.5417,  47.3769],  flag: '🇨🇭' },
  { id: 'krakow',     name: 'Kraków',     coords: [19.9450, 50.0647],  flag: '🇵🇱' },
  { id: 'edinburgh',  name: 'Edynburg',   coords: [-3.1883, 55.9533],  flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
];

export default function WorldMap() {
  const router = useRouter();
  const { player, isOnboarded, scenarioResults } = useGameStore();
  const [selectedCity, setSelectedCity] = useState<DestinationConfig | null>(null);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [hoveredExtra, setHoveredExtra] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOnboarded) router.push('/');
  }, [isOnboarded, router]);

  // Postęp Londynu
  const londonDest = DESTINATIONS.find((d) => d.id === 'london');
  const totalStars = scenarioResults
    .filter((r) => r.scenarioId.startsWith('ldn_'))
    .reduce((acc, r) => acc + r.stars, 0);
  const completedDays = (londonDest?.days ?? []).filter((day) =>
    day.scenarios.length > 0 &&
    day.scenarios.every((s) => scenarioResults.some((r) => r.scenarioId === s.id))
  ).length;

  const handleCityClick = (dest: DestinationConfig) => {
    if (!dest.isUnlocked) return;
    setSelectedCity(dest);
  };

  const handleEnterCity = () => {
    if (!selectedCity) return;
    router.push(`/day/${selectedCity.id}`);
  };

  const xpCurrent = XP_THRESHOLDS[player.level - 1] ?? 0;
  const xpNext = XP_THRESHOLDS[player.level] ?? player.level * 500;
  const xpPercent = Math.min(100, Math.round(((player.xp - xpCurrent) / (xpNext - xpCurrent)) * 100));

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#060d18' }}>

      {/* ── Pojedynczy pasek nawigacyjny ── */}
      <header
        className="sticky top-0 z-50 flex items-center gap-3 px-4 py-2.5 border-b"
        style={{
          background: 'rgba(6,13,24,0.95)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgba(48,54,61,0.7)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-1.5 mr-2 flex-shrink-0">
          <span className="text-xl">✈️</span>
          <span className="font-black text-base">
            <span style={{ color: '#f0b429' }}>Lingua</span>
            <span className="text-white">Trip</span>
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 flex-shrink-0" style={{ background: 'rgba(48,54,61,0.8)' }} />

        {/* Avatar → Profil */}
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-2 rounded-lg px-2 py-1 flex-shrink-0 transition-colors"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(74,158,255,0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-base flex-shrink-0"
            style={{ background: 'rgba(74,158,255,0.12)', border: '1px solid rgba(74,158,255,0.35)' }}
          >
            {player.avatar === 'tomek' ? '🧑' : '👩'}
          </div>
          <div className="text-left hidden sm:block">
            <div className="font-bold text-sm leading-none">{player.name}</div>
            <div className="text-[11px] mt-0.5" style={{ color: '#4a9eff' }}>Zobacz profil →</div>
          </div>
        </button>

        {/* Level + XP */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f0b429, #ff9f43)', color: '#0d1117' }}
          >
            {player.level}
          </div>
          <div className="hidden md:flex flex-col gap-0.5">
            <div className="text-[10px]" style={{ color: '#8b949e' }}>{player.xp} / {xpNext} XP</div>
            <div className="xp-bar w-16">
              <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs flex-shrink-0" style={{ color: '#8b949e' }}>
          {player.streak > 0 && (
            <span className="flex items-center gap-1">🔥 <span className="font-bold text-white">{player.streak}</span></span>
          )}
          <span className="flex items-center gap-1">⭐ <span className="font-semibold text-white">{totalStars}</span></span>
          <span className="flex items-center gap-1">🗺️ <span className="font-semibold text-white">{completedDays}/7</span></span>
          <span className="flex items-center gap-1">💷 <span className="font-bold" style={{ color: '#f0b429' }}>{player.pounds}</span></span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 flex-shrink-0" style={{ background: 'rgba(48,54,61,0.8)' }} />

        {/* Słowniczek */}
        <button
          onClick={() => router.push('/vocabulary')}
          className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0"
        >
          📚 Słowniczek
        </button>
      </header>

      {/* MAPA */}
      <div className="flex-1 relative overflow-hidden" style={{ background: '#07111f' }}>
        {!mounted ? (
          <div className="w-full h-full flex items-center justify-center" style={{ minHeight: 'calc(100vh - 110px)' }}>
            <div className="text-[#4a9eff] text-sm animate-pulse">Ładowanie mapy…</div>
          </div>
        ) : (
        <>
        {/* Tagline */}
        <div
          className="absolute top-5 right-5 z-20 rounded-2xl p-4 max-w-[220px]"
          style={{ background: 'rgba(6,13,24,0.82)', border: '1px solid rgba(74,158,255,0.18)', backdropFilter: 'blur(10px)' }}
        >
          <div className="text-lg mb-1">✈️</div>
          <p className="font-bold text-sm leading-snug mb-1" style={{ color: '#f0f6fc' }}>
            Leć po Europie,<br />ucz się języków
          </p>
          <p className="text-[11px] leading-relaxed" style={{ color: '#8b949e' }}>
            Każde miasto to nowe scenariusze, dialogi i słownictwo. Kliknij destynację, aby zacząć.
          </p>
        </div>

        {/* Legenda */}
        <div
          className="absolute bottom-6 left-5 z-20 rounded-xl p-3 text-xs space-y-2"
          style={{ background: 'rgba(6,13,24,0.85)', border: '1px solid rgba(74,158,255,0.2)', backdropFilter: 'blur(8px)' }}
        >
          <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: '#4a9eff' }}>Legenda</div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#e63946', boxShadow: '0 0 6px rgba(230,57,70,0.8)' }} />
            <span style={{ color: '#f0f6fc' }}>Dostępne miasto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#3ecf8e', boxShadow: '0 0 6px rgba(62,207,142,0.8)' }} />
            <span style={{ color: '#f0f6fc' }}>Ukończone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(74,158,255,0.2)', border: '1px solid rgba(74,158,255,0.5)' }} />
            <span style={{ color: '#8b949e' }}>Wkrótce</span>
          </div>
        </div>

        <ComposableMap
          projection="geoAzimuthalEqualArea"
          projectionConfig={{ rotate: [-13, -47, 0], scale: 1300 }}
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <radialGradient id="oceanGrad" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0d2240" />
              <stop offset="100%" stopColor="#04090f" />
            </radialGradient>
            <filter id="cityGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="landShadow">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.5" />
            </filter>
          </defs>

          <g>
            {/* Ocean */}
            <rect x="-20000" y="-20000" width="40000" height="40000" fill="url(#oceanGrad)" />

            {/* Kraje — prawdziwe kształty */}
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  // Kolorowanie wg kontynentu (przybliżone przez ID)
                  const id = Number(geo.id);
                  const isEurope = (id >= 8 && id <= 826) &&
                    ![12,24,50,204,120,140,174,178,180,204,218,231,232,262,266,270,
                      288,324,384,404,426,430,450,454,466,478,484,504,508,516,562,
                      566,578,600,620,624,630,646,654,686,694,706,710,716,728,729,
                      732,740,762,800,818,834,854,894].includes(id);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: {
                          fill: isEurope ? '#1e3d2f' : '#162b22',
                          stroke: isEurope ? '#2d5a3d' : '#1a3028',
                          strokeWidth: 0.3,
                          outline: 'none',
                          filter: 'url(#landShadow)',
                        },
                        hover: {
                          fill: isEurope ? '#244835' : '#1a3028',
                          stroke: '#3d7a52',
                          strokeWidth: 0.4,
                          outline: 'none',
                        },
                        pressed: {
                          fill: '#1e3d2f',
                          outline: 'none',
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* Dodatkowe miasta — "wkrótce" */}
            {EXTRA_CITIES.map((city) => {
              const isH = hoveredExtra === city.id;
              return (
                <Marker key={city.id} coordinates={city.coords}>
                  <g
                    onMouseEnter={() => setHoveredExtra(city.id)}
                    onMouseLeave={() => setHoveredExtra(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Glow ring na hover */}
                    <circle
                      r={isH ? 12 : 0}
                      fill="rgba(74,158,255,0.08)"
                      stroke="none"
                      style={{ transition: 'r 0.2s ease' }}
                    />
                    {/* Główna kropka */}
                    <circle
                      r={isH ? 5.5 : 3.5}
                      fill={isH ? 'rgba(74,158,255,0.35)' : 'rgba(74,158,255,0.12)'}
                      stroke={isH ? 'rgba(74,158,255,1)' : 'rgba(74,158,255,0.5)'}
                      strokeWidth={isH ? 1.2 : 0.8}
                      style={{ transition: 'all 0.15s ease' }}
                    />
                    {/* Flaga (Twemoji) + nazwa */}
                    {FLAG_URLS[city.id] && (
                      <image
                        href={FLAG_URLS[city.id]}
                        x={isH ? -14 : -9}
                        y={isH ? -26 : -17}
                        width={isH ? 10 : 7}
                        height={isH ? 10 : 7}
                        style={{ pointerEvents: 'none', transition: 'all 0.15s ease' }}
                      />
                    )}
                    <text
                      textAnchor="middle"
                      x={isH ? 3 : 2}
                      y={isH ? -18 : -11}
                      style={{
                        fontSize: isH ? '11px' : '7px',
                        fontFamily: 'system-ui, sans-serif',
                        fontWeight: isH ? '700' : '600',
                        fill: isH ? '#f0f6fc' : 'rgba(180,190,200,0.85)',
                        pointerEvents: 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {city.name}
                    </text>
                    {/* "wkrótce" na hover */}
                    {isH && (
                      <text
                        textAnchor="middle"
                        y={-27}
                        style={{
                          fontSize: '7px',
                          fontFamily: 'system-ui, sans-serif',
                          fill: '#4a9eff',
                          fontWeight: '600',
                          pointerEvents: 'none',
                        }}
                      >
                        🔒 wkrótce
                      </text>
                    )}
                  </g>
                </Marker>
              );
            })}

            {/* Pinezki miast */}
            {DESTINATIONS.map((dest) => {
              const coords = CITY_COORDS[dest.id];
              if (!coords) return null;
              const isSelected = selectedCity?.id === dest.id;
              const isHovered = hoveredCity === dest.id;
              const isUnlocked = dest.isUnlocked;
              const isCompleted = dest.id === 'london' && completedDays > 0;

              /* ── Niedostępne destynacje: styl "wkrótce" ── */
              if (!isUnlocked) {
                return (
                  <Marker key={dest.id} coordinates={coords}>
                    <g
                      onMouseEnter={() => setHoveredCity(dest.id)}
                      onMouseLeave={() => setHoveredCity(null)}
                      style={{ cursor: 'default' }}
                    >
                      {/* Glow ring na hover */}
                      <circle
                        r={isHovered ? 14 : 0}
                        fill="rgba(74,158,255,0.08)"
                        stroke="none"
                        style={{ transition: 'r 0.2s ease' }}
                      />
                      {/* Kropka */}
                      <circle
                        r={isHovered ? 6.5 : 4.5}
                        fill={isHovered ? 'rgba(74,158,255,0.3)' : 'rgba(74,158,255,0.1)'}
                        stroke={isHovered ? 'rgba(74,158,255,0.9)' : 'rgba(74,158,255,0.45)'}
                        strokeWidth={isHovered ? 1.3 : 0.9}
                        style={{ transition: 'all 0.15s ease' }}
                      />
                      {/* Flaga (Twemoji) + nazwa */}
                      {FLAG_URLS[dest.id] && (
                        <image
                          href={FLAG_URLS[dest.id]}
                          x={isHovered ? -14 : -10}
                          y={isHovered ? -24 : -17}
                          width={isHovered ? 10 : 7}
                          height={isHovered ? 10 : 7}
                          style={{ pointerEvents: 'none', transition: 'all 0.15s ease', opacity: 0.7 }}
                        />
                      )}
                      <text
                        textAnchor="middle"
                        x={isHovered ? 3 : 2}
                        y={isHovered ? -14 : -9}
                        style={{
                          fontSize: isHovered ? '11px' : '8px',
                          fontFamily: 'system-ui, sans-serif',
                          fontWeight: '700',
                          fill: isHovered ? '#f0f6fc' : 'rgba(180,190,200,0.8)',
                          pointerEvents: 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {dest.city}
                      </text>
                      {/* "wkrótce" badge na hover */}
                      {isHovered && (
                        <text
                          textAnchor="middle"
                          y={-27}
                          style={{
                            fontSize: '7px',
                            fontFamily: 'system-ui, sans-serif',
                            fill: '#4a9eff',
                            fontWeight: '600',
                            pointerEvents: 'none',
                          }}
                        >
                          wkrótce
                        </text>
                      )}
                    </g>
                  </Marker>
                );
              }

              /* ── Dostępne destynacje: pełna pinezka ── */
              const pinColor = isCompleted ? '#3ecf8e' : '#e63946';
              const glowColor = isCompleted ? 'rgba(62,207,142,0.5)' : 'rgba(230,57,70,0.5)';

              return (
                <Marker
                  key={dest.id}
                  coordinates={coords}
                  onClick={() => handleCityClick(dest)}
                >
                  {/* Pulse rings */}
                  <circle r={isSelected || isHovered ? 20 : 15} fill={glowColor} opacity={0.12}>
                    <animate attributeName="r" values={isSelected ? "16;24;16" : "12;20;12"} dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.18;0;0.18" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                  <circle r={isSelected || isHovered ? 11 : 8} fill={glowColor} opacity={0.22}>
                    <animate attributeName="r" values={isSelected ? "9;14;9" : "6;11;6"} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.28;0.04;0.28" dur="2s" repeatCount="indefinite" />
                  </circle>

                  {/* Pin body */}
                  <circle
                    r={isSelected || isHovered ? 8 : 6}
                    fill={pinColor}
                    stroke={isSelected ? '#ffffff' : 'rgba(255,255,255,0.7)'}
                    strokeWidth={isSelected ? 1.8 : 1}
                    filter="url(#cityGlow)"
                    onMouseEnter={() => setHoveredCity(dest.id)}
                    onMouseLeave={() => setHoveredCity(null)}
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                  />

                  {/* Flaga (Twemoji) + nazwa */}
                  {FLAG_URLS[dest.id] && (
                    <image
                      href={FLAG_URLS[dest.id]}
                      x={isSelected || isHovered ? -18 : -13}
                      y={isSelected || isHovered ? -30 : -23}
                      width={isSelected || isHovered ? 13 : 10}
                      height={isSelected || isHovered ? 13 : 10}
                      style={{ pointerEvents: 'none', transition: 'all 0.15s ease' }}
                    />
                  )}
                  <text
                    textAnchor="middle"
                    x={isSelected || isHovered ? 3 : 2}
                    y={isSelected || isHovered ? -18 : -13}
                    style={{
                      fontSize: isSelected || isHovered ? '13px' : '10px',
                      fontFamily: 'system-ui, sans-serif',
                      fontWeight: '800',
                      fill: isSelected || isHovered ? '#ffd970' : '#ffffff',
                      pointerEvents: 'none',
                      transition: 'all 0.15s ease',
                      textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                    }}
                  >
                    {dest.city}
                  </text>

                  {/* Język */}
                  <text
                    textAnchor="middle"
                    y={isSelected || isHovered ? -9 : -6}
                    style={{
                      fontSize: isSelected || isHovered ? '7px' : '5.5px',
                      fontFamily: 'system-ui, sans-serif',
                      fill: 'rgba(240,180,41,0.95)',
                      pointerEvents: 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {dest.language}
                  </text>
                </Marker>
              );
            })}
          </g>
        </ComposableMap>
        </>
        )}
      </div>

      {/* Panel szczegółów miasta */}
      <AnimatePresence>
        {selectedCity && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              style={{ background: 'rgba(4,9,15,0.5)', backdropFilter: 'blur(2px)' }}
              onClick={() => setSelectedCity(null)}
            />

            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-40 max-w-2xl mx-auto"
            >
              <div
                className="rounded-t-3xl p-6 border-t border-x"
                style={{
                  background: 'rgba(10,17,28,0.98)',
                  borderColor: 'rgba(74,158,255,0.2)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="w-10 h-1 rounded-full bg-[#30363d] mx-auto mb-5" />

                <div className="flex items-start gap-4 mb-5">
                  <div className="text-5xl">{selectedCity.flag}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-2xl font-black">{selectedCity.city}</h3>
                      {selectedCity.isUnlocked && (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(62,207,142,0.15)', color: '#3ecf8e', border: '1px solid rgba(62,207,142,0.3)' }}
                        >
                          Dostępne
                        </span>
                      )}
                    </div>
                    <div className="text-sm mb-1" style={{ color: '#8b949e' }}>
                      {selectedCity.country} · {selectedCity.language}
                    </div>
                    <div className="text-sm" style={{ color: '#8b949e' }}>{selectedCity.description}</div>
                  </div>
                  <button onClick={() => setSelectedCity(null)} className="text-2xl mt-1" style={{ color: '#484f58' }}>✕</button>
                </div>

                {selectedCity.id === 'london' && (
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs" style={{ color: '#8b949e' }}>Postęp w Londynie</span>
                      <span className="text-xs font-bold" style={{ color: '#f0b429' }}>{completedDays}/{selectedCity.totalDays} dni</span>
                    </div>
                    <div className="xp-bar mb-4">
                      <div className="xp-bar-fill" style={{ width: `${(completedDays / selectedCity.totalDays) * 100}%` }} />
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {LONDON_DAYS_OVERVIEW.map((d, i) => {
                        const londonDayData = londonDest?.days?.find((day) => day.dayNumber === d.day);
                        const isCompleted = londonDayData
                          ? londonDayData.scenarios.length > 0 &&
                            londonDayData.scenarios.every((s) => scenarioResults.some((r) => r.scenarioId === s.id))
                          : false;
                        const prevDayData = londonDest?.days?.find((day) => day.dayNumber === d.day - 1);
                        const prevDayCompleted = prevDayData
                          ? prevDayData.scenarios.every((s) => scenarioResults.some((r) => r.scenarioId === s.id))
                          : false;
                        const isAvailable = d.isAvailable || d.day === 1 || prevDayCompleted;

                        return (
                          <div key={d.day} className="flex flex-col items-center gap-1">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-all"
                              style={{
                                background: isCompleted
                                  ? 'rgba(62,207,142,0.15)'
                                  : isAvailable ? 'rgba(240,180,41,0.1)' : 'rgba(22,27,34,0.5)',
                                borderColor: isCompleted
                                  ? 'rgba(62,207,142,0.5)'
                                  : isAvailable ? 'rgba(240,180,41,0.3)' : 'rgba(48,54,61,0.5)',
                              }}
                            >
                              {isCompleted ? '✅' : isAvailable ? d.emoji : '🔒'}
                            </div>
                            <div className="text-[10px] text-center" style={{ color: '#8b949e' }}>Dz.{d.day}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleEnterCity}
                  disabled={!selectedCity.isUnlocked}
                  className={`w-full py-4 rounded-xl font-bold text-base transition-all ${
                    selectedCity.isUnlocked ? 'btn-primary' : 'cursor-not-allowed'
                  }`}
                  style={!selectedCity.isUnlocked ? {
                    background: '#21262d', color: '#484f58', border: '1px solid #30363d'
                  } : {}}
                >
                  {selectedCity.isUnlocked ? `✈️ Leć do ${selectedCity.city}` : '🔒 Wkrótce dostępne'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
