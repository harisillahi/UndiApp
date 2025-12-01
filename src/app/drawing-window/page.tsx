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
  mode?: 'regular' | 'doorprize';
  doorPrizes?: any[];
  viewMode?: 'grid' | 'list';
  participants?: any[];
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
    mode: 'regular',
    doorPrizes: [],
    viewMode: 'grid',
    participants: [],
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

  // Helper function to parse participant info from winner
  const getParticipantInfo = (slot: WinnerSlot): { displayText: string; group: string } => {
    const winner = displayState.winners?.find(w => w.id === slot.winnerId);
    const animatedValue = displayState.drawingNumbers?.[slot.winnerId];
    
    if (animatedValue) {
      return { displayText: animatedValue, group: '' };
    }
    
    if (winner?.participantNumber) {
      const displayText = winner.participantNumber;
      
      // Try to find participant in participants array to get group info
      let group = '';
      if (displayState.participants && displayState.participants.length > 0) {
        // participantNumber can be "number - name" or just "name"
        const parts = winner.participantNumber.split(' - ');
        
        // Debug logging
        console.log('Looking for participant:', winner.participantNumber);
        console.log('Parts:', parts);
        console.log('Sample participant:', displayState.participants[0]);
        
        // Try to find by number first (if it exists)
        let participant = null;
        if (parts.length > 1) {
          // Format is "number - name"
          const number = parts[0].trim();
          const name = parts[1].trim();
          participant = displayState.participants.find((p: any) => 
            p.number?.toString().trim() === number || p.name?.trim() === name
          );
        } else {
          // Format is just "name"
          const name = parts[0].trim();
          participant = displayState.participants.find((p: any) => 
            p.name?.trim() === name
          );
        }
        
        console.log('Found participant:', participant);
        
        if (participant?.department) {
          group = participant.department;
        }
      } else {
        console.log('No participants data available:', displayState.participants);
      }
      
      return { displayText, group };
    }
    
    return { displayText: '---', group: '' };
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
  const isDoorPrizeMode = displayState.mode === 'doorprize';
  const hasDoorPrizes = isDoorPrizeMode && displayState.doorPrizes && displayState.doorPrizes.length > 0;

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
        {/* DOOR PRIZE MODE */}
        {isDoorPrizeMode && hasDoorPrizes ? (
          <>
            {/* Top Header - Event Title */}
            <div className="w-full p-6 text-center">
              {displayState.eventName && (
                <div
                  className="inline-block px-6 py-2 rounded-2xl mb-4 backdrop-blur-md border border-white/50 shadow-xl"
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
            {/* Door Prize Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 items-start">
                {(displayState.doorPrizes || []).map((doorPrize: any) => {
                  const prizeCount = displayState.doorPrizes?.length || 1;
                  const isManPrizes = prizeCount > 3;
                  return (
                  <div key={doorPrize.id} className="flex flex-col gap-2 sm:gap-3 md:gap-4" style={{ width: 'calc(33.333% - 0.67rem)', minWidth: isManPrizes ? '280px' : '300px', flexGrow: prizeCount <= 3 ? 1 : 0 }}>
                    {/* Prize Info - Top */}
                    <div className="flex flex-col items-center">
                      <div
                        className="inline-block px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl mb-2 sm:mb-3 md:mb-4 backdrop-blur-md border border-white/50 shadow-xl"
                        style={{ background: hexToRgba(bgColor, bgAlpha) }}
                      >
                        <h2
                          style={{ color: prizeNameFontColor, fontSize: `${Math.max(14, parseFloat(prizeNameFontSizePx) * (isManPrizes ? 0.7 : 1))}px` }}
                          className="font-bold text-center leading-tight"
                        >
                          {doorPrize.name}
                        </h2>
                      </div>
                      <div className="flex justify-center mb-2 sm:mb-3 md:mb-4">
                        {doorPrize.image ? (
                          <img
                            src={doorPrize.image}
                            alt={doorPrize.name}
                            className={`${isManPrizes ? 'w-25 h-25 sm:w-30 sm:h-30 md:w-35 md:h-35' : 'w-30 h-30 sm:w-40 sm:h-40 md:w-50 md:h-50'} object-contain rounded-xl sm:rounded-2xl shadow-2xl`}
                          />
                        ) : (
                          <div className={`${isManPrizes ? 'w-25 h-25 sm:w-30 sm:h-30 md:w-35 md:h-35' : 'w-30 h-30 sm:w-40 sm:h-40 md:w-50 md:h-50'} bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl sm:rounded-2xl shadow-2xl flex items-center justify-center`}>
                            <span className={`${isManPrizes ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-3xl sm:text-4xl md:text-5xl'}`}>🎁</span>
                          </div>
                        )}
                      </div>
                      <div
                        className="backdrop-blur-md rounded-xl sm:rounded-2xl px-2 sm:px-3 py-1.5 sm:py-2 md:py-3 border border-white/50 shadow-xl"
                        style={{ background: hexToRgba(bgColor, bgAlpha) }}
                      >
                        <span
                          style={{ color: totalWinnerFontColor, fontSize: `${Math.max(12, parseFloat(totalWinnerFontSizePx) * (isManPrizes ? 0.6 : 0.8))}px` }}
                          className="font-bold"
                        >
                          {doorPrize.quantity} Pemenang
                        </span>
                      </div>
                    </div>
                    {/* Winner Slots - Bottom */}
                    <div className="flex-1 flex flex-col justify-center">
                      {/* Use compact list if 3+ winners, otherwise use cards */}
                      {doorPrize.quantity >= 3 ? (
                        <div className="w-full">
                          <div className="backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-2" style={{ background: hexToRgba(bgColor, bgAlpha) }}>
                            <div className="space-y-1.5">
                              {Array.from({ length: doorPrize.quantity }).map((_, idx) => {
                                const winner = doorPrize.winners && doorPrize.winners[idx];
                                const winnerId = winner?.id || `${doorPrize.id}-slot-${idx}`;
                                const animatedValue = displayState.drawingNumbers?.[winnerId];
                                const displayNumber = animatedValue || (winner?.participantNumber ? `${winner.participantNumber}` : '---');
                                const hasWinner = winner?.participantNumber && !animatedValue;
                                const isAnimating = !!animatedValue;
                                
                                // Extract name, number and department from winner data
                                let name = '---';
                                let participantNumber = '';
                                let department = '';
                                if (winner?.participantNumber && doorPrize.participants) {
                                  const parts = winner.participantNumber.split(' - ');
                                  // If format is "number - name", parts[0] is number and parts[1] is name
                                  // If format is just "name", parts[0] is name
                                  if (parts.length > 1 && parts[0].trim() !== '') {
                                    // Has number column
                                    participantNumber = parts[0];
                                    name = parts[1] || participantNumber;
                                  } else {
                                    // No number column, just name
                                    name = parts[0] || winner.participantNumber;
                                    participantNumber = '';
                                  }
                                  
                                  // Find participant by number or name to get department
                                  const participant = doorPrize.participants.find((p: any) => 
                                    participantNumber ? p.number === participantNumber : p.name === name
                                  );
                                  department = participant?.department || '';
                                }
                                
                                return (
                                  <div
                                    key={`${doorPrize.id}-${idx}`}
                                    ref={(el) => {
                                      if (el && winnerId) {
                                        slotRefs.current[winnerId] = el;
                                      }
                                    }}
                                    className="group relative flex items-center gap-2 py-1.5 px-2 rounded-lg border border-white/40 bg-white/5 hover:bg-white/10 transition-all"
                                  >
                                    <div
                                      style={{
                                        color: fontColor,
                                        fontSize: `${parseFloat(fontSizePx) * 0.35}px`,
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
                                      className="font-bold whitespace-nowrap text-xs"
                                    >
                                      {idx + 1}.
                                    </div>
                                    <div
                                      style={{
                                        color: fontColor,
                                        fontSize: `${parseFloat(fontSizePx) * 0.45}px`,
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
                                      className="font-bold flex-1 min-w-0 truncate text-sm"
                                    >
                                      {isAnimating ? displayNumber : (
                                        <>
                                          {name}
                                          {participantNumber && ` - ${participantNumber}`}
                                          {department && (
                                            <span className="opacity-75"> ({department})</span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                    {isAnimating && (
                                      <div className="text-sm animate-pulse shrink-0">🎲</div>
                                    )}
                                    {/* Tooltip on hover */}
                                    {displayNumber !== '---' && (
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                        {displayNumber}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                          <div className="border-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4 items-center">
                        {Array.from({ length: doorPrize.quantity }).map((_, idx) => {
                          const winner = doorPrize.winners && doorPrize.winners[idx];
                          const winnerId = winner?.id || `${doorPrize.id}-slot-${idx}`;
                          const animatedValue = displayState.drawingNumbers?.[winnerId];
                          const displayNumber = animatedValue || (winner?.participantNumber ? `${winner.participantNumber}` : '---');
                          const hasWinner = winner?.participantNumber && !animatedValue;
                          const isAnimating = !!animatedValue;
                          
                          // Extract name, number and department from winner data
                          let name = '---';
                          let participantNumber = '';
                          let department = '';
                          if (winner?.participantNumber && doorPrize.participants) {
                            const parts = winner.participantNumber.split(' - ');
                            // If format is "number - name", parts[0] is number and parts[1] is name
                            // If format is just "name", parts[0] is name
                            if (parts.length > 1 && parts[0].trim() !== '') {
                              // Has number column
                              participantNumber = parts[0];
                              name = parts[1] || participantNumber;
                            } else {
                              // No number column, just name
                              name = parts[0] || winner.participantNumber;
                              participantNumber = '';
                            }
                            
                            // Find participant by number or name to get department
                            const participant = doorPrize.participants.find((p: any) => 
                              participantNumber ? p.number === participantNumber : p.name === name
                            );
                            department = participant?.department || '';
                          }
                          
                          return (
                            <div
                              key={`${doorPrize.id}-${idx}`}
                              ref={(el) => {
                                if (el && winnerId) {
                                  slotRefs.current[winnerId] = el;
                                }
                              }}
                              className="backdrop-blur-md p-3 md:p-4 rounded-2xl text-center shadow-xl border transition-all duration-500 flex flex-col items-center justify-center group relative w-full"
                              style={{
                                background: hexToRgba(bgColor, bgAlpha),
                                minHeight: 80,
                              }}
                            >
                              {/* Tooltip on hover */}
                              {displayNumber !== '---' && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                  {displayNumber}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                    <div className="border-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                </div>
                              )}
                              <div className="text-xs mb-2 font-semibold" style={{ color: fontColor }}>
                                Pemenang {idx + 1}
                              </div>
                              <div
                                style={{
                                  color: fontColor,
                                  fontSize: `${parseFloat(fontSizePx) * 0.6}px`,
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
                                className="font-bold overflow-hidden text-ellipsis whitespace-nowrap w-full px-2"
                              >
                                {isAnimating ? displayNumber : (
                                  <>
                                    {name}
                                    {participantNumber && ` - ${participantNumber}`}
                                  </>
                                )}
                              </div>
                              {!isAnimating && department && (
                                <div
                                  style={{
                                    color: fontColor,
                                    fontSize: `${parseFloat(fontSizePx) * 0.35}px`,
                                  }}
                                  className="text-center opacity-75 mt-1"
                                >
                                  {department}
                                </div>
                              )}
                              {isAnimating && (
                                <div className="mt-2">
                                  <div className="text-xs font-bold animate-pulse" style={{ color: fontColor }}>
                                    🎲 Mengundi...
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
              {displayState.isGlobalDrawing && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-red-500/30 backdrop-blur-md border border-red-400/60 px-8 py-4 rounded-2xl font-bold text-2xl text-center animate-pulse shadow-xl" style={{ color: fontColor }}>
                  MENGUNDI SEMUA DOOR PRIZE...
                </div>
              )}
            </div>
          </>
        ) : /* REGULAR MODE */ hasSelectedPrizes ? (
          <>
            {/* Top Header - Event Title */}
            <div className="w-full p-6 text-center">
              {displayState.eventName && (
                <div
                  className="inline-block px-6 py-2 rounded-2xl mb-4 backdrop-blur-md border border-white/50 shadow-xl"
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
            <div className="flex-1 flex flex-col lg:flex-row overflow-auto">
              {/* Left Panel - Prize Information */}
              <div className="w-full lg:w-[35%] p-4 md:p-8 flex flex-col items-center justify-center">
                <div className="space-y-6 w-full">
                  {prizeGroups.map((group, index) => (
                    <div key={group.prize.id} className="text-center">
                      <div
                        className="inline-block px-6 py-2 rounded-2xl mb-4 backdrop-blur-md border border-white/50 shadow-xl"
                        style={{ background: hexToRgba(bgColor, bgAlpha) }}
                      >
                        <h2
                          style={{ color: prizeNameFontColor, fontSize: `clamp(18px, ${prizeNameFontSizePx}px, ${prizeNameFontSizePx}px)` }}
                          className="font-bold leading-tight"
                        >
                          {group.prize.name}
                        </h2>
                      </div>
                      <div className="flex justify-center mb-4 sm:mb-6">
                        {group.prize.image ? (
                          <img
                            src={group.prize.image}
                            alt={group.prize.name}
                            className="w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 max-w-[40vw] max-h-[30vh] object-contain rounded-2xl shadow-2xl"
                          />
                        ) : (
                          <div className="w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 max-w-[40vw] max-h-[30vh] bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-2xl flex items-center justify-center">
                            <span className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl">🎁</span>
                          </div>
                        )}
                      </div>
                      <div
                        className="backdrop-blur-md rounded-2xl px-3 py-2 sm:p-4 border border-white/50 shadow-xl"
                        style={{ background: hexToRgba(bgColor, bgAlpha) }}
                      >
                        <span
                          style={{ color: totalWinnerFontColor, fontSize: `clamp(16px, ${totalWinnerFontSizePx}px, ${totalWinnerFontSizePx}px)` }}
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
                    <div className="bg-red-500/30 backdrop-blur-md border border-red-400/60 px-6 py-4 rounded-2xl font-bold text-xl text-center animate-pulse shadow-xl" style={{ color: fontColor }}>
                      MENGUNDI...
                    </div>
                  )}
                  {displayState.currentRedrawWinnerId && (
                    <div className="bg-orange-500/30 backdrop-blur-md border border-orange-400/60 px-6 py-4 rounded-2xl font-bold text-xl text-center animate-pulse shadow-xl" style={{ color: fontColor }}>
                      UNDI ULANG...
                    </div>
                  )}
                </div>
              </div>
              {/* Right Panel - Winner Slots */}
              {showWinnerSlots && (
                <div className="w-full lg:w-[65%] p-4 md:p-8 flex flex-col justify-center">
                  <div className="space-y-8">
                    {prizeGroups.map((group) => {
                      // Centered grid logic for winner slots
                      const maxColumns = 3;
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
                          {/* Winner Slots for this prize - Grid or List View */}
                          {displayState.viewMode === 'list' ? (
                            /* List View */
                            <div className="backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-4" style={{ background: hexToRgba(bgColor, bgAlpha) }}>
                              <div className="space-y-2">
                                {group.slots.map((slot) => {
                                  const isCurrentlyRedrawing = displayState.currentRedrawWinnerId === slot.winnerId;
                                  const displayNumber = getDisplayNumber(slot);
                                  const participantInfo = getParticipantInfo(slot);
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
                                      className="flex items-center gap-4 py-3 px-4 rounded-lg border border-white/40 bg-white/5 hover:bg-white/10 transition-all"
                                    >
                                      <div
                                        style={{
                                          color: fontColor,
                                          fontSize: `${parseFloat(fontSizePx) * 0.4}px`,
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
                                        className="font-bold whitespace-nowrap"
                                      >
                                        {slot.winnerIndex}.
                                      </div>
                                      <div
                                        style={{
                                          color: fontColor,
                                          fontSize: `${parseFloat(fontSizePx) * 0.6}px`,
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
                                        className="font-bold flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
                                      >
                                        {isAnimating ? displayNumber : (
                                          <>
                                            {displayNumber}
                                            {participantInfo.group && (
                                              <span className="opacity-75 ml-2">({participantInfo.group})</span>
                                            )}
                                          </>
                                        )}
                                      </div>
                                      {hasWinner && !isAnimating && (
                                        <div className="text-sm font-bold" style={{ color: fontColor }}>
                                          🎉
                                        </div>
                                      )}
                                      {isAnimating && (
                                        <div className="text-sm font-bold animate-pulse" style={{ color: fontColor }}>
                                          {isCurrentlyRedrawing ? '🔄' : '🎲'}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            /* Grid View */
                            <div className="grid w-full gap-4 place-items-center grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                              {group.slots.map((slot) => {
                                const isCurrentlyRedrawing = displayState.currentRedrawWinnerId === slot.winnerId;
                                const displayNumber = getDisplayNumber(slot);
                                const participantInfo = getParticipantInfo(slot);
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
                                    className={`backdrop-blur-md p-3 sm:p-4 md:p-6 rounded-2xl text-center shadow-xl border transition-all duration-500 flex flex-col items-center justify-center group relative w-full`}
                                    style={{
                                      background: hexToRgba(bgColor, bgAlpha),
                                      minHeight: "clamp(80px, 15vh, 120px)",
                                    }}
                                  >
                                    {/* Tooltip on hover */}
                                    {displayNumber !== '---' && (
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                        {displayNumber}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                          <div className="border-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                      </div>
                                    )}
                                    <div className="text-sm mb-3 font-semibold" style={{ color: fontColor }}>
                                      Pemenang {slot.winnerIndex}
                                    </div>
                                    <div
                                      style={{
                                        color: fontColor,
                                        fontSize: `${parseFloat(fontSizePx) * 0.7}px`,
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
                                      className="font-bold overflow-hidden text-ellipsis whitespace-nowrap w-full px-2"
                                    >
                                      {displayNumber}
                                    </div>
                                    {!isAnimating && participantInfo.group && (
                                      <div
                                        style={{
                                          color: fontColor,
                                          fontSize: `${parseFloat(fontSizePx) * 0.4}px`,
                                        }}
                                        className="text-center opacity-75 mt-1"
                                      >
                                        {participantInfo.group}
                                      </div>
                                    )}
                                    {hasWinner && !isAnimating && (
                                      <div className="mt-4">
                                        <div className="text-sm font-bold animate-bounce" style={{ color: fontColor }}>
                                          🎉 SELAMAT! 🎉
                                        </div>
                                      </div>
                                    )}
                                    {isAnimating && (
                                      <div className="mt-4">
                                        <div className="text-sm font-bold animate-pulse" style={{ color: fontColor }}>
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
                          )}
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
                Tampilan Undian
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
