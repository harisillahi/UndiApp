"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { ClientOnly } from '@/components/ClientOnly';

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

export interface LotteryState {
  eventName: string;
  participantRange: string;
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
  drawMode: 'number' | 'name';
  participantNames: string;
}

interface LotteryContextType {
  state: LotteryState;
  setEventName: (name: string) => void;
  setParticipantRange: (range: string) => void;
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
  setDrawMode: (mode: 'number' | 'name') => void;
  setParticipantNames: (names: string) => void;
}

const LotteryContext = createContext<LotteryContextType | undefined>(undefined);

const initialState: LotteryState = {
  eventName: '',
  participantRange: '',
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
  // Add drawMode and participantNames for name animation
  drawMode: 'number',
  participantNames: '',
};

export function LotteryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LotteryState>(initialState);
  // Add setters for drawMode and participantNames
  const setDrawMode = (mode: 'number' | 'name') => {
    setState(prev => ({ ...prev, drawMode: mode }));
  };
  const setParticipantNames = (names: string) => {
    setState(prev => ({ ...prev, participantNames: names }));
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
          participantNames: typeof parsedState.participantNames === 'string' ? parsedState.participantNames : '',
          drawMode: parsedState.drawMode || 'number',
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
    };
    
    localStorage.setItem('drawingState', JSON.stringify(drawingState));
    
    // Dispatch custom event for cross-window communication
    window.dispatchEvent(new CustomEvent('lotteryStateUpdate', { detail: state }));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'drawingState',
      newValue: JSON.stringify(drawingState)
    }));
  }, [state, isHydrated]);

  // Helper function to parse participant range
  const parseParticipantRange = (range: string): number[] => {
    if (!range || range.trim() === '') {
      const defaultRange = [];
      for (let i = 1; i <= 100; i++) {
        defaultRange.push(i);
      }
      return defaultRange;
    }
    
    // Handle range format like "100-150"
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(num => parseInt(num.trim()));
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        const numbers = [];
        for (let i = start; i <= end; i++) {
          numbers.push(i);
        }
        return numbers;
      }
    }
    
    // Handle comma-separated format like "1,5,10,25"
    if (range.includes(',')) {
      const numbers = range.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num));
      return numbers;
    }
    
    // Single number - create range from 1 to that number
    const num = parseInt(range.trim());
    if (!isNaN(num) && num > 0) {
      const numbers = [];
      for (let i = 1; i <= num; i++) {
        numbers.push(i);
      }
      return numbers;
    }
    
    // Fallback to default range
    const fallbackRange = [];
    for (let i = 1; i <= 100; i++) {
      fallbackRange.push(i);
    }
    return fallbackRange;
  };

  // Helper function to get participant list based on mode, excluding already drawn winners
  const getParticipantList = (): string[] => {
    let allParticipants: string[];
    if (state.drawMode === 'name') {
      allParticipants = state.participantNames
        .split('\n')
        .map((name: string) => name.trim())
        .filter((name: string) => name.length > 0);
    } else {
      // Number mode: use range
      if (!state.participantRange || state.participantRange.trim() === '') {
        allParticipants = Array.from({ length: 100 }, (_, i) => (i + 1).toString());
      } else if (state.participantRange.includes('-')) {
        const [start, end] = state.participantRange.split('-').map((num: string) => parseInt(num.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          allParticipants = Array.from({ length: end - start + 1 }, (_, i) => (start + i).toString());
        } else {
          allParticipants = [];
        }
      } else if (state.participantRange.includes(',')) {
        allParticipants = state.participantRange.split(',').map((num: string) => num.trim()).filter((num: string) => num.length > 0);
      } else {
        const num = parseInt(state.participantRange.trim());
        if (!isNaN(num) && num > 0) {
          allParticipants = Array.from({ length: num }, (_, i) => (i + 1).toString());
        } else {
          allParticipants = [];
        }
      }
    }
    // Exclude all participantNumbers already assigned to winners (confirmed or not)
    const assigned = state.winners.map(w => w.participantNumber).filter(p => p);
    return allParticipants.filter(p => !assigned.includes(p));
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
        newDrawingNumbers[winner.id] = selected ? selected.toString() : '';
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
      const newValue = selected ? selected.toString() : '';
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

  const setParticipantRange = (range: string) => {
    setState(prev => ({ ...prev, participantRange: range }));
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

  const contextValue: LotteryContextType = {
    state,
    setEventName,
    setParticipantRange,
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
    setDrawMode,
    setParticipantNames,
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
