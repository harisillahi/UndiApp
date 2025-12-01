"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { ClientOnly } from '@/components/ClientOnly';
import type { Participant } from '@/lib/utils';

export interface Prize {
  id: string;
  name: string;
  quantity: number;
  image?: string; // base64 string for PNG image
}

export interface Winner {
  id: string;
  prizeId: string;
  prizeName: string;
  participantNumber: string;
  confirmed: boolean;
  slotIndex?: number; // Position in the drawing grid
}

export interface DoorPrize {
  id: string;
  name: string;
  quantity: number;
  participants: Participant[];
  csvFileName?: string;
  winners: Winner[];
  image?: string;
}

export interface LotteryState {
  eventName: string;
  participants: Participant[]; // CSV-based participants for regular mode
  theme: 'light' | 'dark';
  backgroundImage?: string;
  prizes: Prize[];
  winners: Winner[];
  isDrawing: boolean;
  currentRedrawWinnerId: string | null; // Track which winner is being redrawn
  // NEW: Centralized drawing state
  drawingNumbers: { [winnerId: string]: string | undefined }; // Current animated numbers
  isGlobalDrawing: boolean; // Main drawing active
  selectedPrizeIds: string[]; // Currently selected prizes for drawing
  // Door Prize Mode
  mode: 'regular' | 'doorprize';
  doorPrizes: DoorPrize[];
  useDepartmentSort: boolean; // Whether to sort door prize winners by department
}

interface LotteryContextType {
  state: LotteryState;
  setEventName: (name: string) => void;
  setParticipants: (participants: Participant[]) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setBackgroundImage: (image: string) => void;
  addPrize: (prize: Omit<Prize, 'id'>) => void;
  updatePrize: (id: string, prize: Partial<Prize>) => void;
  deletePrize: (id: string) => void;
  addWinner: (winner: Omit<Winner, 'id'>) => void;
  updateWinner: (id: string, winner: Partial<Winner>) => void;
  deleteWinner: (id: string) => void;
  setIsDrawing: (drawing: boolean) => void;
  clearWinners: () => void;
  redrawWinner: (winnerId: string) => void;
  startRedraw: (winnerId: string) => void;
  stopRedraw: () => void;
  // NEW: Centralized drawing methods
  setDrawingNumbers: (numbers: { [winnerId: string]: string | undefined }) => void;
  setGlobalDrawing: (drawing: boolean) => void;
  setSelectedPrizeIds: (prizeIds: string[]) => void;
  startGlobalDrawing: (prizeIds: string[]) => void;
  stopGlobalDrawing: (finalNumbers: { [winnerId: string]: string }) => void;
  startIndividualRedraw: (winnerId: string) => void;
  stopIndividualRedraw: (winnerId: string, finalNumber: string) => void;
  createWinnersForPrizes: (prizeIds: string[]) => void;
  // Door Prize Mode
  setMode: (mode: 'regular' | 'doorprize') => void;
  addDoorPrize: (doorPrize: Omit<DoorPrize, 'id' | 'winners'>) => void;
  updateDoorPrize: (id: string, doorPrize: Partial<DoorPrize>) => void;
  deleteDoorPrize: (id: string) => void;
  startDoorPrizeDrawing: () => void;
  stopDoorPrizeDrawing: () => void;
  setUseDepartmentSort: (useDepartmentSort: boolean) => void;
}

const LotteryContext = createContext<LotteryContextType | undefined>(undefined);

const initialState: LotteryState = {
  eventName: '',
  participants: [],
  theme: 'light',
  backgroundImage: '',
  prizes: [],
  winners: [],
  isDrawing: false,
  currentRedrawWinnerId: null,
  // NEW: Initialize centralized drawing state
  drawingNumbers: {},
  isGlobalDrawing: false,
  selectedPrizeIds: [],
  // Door Prize Mode
  mode: 'regular',
  doorPrizes: [],
  useDepartmentSort: true,
};

export function LotteryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LotteryState>(initialState);
  const setParticipants = (participants: Participant[]) => {
    setState(prev => ({ ...prev, participants }));
  };
  const [isHydrated, setIsHydrated] = useState(false);
  const drawingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const redrawIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !isHydrated) return;
    const savedState = localStorage.getItem('lotteryState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // Always reset drawing states on load to prevent stuck states
        setState({
          ...parsedState,
          participants: Array.isArray(parsedState.participants) ? parsedState.participants : [],
          doorPrizes: Array.isArray(parsedState.doorPrizes) ? parsedState.doorPrizes : [],
          mode: parsedState.mode || 'regular',
          currentRedrawWinnerId: null,
          isDrawing: false,
          isGlobalDrawing: false,
          drawingNumbers: {},
        });
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
  }, [isHydrated]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined' || !isHydrated) return;
    
    localStorage.setItem('lotteryState', JSON.stringify(state));
    
    // Broadcast drawing state to display window
    const drawingState = {
      drawingNumbers: state.drawingNumbers,
      isGlobalDrawing: state.isGlobalDrawing,
      currentRedrawWinnerId: state.currentRedrawWinnerId,
      winners: state.winners,
      selectedPrizeIds: state.selectedPrizeIds,
      prizes: state.prizes,
      eventName: state.eventName,
      backgroundImage: state.backgroundImage,
      mode: state.mode,
      doorPrizes: state.doorPrizes,
    };
    
    localStorage.setItem('drawingState', JSON.stringify(drawingState));
    
    // Dispatch custom event for cross-window communication
    window.dispatchEvent(new CustomEvent('lotteryStateUpdate', { detail: state }));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'drawingState',
      newValue: JSON.stringify(drawingState)
    }));
  }, [state, isHydrated]);

  // Helper function to get participant list based on CSV, excluding already drawn winners
  const getParticipantList = (): Participant[] => {
    // Get all participants from CSV
    const allParticipants = state.participants || [];
    
    // Exclude all participantNumbers already assigned to winners (confirmed or not)
    const assigned = state.winners.map(w => w.participantNumber).filter(p => p);
    return allParticipants.filter(p => !assigned.includes(p.number));
  };

  // Helper function to start drawing animation
  const startDrawingAnimation = () => {
    console.log('Starting drawing animation for winners:', state.winners);
    if (drawingIntervalRef.current) {
      clearInterval(drawingIntervalRef.current);
    }
    const participants = getParticipantList();
    console.log('Participants for animation:', participants);
    drawingIntervalRef.current = setInterval(() => {
      const newDrawingNumbers: { [winnerId: string]: string } = {};
      state.winners.forEach(winner => {
        const randomIndex = Math.floor(Math.random() * participants.length);
        const selected = participants[randomIndex];
        newDrawingNumbers[winner.id] = selected ? `${selected.number} - ${selected.name}` : '';
      });
      setState(prev => ({
        ...prev,
        drawingNumbers: newDrawingNumbers,
      }));
    }, 100);
  };

  // Helper function to start individual redraw animation
  const startIndividualRedrawAnimation = (winnerId: string) => {
    console.log('Starting individual redraw animation for winner:', winnerId);
    if (redrawIntervalRef.current) {
      clearInterval(redrawIntervalRef.current);
    }
    const participants = getParticipantList();
    redrawIntervalRef.current = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * participants.length);
      const selected = participants[randomIndex];
      const newValue = selected ? `${selected.number} - ${selected.name}` : '';
      setState(prev => ({
        ...prev,
        drawingNumbers: {
          ...prev.drawingNumbers,
          [winnerId]: newValue,
        },
      }));
    }, 100);
  };

  const setEventName = (name: string) => {
    setState(prev => ({ ...prev, eventName: name }));
  };

  const setTheme = (theme: 'light' | 'dark') => {
    setState(prev => ({ ...prev, theme }));
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  };

  const setBackgroundImage = (image: string) => {
    setState(prev => ({ ...prev, backgroundImage: image }));
  };

  const addPrize = (prize: Omit<Prize, 'id'>) => {
    const newPrize: Prize = {
      ...prize,
      id: `prize_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    };
    setState(prev => ({ ...prev, prizes: [...prev.prizes, newPrize] }));
  };

  const updatePrize = (id: string, updatedPrize: Partial<Prize>) => {
    setState(prev => ({
      ...prev,
      prizes: prev.prizes.map(prize => 
        prize.id === id ? { ...prize, ...updatedPrize } : prize
      ),
    }));
  };

  const deletePrize = (id: string) => {
    setState(prev => ({
      ...prev,
      prizes: prev.prizes.filter(prize => prize.id !== id),
      winners: prev.winners.filter(winner => winner.prizeId !== id),
    }));
  };

  const addWinner = (winner: Omit<Winner, 'id'>) => {
    const newWinner: Winner = {
      ...winner,
      id: `winner_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    };
    setState(prev => ({ ...prev, winners: [...prev.winners, newWinner] }));
  };

  const updateWinner = (id: string, updatedWinner: Partial<Winner>) => {
    setState(prev => ({
      ...prev,
      winners: prev.winners.map(winner => 
        winner.id === id ? { ...winner, ...updatedWinner } : winner
      ),
    }));
  };

  const deleteWinner = (id: string) => {
    setState(prev => ({
      ...prev,
      winners: prev.winners.filter(winner => winner.id !== id),
    }));
  };

  const setIsDrawing = (drawing: boolean) => {
    setState(prev => ({ ...prev, isDrawing: drawing }));
  };

  const clearWinners = () => {
    // Clear all intervals
    if (drawingIntervalRef.current) {
      clearInterval(drawingIntervalRef.current);
      drawingIntervalRef.current = null;
    }
    if (redrawIntervalRef.current) {
      clearInterval(redrawIntervalRef.current);
      redrawIntervalRef.current = null;
    }

    setState(prev => ({ 
      ...prev, 
      winners: [],
      drawingNumbers: {},
      selectedPrizeIds: [],
      isGlobalDrawing: false,
      currentRedrawWinnerId: null,
    }));
  };

  const redrawWinner = (winnerId: string) => {
    setState(prev => ({
      ...prev,
      winners: prev.winners.map(winner => 
        winner.id === winnerId ? { ...winner, confirmed: false } : winner
      ),
    }));
  };

  const startRedraw = (winnerId: string) => {
    setState(prev => ({
      ...prev,
      currentRedrawWinnerId: winnerId,
    }));
  };

  const stopRedraw = () => {
    if (redrawIntervalRef.current) {
      clearInterval(redrawIntervalRef.current);
      redrawIntervalRef.current = null;
    }

    setState(prev => ({
      ...prev,
      currentRedrawWinnerId: null,
    }));
  };

  // NEW: Centralized drawing methods
  const setDrawingNumbers = (numbers: { [winnerId: string]: string | undefined }) => {
    setState(prev => ({ ...prev, drawingNumbers: numbers }));
  };

  const setGlobalDrawing = (drawing: boolean) => {
    setState(prev => ({ ...prev, isGlobalDrawing: drawing }));
  };

  const setSelectedPrizeIds = (prizeIds: string[]) => {
    setState(prev => ({ ...prev, selectedPrizeIds: prizeIds }));
  };

  const createWinnersForPrizes = (prizeIds: string[]) => {
    console.log('Creating winners for prizes:', prizeIds);
    
    const selectedPrizes = state.prizes.filter(p => prizeIds.includes(p.id));
    const newWinners: Winner[] = [];
    let slotIndex = 0;

    selectedPrizes.forEach((prize) => {
      for (let i = 0; i < prize.quantity; i++) {
        const winner: Winner = {
          id: `winner_${Date.now()}_${slotIndex}_${Math.floor(Math.random() * 10000)}`,
          prizeId: prize.id,
          prizeName: prize.name,
          participantNumber: '', // Empty initially
          confirmed: false,
          slotIndex: slotIndex,
        };
        newWinners.push(winner);
        slotIndex++;
      }
    });

    console.log('Created winners:', newWinners);

    setState(prev => ({
      ...prev,
      winners: newWinners,
      selectedPrizeIds: prizeIds,
      drawingNumbers: {}, // Reset drawing numbers
    }));
  };

  const startGlobalDrawing = (prizeIds: string[]) => {
    console.log('Starting global drawing for prizes:', prizeIds);
    
    // Create winners if they don't exist
    if (state.winners.length === 0) {
      createWinnersForPrizes(prizeIds);
    }
    
    setState(prev => ({
      ...prev,
      isGlobalDrawing: true,
      isDrawing: true,
      selectedPrizeIds: prizeIds,
    }));

    // Start animation after state update
    setTimeout(() => {
      startDrawingAnimation();
    }, 100);
  };

  const stopGlobalDrawing = (finalNumbers: { [winnerId: string]: string }) => {
    console.log('Stopping global drawing with final numbers:', finalNumbers);
    
    // Clear drawing interval
    if (drawingIntervalRef.current) {
      clearInterval(drawingIntervalRef.current);
      drawingIntervalRef.current = null;
    }

    // Update all winners with their final numbers
    setState(prev => ({
      ...prev,
      isGlobalDrawing: false,
      isDrawing: false,
      drawingNumbers: {},
      winners: prev.winners.map(winner => ({
        ...winner,
        participantNumber: finalNumbers[winner.id] || winner.participantNumber,
      })),
    }));
  };

  const startIndividualRedraw = (winnerId: string) => {
    console.log('Starting individual redraw for winner:', winnerId);
    
    setState(prev => ({
      ...prev,
      currentRedrawWinnerId: winnerId,
      winners: prev.winners.map(winner => 
        winner.id === winnerId ? { ...winner, confirmed: false } : winner
      ),
    }));

    // Start individual animation
    setTimeout(() => {
      startIndividualRedrawAnimation(winnerId);
    }, 100);
  };

  const stopIndividualRedraw = (winnerId: string, finalNumber: string) => {
    console.log('Stopping individual redraw for winner:', winnerId, 'with number:', finalNumber);
    
    // Clear redraw interval
    if (redrawIntervalRef.current) {
      clearInterval(redrawIntervalRef.current);
      redrawIntervalRef.current = null;
    }

    setState(prev => ({
      ...prev,
      currentRedrawWinnerId: null,
      drawingNumbers: {
        ...prev.drawingNumbers,
        [winnerId]: undefined, // Clear the animated number
      },
      winners: prev.winners.map(winner => 
        winner.id === winnerId 
          ? { ...winner, participantNumber: finalNumber, confirmed: false }
          : winner
      ),
    }));
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (drawingIntervalRef.current) {
        clearInterval(drawingIntervalRef.current);
      }
      if (redrawIntervalRef.current) {
        clearInterval(redrawIntervalRef.current);
      }
    };
  }, []);

  // Door Prize Mode Methods
  const setMode = (mode: 'regular' | 'doorprize') => {
    setState(prev => ({ ...prev, mode }));
  };

  const setUseDepartmentSort = (useDepartmentSort: boolean) => {
    setState(prev => ({ ...prev, useDepartmentSort }));
  };

  const addDoorPrize = (doorPrize: Omit<DoorPrize, 'id' | 'winners'>) => {
    const id = Date.now().toString();
    setState(prev => ({
      ...prev,
      doorPrizes: [...prev.doorPrizes, { ...doorPrize, id, winners: [] }],
    }));
  };

  const updateDoorPrize = (id: string, doorPrize: Partial<DoorPrize>) => {
    setState(prev => ({
      ...prev,
      doorPrizes: prev.doorPrizes.map(dp => 
        dp.id === id ? { ...dp, ...doorPrize } : dp
      ),
    }));
  };

  const deleteDoorPrize = (id: string) => {
    setState(prev => ({
      ...prev,
      doorPrizes: prev.doorPrizes.filter(dp => dp.id !== id),
    }));
  };

  const startDoorPrizeDrawing = () => {
    // Initialize empty winners for all door prizes
    const updatedDoorPrizes = state.doorPrizes.map((doorPrize) => {
      const winners: Winner[] = [];
      for (let i = 0; i < doorPrize.quantity; i++) {
        const winnerId = `${doorPrize.id}_winner_${i}`;
        winners.push({
          id: winnerId,
          prizeId: doorPrize.id,
          prizeName: doorPrize.name,
          participantNumber: '',
          confirmed: false,
          slotIndex: i,
        });
      }
      return { ...doorPrize, winners };
    });

    setState(prev => ({
      ...prev,
      isGlobalDrawing: true,
      drawingNumbers: {},
      doorPrizes: updatedDoorPrizes,
    }));

    // Start animation for all door prizes
    if (drawingIntervalRef.current) {
      clearInterval(drawingIntervalRef.current);
    }

    drawingIntervalRef.current = setInterval(() => {
      const animatedNumbers: { [winnerId: string]: string } = {};
      
      // Access current state via setState callback
      setState(prev => {
        prev.doorPrizes.forEach((doorPrize) => {
          const participants = doorPrize.participants;
          if (participants.length > 0) {
            for (let i = 0; i < doorPrize.quantity; i++) {
              const winnerId = `${doorPrize.id}_winner_${i}`;
              const randomIndex = Math.floor(Math.random() * participants.length);
              const selected = participants[randomIndex];
              animatedNumbers[winnerId] = selected ? `${selected.number} - ${selected.name}` : '';
            }
          }
        });

        return {
          ...prev,
          drawingNumbers: animatedNumbers,
        };
      });
    }, 100);
  };

  const stopDoorPrizeDrawing = () => {
    if (drawingIntervalRef.current) {
      clearInterval(drawingIntervalRef.current);
      drawingIntervalRef.current = null;
    }

    // Finalize winners for each door prize
    setState(prev => {
      // Track used participants globally across ALL prize modes to prevent duplicates
      const globalUsedParticipants = new Set<string>();
      
      // Add grand prize winners to global tracking
      prev.winners.forEach(winner => {
        if (winner.participantNumber) {
          const participantNum = winner.participantNumber.split(' - ')[0];
          globalUsedParticipants.add(participantNum);
        }
      });
      
      const updatedDoorPrizes = prev.doorPrizes.map((doorPrize) => {
        const participants = doorPrize.participants;
        
        // Separate targeted and non-targeted participants
        const targetedParticipants = participants.filter(p => p.targetDP === true && !globalUsedParticipants.has(p.number));
        const nonTargetedParticipants = participants.filter(p => !p.targetDP && !globalUsedParticipants.has(p.number));
        
        const usedParticipants = new Set<string>();
        
        // Get unique departments from all participants
        const departments = Array.from(new Set(
          participants
            .map(p => p.department)
            .filter(d => d !== undefined && d !== '')
        )) as string[];
        
        const hasDepartments = departments.length > 0;
        const totalWinners = doorPrize.quantity;
        
        // Phase 1: Assign all targeted participants first (override department rules)
        const targetedWinners: Participant[] = [];
        targetedParticipants.forEach(target => {
          if (targetedWinners.length < totalWinners && !usedParticipants.has(target.number)) {
            targetedWinners.push(target);
            usedParticipants.add(target.number);
            globalUsedParticipants.add(target.number);
          }
        });
        
        // Phase 2: Ensure at least 1 winner per department (if departments exist and department sort is enabled)
        const departmentWinners: Participant[] = [];
        if (prev.useDepartmentSort && hasDepartments) {
          departments.forEach(dept => {
            if (targetedWinners.length + departmentWinners.length >= totalWinners) return;
            
            // Skip if this department already has a targeted winner
            const hasTargetedInDept = targetedWinners.some(t => t.department === dept);
            if (hasTargetedInDept) return;
            
            // Find available participant from this department
            const deptParticipants = nonTargetedParticipants.filter(
              p => p.department === dept && !usedParticipants.has(p.number)
            );
            
            if (deptParticipants.length > 0) {
              const randomIndex = Math.floor(Math.random() * deptParticipants.length);
              const selected = deptParticipants[randomIndex];
              departmentWinners.push(selected);
              usedParticipants.add(selected.number);
              globalUsedParticipants.add(selected.number);
            }
          });
        }
        
        // Phase 3: Fill remaining slots with any available participants
        const remainingSlots = totalWinners - targetedWinners.length - departmentWinners.length;
        const remainingWinners: Participant[] = [];
        
        if (remainingSlots > 0) {
          const available = nonTargetedParticipants.filter(p => !usedParticipants.has(p.number));
          
          for (let i = 0; i < remainingSlots && available.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * available.length);
            const selected = available[randomIndex];
            remainingWinners.push(selected);
            usedParticipants.add(selected.number);
            globalUsedParticipants.add(selected.number);
            available.splice(randomIndex, 1);
          }
        }
        
        // Combine all winners: targeted first, then shuffle department + remaining winners
        const nonTargetedWinners = [...departmentWinners, ...remainingWinners];
        
        // Shuffle non-targeted winners to make distribution more natural
        for (let i = nonTargetedWinners.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [nonTargetedWinners[i], nonTargetedWinners[j]] = [nonTargetedWinners[j], nonTargetedWinners[i]];
        }
        
        const allWinners = [...targetedWinners, ...nonTargetedWinners];
        
        // Create Winner objects
        const winners: Winner[] = allWinners.map((selected, i) => {
          const winnerId = `${doorPrize.id}_winner_${i}`;
          return {
            id: winnerId,
            prizeId: doorPrize.id,
            prizeName: doorPrize.name,
            participantNumber: `${selected.number} - ${selected.name}`,
            confirmed: false,
            slotIndex: i,
          };
        });

        return { ...doorPrize, winners };
      });

      return {
        ...prev,
        isGlobalDrawing: false,
        drawingNumbers: {},
        doorPrizes: updatedDoorPrizes,
      };
    });
  };

  const contextValue: LotteryContextType = {
    state,
    setEventName,
    setParticipants,
    setTheme,
    setBackgroundImage,
    addPrize,
    updatePrize,
    deletePrize,
    addWinner,
    updateWinner,
    deleteWinner,
    setIsDrawing,
    clearWinners,
    redrawWinner,
    startRedraw,
    stopRedraw,
    // NEW: Centralized drawing methods
    setDrawingNumbers,
    setGlobalDrawing,
    setSelectedPrizeIds,
    startGlobalDrawing,
    stopGlobalDrawing,
    startIndividualRedraw,
    stopIndividualRedraw,
    createWinnersForPrizes,
    // Door Prize Mode
    setMode,
    addDoorPrize,
    updateDoorPrize,
    deleteDoorPrize,
    startDoorPrizeDrawing,
    stopDoorPrizeDrawing,
    setUseDepartmentSort,
  };

  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      <LotteryContext.Provider value={contextValue}>
        {children}
      </LotteryContext.Provider>
    </ClientOnly>
  );
}

export function useLottery() {
  const context = useContext(LotteryContext);
  if (context === undefined) {
    throw new Error('useLottery must be used within a LotteryProvider');
  }
  return context;
}
