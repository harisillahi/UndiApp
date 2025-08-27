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
  const showPrizeHeader = false; // Set to true to enable the prize header
  const showWinnerSlots = true; // <-- Add this flag

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
  const [completedWinners, setCompletedWinners] = useState<Set<string>>(new Set());
  const slotRefs = useRef<{ [winnerId: string]: HTMLDivElement | null }>({});

  // Listen for state changes from main page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'drawingState' && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          console.log('Drawing window received state update:', newState);
          
          const prevState = displayState;
          setDisplayState(newState);
          
          // Check for newly completed winners (global drawing finished)
          if (prevState.isGlobalDrawing && !newState.isGlobalDrawing && newState.winners.length > 0) {
            console.log('Global drawing completed, triggering confetti for all winners');
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
            
            // Trigger individual confetti for each winner slot after a short delay
            setTimeout(() => {
              newState.winners.forEach((winner: any, index: number) => {
                if (winner.participantNumber && slotRefs.current[winner.id]) {
                  setTimeout(() => {
                    createElementConfetti(slotRefs.current[winner.id]!);
                  }, index * 200); // Stagger the confetti
                }
              });
            }, 500);
          }
          
          // Check for individual redraw completion
          if (prevState.currentRedrawWinnerId && !newState.currentRedrawWinnerId) {
            const redrawWinnerId = prevState.currentRedrawWinnerId;
            const winner = newState.winners.find((w: any) => w.id === redrawWinnerId);
            
            if (winner && winner.participantNumber && slotRefs.current[redrawWinnerId]) {
              console.log('Individual redraw completed for winner:', redrawWinnerId);
              setTimeout(() => {
                createElementConfetti(slotRefs.current[redrawWinnerId]!);
              }, 300);
            }
          }
          
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

    // Listen for updates
    window.addEventListener('storage', handleStorageChange);
    
    // Poll for updates every 100ms as backup
    const pollInterval = setInterval(() => {
      const currentState = localStorage.getItem('drawingState');
      if (currentState) {
        try {
          const parsedState = JSON.parse(currentState);
          setDisplayState(prev => {
            // Only update if there are actual changes to prevent unnecessary re-renders
            if (JSON.stringify(prev) !== currentState) {
              return parsedState;
            }
            return prev;
          });
        } catch (error) {
          // Ignore parsing errors during polling
        }
      }
    }, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [displayState.isGlobalDrawing, displayState.currentRedrawWinnerId]);

  // Create winner slots with prize information
  const createWinnerSlots = (): WinnerSlot[] => {
    const slots: WinnerSlot[] = [];
    let slotIndex = 0;
    
    if (!displayState.prizes || !displayState.selectedPrizeIds) {
      return slots;
    }
    
    const selectedPrizes = displayState.prizes.filter(p => displayState.selectedPrizeIds.includes(p.id));
    
    selectedPrizes.forEach((prize) => {
      for (let i = 0; i < prize.quantity; i++) {
        const winner = displayState.winners?.find(w => w.prizeId === prize.id && w.slotIndex === slotIndex);
        
        slots.push({
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
    
    return slots;
  };

  // Get display number for a winner slot
  const getDisplayNumber = (slot: WinnerSlot): string => {
    const winner = displayState.winners?.find(w => w.id === slot.winnerId);
    
    // If there's an animated number, show it
    const animatedNumber = displayState.drawingNumbers?.[slot.winnerId];
    if (animatedNumber) {
      return animatedNumber;
    }
    
    // Otherwise show the actual participant number or placeholder
    return winner?.participantNumber || '---';
  };

  // Group winner slots by prize
  const groupSlotsByPrize = () => {
    const winnerSlots = createWinnerSlots();
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

  const prizeGroups = groupSlotsByPrize();
  const hasSelectedPrizes = displayState.selectedPrizeIds && displayState.selectedPrizeIds.length > 0;
  const isDrawing = displayState.isGlobalDrawing || displayState.currentRedrawWinnerId !== null;

  return (
    <div className="w-screen h-screen overflow-hidden relative">
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
                <h1 className="text-4xl md:text-6xl font-bold text-gray-700 mb-2 drop-shadow-lg">
                  {displayState.eventName}
                </h1>
              )}
              <p className="text-xl text-gray-700/90 font-medium">
                
              </p>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex">
              {/* Left Panel - 35% - Prize Information */}
              <div className="w-[35%] h-full p-8 flex flex-col items-center justify-center">
                {/* Prize Display */}
                <div className="space-y-6 w-full">
                  {prizeGroups.map((group, index) => (
                    <div key={group.prize.id} className="text-center">
                      {/* Prize Name - Centered */}
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-700 mb-6 drop-shadow-lg text-center">
                        {group.prize.name}
                      </h2>
                      
                      {/* Prize Image - 30% of window size */}
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

                      {/* Prize Info */}
                      <div className="bg-white/30 backdrop-blur-md rounded-2xl p-4 border border-white/50 shadow-xl">
                        <span className="text-2xl font-bold text-gray-700">
                          {group.prize.quantity} Pemenang
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status Indicators */}
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
              {showWinnerSlots && ( // <-- Wrap the right panel in this conditional
                <div className="w-[65%] h-full p-8 overflow-y-auto">
                  <div className="space-y-8">
                    {prizeGroups.map((group) => (
                      <div key={group.prize.id} className="space-y-4">
                        {/* Prize Header - Conditionally rendered */}
                        {showPrizeHeader && (
                          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/50 shadow-xl">
                            <h2 className="text-2xl font-bold text-gray-700 text-center drop-shadow-md">
                              🏆 {group.prize.name} 🏆
                            </h2>
                          </div>
                        )}

                        {/* Winner Slots for this prize */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                className={`bg-white/50 backdrop-blur-md p-6 rounded-2xl text-center shadow-xl border transition-all duration-500 ${
                                  isCurrentlyRedrawing 
                                    ? 'ring-4 ring-red-400/60 scale-105 border-red-400/70 bg-red-500/30' 
                                    : hasWinner && !isAnimating 
                                      ? 'ring-2 ring-green-900/60 border-green-400/70 bg-green-500/30' 
                                      : 'border-white/50 hover:bg-white/30'
                                }`}
                              >
                                {/* Winner Index */}
                                <div className="text-sm text-gray-700/90 mb-3 font-semibold">
                                  Pemenang {slot.winnerIndex}
                                </div>
                                
                                {/* Winner Number */}
                                <div className={`text-5xl md:text-6xl font-mono font-bold transition-all duration-300 drop-shadow-lg ${
                                  isAnimating 
                                    ? 'text-red-400 animate-pulse scale-110' 
                                    : hasWinner 
                                      ? 'text-green-700 scale-110' 
                                      : 'text-white/60'
                                }`}>
                                  {displayNumber}
                                </div>
                                
                                {/* Winner celebration indicator */}
                                {hasWinner && !isAnimating && (
                                  <div className="mt-4">
                                    <div className="text-sm text-green-700 font-bold animate-bounce">
                                      🎉 SELAMAT! 🎉
                                    </div>
                                  </div>
                                )}

                                {/* Animation indicator */}
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
                        </div>
                      </div>
                    ))}
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

        {/* Debug Info */}
        {/*}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white p-4 rounded-xl text-xs max-w-md max-h-64 overflow-y-auto border border-white/50 shadow-xl">
          <div className="font-bold mb-2 text-green-700">🖥️ Tampilan Undian (Mirror Mode):</div>
          <div className="space-y-1 text-white/90">
            <div>Selected Prizes: {displayState.selectedPrizeIds?.length || 0}</div>
            <div>Winners: {displayState.winners?.length || 0}</div>
            <div>Is Global Drawing: {displayState.isGlobalDrawing ? 'Yes' : 'No'}</div>
            <div>Current Redraw: {displayState.currentRedrawWinnerId || 'None'}</div>
            <div>Drawing Numbers: {displayState.drawingNumbers ? Object.keys(displayState.drawingNumbers).length : 0}</div>
            <div>Event Name: {displayState.eventName || 'Not set'}</div>
            <div>Slot Refs: {Object.keys(slotRefs.current).length}</div>
            <div className="mt-2 text-green-700 font-semibold">
              ✓ Modern layout with enhanced readability
            </div>
          </div>
        </div>
        */}
      </div>
    </div>
  );
}
