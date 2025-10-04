"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ConfettiEffect } from '@/components/ConfettiEffect';
import { createElementConfetti } from '@/components/SlotConfettiEffect';

interface DrawingState {
  drawingNumbers: { [winnerId: string]: string | undefined };
  isGlobalDrawing: boolean;
  currentRedrawWinnerId: string | null;
  winners: any[];
  selectedPrizeIds: string[];
  prizes: any[];
  eventName: string;
  backgroundImage?: string;
}

interface WinnerSlot {
  prizeId: string;
  prizeName: string;
  prizeImage?: string;
  slotIndex: number;
  winnerIndex: number;
  winnerId: string;
}

export default function DrawingWindowMirror() {
  const showPrizeHeader = false;
  const showWinnerSlots = true;

  const [displayState, setDisplayState] = useState<DrawingState>({
    drawingNumbers: {},
    isGlobalDrawing: false,
    currentRedrawWinnerId: null,
    winners: [],
    selectedPrizeIds: [],
    prizes: [],
    eventName: '',
    backgroundImage: '',
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const slotRefs = useRef<{ [winnerId: string]: HTMLDivElement | null }>({});

  // Font and background states
  const [fontColor, setFontColor] = useState('#1e293b');
  const [fontSizePx, setFontSizePx] = useState('48');
  const [eventNameFontColor, setEventNameFontColor] = useState('#1e293b');
  const [eventNameFontSizePx, setEventNameFontSizePx] = useState('32');
  const [prizeNameFontColor, setPrizeNameFontColor] = useState('#1e293b');
  const [prizeNameFontSizePx, setPrizeNameFontSizePx] = useState('28');
  const [totalWinnerFontColor, setTotalWinnerFontColor] = useState('#1e293b');
  const [totalWinnerFontSizePx, setTotalWinnerFontSizePx] = useState('24');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgAlpha, setBgAlpha] = useState('100');
  const [fontFamily, setFontFamily] = useState('sans');

  // On mount, read from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFontColor(localStorage.getItem('drawingFontColor') || '#1e293b');
      setFontSizePx(localStorage.getItem('drawingFontSizePx') || '48');
      setEventNameFontColor(localStorage.getItem('eventNameFontColor') || '#1e293b');
      setEventNameFontSizePx(localStorage.getItem('eventNameFontSizePx') || '32');
      setPrizeNameFontColor(localStorage.getItem('prizeNameFontColor') || '#1e293b');
      setPrizeNameFontSizePx(localStorage.getItem('prizeNameFontSizePx') || '28');
      setTotalWinnerFontColor(localStorage.getItem('totalWinnerFontColor') || '#1e293b');
      setTotalWinnerFontSizePx(localStorage.getItem('totalWinnerFontSizePx') || '24');
      setBgColor(localStorage.getItem('drawingBgColor') || '#ffffff');
      setBgAlpha(localStorage.getItem('drawingBgAlpha') || '100');
      setFontFamily(localStorage.getItem('drawingFontFamily') || 'sans');
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'drawingFontColor' && e.newValue) setFontColor(e.newValue);
      if (e.key === 'drawingFontSizePx' && e.newValue) setFontSizePx(e.newValue);
      if (e.key === 'eventNameFontColor' && e.newValue) setEventNameFontColor(e.newValue);
      if (e.key === 'eventNameFontSizePx' && e.newValue) setEventNameFontSizePx(e.newValue);
      if (e.key === 'prizeNameFontColor' && e.newValue) setPrizeNameFontColor(e.newValue);
      if (e.key === 'prizeNameFontSizePx' && e.newValue) setPrizeNameFontSizePx(e.newValue);
      if (e.key === 'totalWinnerFontColor' && e.newValue) setTotalWinnerFontColor(e.newValue);
      if (e.key === 'totalWinnerFontSizePx' && e.newValue) setTotalWinnerFontSizePx(e.newValue);
      if (e.key === 'drawingBgColor' && e.newValue) setBgColor(e.newValue);
      if (e.key === 'drawingBgAlpha' && e.newValue) setBgAlpha(e.newValue);
      if (e.key === 'drawingFontFamily' && e.newValue) setFontFamily(e.newValue);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for state changes from main page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'drawingState' && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          setDisplayState(newState);
        } catch (error) {
          console.error('Error parsing drawing state:', error);
        }
      }
    };

    // Load initial state
    const initialState = localStorage.getItem('drawingState');
    if (initialState) {
      try {
        const parsedState = JSON.parse(initialState);
        setDisplayState(parsedState);
      } catch (error) {
        console.error('Error loading initial drawing state:', error);
      }
    }

    window.addEventListener('storage', handleStorageChange);

    // Poll for updates every 100ms as backup
    const pollInterval = setInterval(() => {
      const currentState = localStorage.getItem('drawingState');
      if (currentState) {
        try {
          const parsedState = JSON.parse(currentState);
          setDisplayState(prev => {
            if (JSON.stringify(prev) !== currentState) {
              return parsedState;
            }
            return prev;
          });
        } catch (error) {}
      }
    }, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [displayState.isGlobalDrawing, displayState.currentRedrawWinnerId]);

  // Group winner slots by prize
  const groupSlotsByPrize = () => {
    const winnerSlots: WinnerSlot[] = [];
    let slotIndex = 0;

    if (!displayState.prizes || !displayState.selectedPrizeIds) {
      return [];
    }

    const selectedPrizes = displayState.prizes.filter(p => displayState.selectedPrizeIds.includes(p.id));

    selectedPrizes.forEach((prize) => {
      for (let i = 0; i < prize.quantity; i++) {
        const winner = displayState.winners?.find(w => w.prizeId === prize.id && w.slotIndex === slotIndex);

        winnerSlots.push({
          prizeId: prize.id,
          prizeName: prize.name,
          prizeImage: prize.image,
          slotIndex: slotIndex,
          winnerIndex: i + 1,
          winnerId: winner?.id || `slot_${slotIndex}`,
        });
        slotIndex++;
      }
    });

    // Group by prize
    const grouped: { [prizeId: string]: { prize: any; slots: WinnerSlot[] } } = {};
    winnerSlots.forEach(slot => {
      if (!grouped[slot.prizeId]) {
        const prize = displayState.prizes?.find(p => p.id === slot.prizeId);
        grouped[slot.prizeId] = {
          prize: prize || { id: slot.prizeId, name: slot.prizeName, quantity: 1 },
          slots: []
        };
      }
      grouped[slot.prizeId].slots.push(slot);
    });

    return Object.values(grouped);
  };

  // Get display value for a winner slot (number or name)
  const getDisplayNumber = (slot: WinnerSlot): string => {
    const winner = displayState.winners?.find(w => w.id === slot.winnerId);
    const animatedValue = displayState.drawingNumbers?.[slot.winnerId];
    if (animatedValue) {
      return animatedValue;
    }
    // If the value is a number string, show as number; otherwise, show as name
    if (winner?.participantNumber) {
      // If it's a number, pad it; if not, show as is
      const val = winner.participantNumber;
      if (/^\d+$/.test(val)) {
        return val.padStart(3, '0');
      }
      return val;
    }
    return '---';
  };

  const prizeGroups = groupSlotsByPrize();
  const hasSelectedPrizes = displayState.selectedPrizeIds && displayState.selectedPrizeIds.length > 0;
  const isDrawing = displayState.isGlobalDrawing || displayState.currentRedrawWinnerId !== null;

  function hexToRgba(hex: string, alpha: string | number) {
    let r = 255, g = 255, b = 255;
    if (hex.startsWith('#') && (hex.length === 7 || hex.length === 4)) {
      if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
      } else if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
      }
    }
    const a = Math.max(0, Math.min(1, Number(alpha) / 100));
    return `rgba(${r},${g},${b},${a})`;
  }

  return (
    <div
      style={{
        fontFamily:
          fontFamily === 'sans'
            ? 'ui-sans-serif, system-ui, sans-serif'
            : fontFamily === 'serif'
            ? 'ui-serif, Georgia, serif'
            : fontFamily === 'mono'
            ? 'ui-monospace, SFMono-Regular, monospace'
            : fontFamily === 'poppins'
            ? "'Poppins', ui-sans-serif, system-ui, sans-serif"
            : fontFamily === 'roboto'
            ? "'Roboto', ui-sans-serif, system-ui, sans-serif"
            : fontFamily === 'nunito'
            ? "'Nunito', ui-sans-serif, system-ui, sans-serif"
            : fontFamily,
      }}
      className="w-screen h-screen overflow-hidden relative"
    >
      {/* Background Layer */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          ...(displayState.backgroundImage ? {
            backgroundImage: `url(${displayState.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
          } : {
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 25%, #7c3aed 50%, #be185d 75%, #dc2626 100%)'
          })
        }}
      />
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-black/20" />
      {/* Content Layer */}
      <div className="relative z-10 w-full h-full flex flex-col">
        <ConfettiEffect
          trigger={showConfetti}
          onComplete={() => setShowConfetti(false)}
        />
        {hasSelectedPrizes ? (
          <>
            {/* Top Header - Event Title */}
            <div className="w-full p-6 text-center">
              {displayState.eventName && (
                <div
                  className="inline-block px-6 py-2 rounded-2xl mb-4"
                  style={{ background: hexToRgba(bgColor, bgAlpha) }}
                >
                  <h1
                    style={{ color: eventNameFontColor, fontSize: `${eventNameFontSizePx}px` }}
                    className="font-bold"
                  >
                    {displayState.eventName}
                  </h1>
                </div>
              )}
            </div>
            {/* Main Content Area */}
            <div className="flex-1 flex">
              {/* Left Panel - 35% - Prize Information */}
              <div className="w-[35%] h-full p-8 flex flex-col items-center justify-center">
                <div className="space-y-6 w-full">
                  {prizeGroups.map((group, index) => (
                    <div key={group.prize.id} className="text-center">
                      <h2
                        style={{ color: prizeNameFontColor, fontSize: `${prizeNameFontSizePx}px` }}
                        className="font-bold"
                      >
                        {group.prize.name}
                      </h2>
                      <div className="flex justify-center mb-6">
                        {group.prize.image ? (
                          <img
                            src={group.prize.image}
                            alt={group.prize.name}
                            className="max-w-[50vw] max-h-[50vh] object-contain rounded-2xl shadow-2xl"
                            style={{ aspectRatio: 'auto' }}
                          />
                        ) : (
                          <div className="w-[30vw] h-[30vh] bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-2xl flex items-center justify-center">
                            <span className="text-8xl">🎁</span>
                          </div>
                        )}
                      </div>
                      <div
                        className="backdrop-blur-md rounded-2xl p-4 border border-white/50 shadow-xl"
                        style={{ background: hexToRgba(bgColor, bgAlpha) }}
                      >
                        <span
                          style={{ color: totalWinnerFontColor, fontSize: `${totalWinnerFontSizePx}px` }}
                          className="font-bold"
                        >
                          {group.prize.quantity} Pemenang
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 w-full">
                  {displayState.isGlobalDrawing && (
                    <div className="bg-red-500/30 backdrop-blur-md border border-red-400/60 text-gray-700 px-6 py-4 rounded-2xl font-bold text-xl text-center animate-pulse shadow-xl">
                      🎲 MENGUNDI... 🎲
                    </div>
                  )}
                  {displayState.currentRedrawWinnerId && (
                    <div className="bg-orange-500/30 backdrop-blur-md border border-orange-400/60 text-gray-700 px-6 py-4 rounded-2xl font-bold text-xl text-center animate-pulse shadow-xl">
                      🔄 UNDI ULANG... 🔄
                    </div>
                  )}
                </div>
              </div>
              {/* Right Panel - 65% - Winner Slots */}
              {showWinnerSlots && (
                <div className="w-[65%] h-full p-8 flex flex-col justify-center">
                  <div className="space-y-8">
                    {prizeGroups.map((group) => {
                      // Centered grid logic for winner slots
                      const maxColumns = 4;
                      const slotCount = group.slots.length;
                      const remainder = slotCount % maxColumns;
                      const dummyCount = slotCount === 0 ? 0 : remainder === 0 ? 0 : maxColumns - remainder;
                      return (
                        <div key={group.prize.id} className="space-y-4 flex flex-col justify-center h-full">
                          {/* Prize Header - Conditionally rendered */}
                          {showPrizeHeader && (
                            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/50 shadow-xl">
                              <h2 className="text-2xl font-bold text-gray-700 text-center drop-shadow-md">
                                🏆 {group.prize.name} 🏆
                              </h2>
                            </div>
                          )}
                          {/* Winner Slots for this prize */}
                          <div
                            className="grid w-full place-items-center"
                            style={{
                              gridTemplateColumns: `repeat(${Math.min(maxColumns, slotCount || 1)}, minmax(250px, 1fr))`, // <-- increased width
                              gap: "24px",
                            }}
                          >
                            {group.slots.map((slot) => {
                              const isCurrentlyRedrawing = displayState.currentRedrawWinnerId === slot.winnerId;
                              const displayNumber = getDisplayNumber(slot);
                              const isAnimating = displayState.isGlobalDrawing || isCurrentlyRedrawing;
                              const hasWinner = displayNumber !== '---';
                              return (
                                <div
                                  key={`${slot.prizeId}-${slot.winnerIndex}`}
                                  ref={(el) => {
                                    if (el && slot.winnerId) {
                                      slotRefs.current[slot.winnerId] = el;
                                    }
                                  }}
                                  className={`backdrop-blur-md p-6 rounded-2xl text-center shadow-xl border transition-all duration-500 flex flex-col items-center justify-center`}
                                  style={{
                                    background: hexToRgba(bgColor, bgAlpha),
                                    minWidth: 250, // <-- increased width
                                    minHeight: 120,
                                  }}
                                >
                                  <div className="text-sm text-gray-700/90 mb-3 font-semibold">
                                    Pemenang {slot.winnerIndex}
                                  </div>
                                  <div
                                    style={{
                                      color: fontColor,
                                      fontSize: `${fontSizePx}px`,
                                      fontFamily:
                                        fontFamily === 'sans'
                                          ? 'ui-sans-serif, system-ui, sans-serif'
                                          : fontFamily === 'serif'
                                          ? 'ui-serif, Georgia, serif'
                                          : fontFamily === 'mono'
                                          ? 'ui-monospace, SFMono-Regular, monospace'
                                          : fontFamily === 'poppins'
                                          ? "'Poppins', ui-sans-serif, system-ui, sans-serif"
                                          : fontFamily === 'roboto'
                                          ? "'Roboto', ui-sans-serif, system-ui, sans-serif"
                                          : fontFamily === 'nunito'
                                          ? "'Nunito', ui-sans-serif, system-ui, sans-serif"
                                          : fontFamily,
                                    }}
                                    className="font-bold"
                                  >
                                    {displayNumber}
                                  </div>
                                  {hasWinner && !isAnimating && (
                                    <div className="mt-4">
                                      <div className="text-sm text-green-700 font-bold animate-bounce">
                                        🎉 SELAMAT! 🎉
                                      </div>
                                    </div>
                                  )}
                                  {isAnimating && (
                                    <div className="mt-4">
                                      <div className="text-sm text-red-400 font-bold animate-pulse">
                                        {isCurrentlyRedrawing ? '🔄 Mengundi Ulang...' : '🎲 Mengundi...'}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {/* Dummy items to center the last row */}
                            {Array.from({ length: dummyCount }).map((_, idx) => (
                              <div key={`dummy-${idx}`} className="invisible" />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center bg-white/20 backdrop-blur-md rounded-3xl p-12 border border-white/50 shadow-2xl">
              <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
                🎲 Tampilan Undian 🎲
              </h1>
              <p className="text-2xl text-gray-700/90">
                Menunggu hadiah dipilih dari Panel Kontrol...
              </p>
              <div className="mt-6 animate-pulse">
                <div className="text-6xl">⏳</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
