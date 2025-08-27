"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
};

export function LotteryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LotteryState>(initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedState = localStorage.getItem('lotteryState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // Always reset drawing states on load to prevent stuck states
        setState({
          ...parsedState,
          currentRedrawWinnerId: null,
          isDrawing: false,
          isGlobalDrawing: false,
          drawingNumbers: {},
        });
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
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
  }, [state]);

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
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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
          id: `winner_${Date.now()}_${slotIndex}_${Math.random().toString(36).substr(2, 5)}`,
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
  };

  const stopGlobalDrawing = (finalNumbers: { [winnerId: string]: string }) => {
    console.log('Stopping global drawing with final numbers:', finalNumbers);
    
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
  };

  const stopIndividualRedraw = (winnerId: string, finalNumber: string) => {
    console.log('Stopping individual redraw for winner:', winnerId, 'with number:', finalNumber);
    
    setState(prev => ({
      ...prev,
      currentRedrawWinnerId: null,
      drawingNumbers: {
        ...prev.drawingNumbers,
        [winnerId]: finalNumber, // Keep the final number briefly for display
      },
      winners: prev.winners.map(winner => 
        winner.id === winnerId 
          ? { ...winner, participantNumber: finalNumber, confirmed: false }
          : winner
      ),
    }));

    // Clear the drawing number after a short delay
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        drawingNumbers: {
          ...prev.drawingNumbers,
          [winnerId]: undefined,
        },
      }));
    }, 1000);
  };

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
  };

  return (
    <LotteryContext.Provider value={contextValue}>
      {children}
    </LotteryContext.Provider>
  );
}

export function useLottery() {
  const context = useContext(LotteryContext);
  if (context === undefined) {
    throw new Error('useLottery must be used within a LotteryProvider');
  }
  return context;
}
