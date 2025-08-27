"use client";

import React, { useState, useEffect } from 'react';
import { LotteryProvider, useLottery } from '@/context/LotteryContext';
import { LotterySettings } from '@/components/LotterySettings';
import { PrizeInput } from '@/components/PrizeInput';
import { WinnerList } from '@/components/WinnerList';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function MainContent() {
  const { 
    state, 
    createWinnersForPrizes,
    startGlobalDrawing,
    stopGlobalDrawing,
    setGlobalDrawing,
    setDrawingNumbers,
    startIndividualRedraw,
    stopIndividualRedraw
  } = useLottery();
  
  const [selectedPrizes, setSelectedPrizes] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState({
    startDrawing: 'loading...',
    selectedPrizeIds: 'loading...',
    latestWinners: 'loading...'
  });
  const [isClient, setIsClient] = useState(false);

  // Set client flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update debug info only on client
  useEffect(() => {
    if (!isClient) return;
    
    const updateDebugInfo = () => {
      setDebugInfo({
        startDrawing: localStorage.getItem('startDrawing') || 'null',
        selectedPrizeIds: localStorage.getItem('selectedPrizeIds') || 'null',
        latestWinners: localStorage.getItem('latestWinners') ? 'Present' : 'null'
      });
    };

    updateDebugInfo();
    
    // Update debug info when localStorage changes
    const interval = setInterval(updateDebugInfo, 1000);
    return () => clearInterval(interval);
  }, [isClient]);

  // Send selected prizes to drawing window immediately when selection changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (selectedPrizes.length > 0) {
      localStorage.setItem('selectedPrizeIds', JSON.stringify(selectedPrizes));
      // Trigger update in drawing window
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'selectedPrizeIds',
        newValue: JSON.stringify(selectedPrizes)
      }));
    } else {
      localStorage.removeItem('selectedPrizeIds');
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'selectedPrizeIds',
        newValue: null
      }));
    }
  }, [selectedPrizes]);

  // Listen for winners from drawing window
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log('Main page storage change:', e.key, e.newValue);
      
      if (e.key === 'latestWinners' && e.newValue) {
        try {
          const winnersData = JSON.parse(e.newValue);
          console.log('Received winners from drawing window:', winnersData);
          
          // Stop global drawing and update winners with final numbers
          if (winnersData.winners && selectedPrizes.length > 0) {
            const finalNumbers: { [winnerId: string]: string } = {};
            
            // Map the numbers to winner IDs
            state.winners.forEach((winner, index) => {
              if (index < winnersData.winners.length) {
                finalNumbers[winner.id] = winnersData.winners[index].number;
              }
            });
            
            console.log('Final numbers mapping:', finalNumbers);
            stopGlobalDrawing(finalNumbers);
          }
        } catch (error) {
          console.error('Error processing winners from drawing window:', error);
        }
      }
      
      // Handle winner updates from redraw
      if (e.key === "winnerUpdate" && e.newValue) {
        try {
          const updateData = JSON.parse(e.newValue);
          console.log("Received winner update from drawing window:", updateData);
          
          if (updateData.type === "redraw" && updateData.winnerId && updateData.newNumber) {
            // Stop individual redraw with the new number
            stopIndividualRedraw(updateData.winnerId, updateData.newNumber);
            console.log(`Updated winner ${updateData.winnerId} with new number: ${updateData.newNumber}`);
          }
        } catch (error) {
          console.error("Error processing winner update from drawing window:", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [selectedPrizes, state.winners, stopGlobalDrawing, stopIndividualRedraw]);

  const openDrawingWindow = () => {
    const drawingWindow = window.open(
      '/drawing-window', 
      'drawingWindow', 
      'width=1200,height=800,scrollbars=yes,resizable=yes'
    );
    
    if (!drawingWindow) {
      alert('Harap izinkan popup untuk situs ini agar dapat membuka jendela undian');
    }
  };

  const handleStartDrawing = () => {
    if (typeof window === 'undefined') return;
    
    if (selectedPrizes.length === 0) {
      alert('Pilih minimal satu hadiah terlebih dahulu dengan mencentang checkbox');
      return;
    }

    console.log('Main page: Starting drawing for prizes:', selectedPrizes);
    
    // Start global drawing using context method
    startGlobalDrawing(selectedPrizes);
    
    // Clear any existing commands first
    localStorage.removeItem('startDrawing');
    localStorage.removeItem('stopDrawing');
    
    // Small delay to ensure clearing is processed
    setTimeout(() => {
      // Set the start command
      localStorage.setItem('startDrawing', 'true');
      
      // Trigger storage event manually for cross-window communication
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'startDrawing',
        newValue: 'true',
        oldValue: null
      }));
      
      console.log('Main page: Start command sent');
    }, 50);
  };

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

  const handleStopDrawing = () => {
    if (typeof window === 'undefined') return;
    
    console.log('Main page: Stopping drawing');

    const participantNumbers = parseParticipantRange(state.participantRange);
    const finalNumbers: { [winnerId: string]: string } = {};
    
    // Generate final numbers for all winners
    state.winners.forEach(winner => {
      const randomIndex = Math.floor(Math.random() * participantNumbers.length);
      const selectedNumber = participantNumbers[randomIndex];
      finalNumbers[winner.id] = selectedNumber.toString().padStart(3, '0');
    });

    console.log('Generated final numbers:', finalNumbers);
    
    // Stop global drawing with final numbers
    stopGlobalDrawing(finalNumbers);
    
    // Clear start command and set stop command for drawing window
    localStorage.removeItem('startDrawing');
    
    setTimeout(() => {
      localStorage.setItem('stopDrawing', 'true');
      
      // Trigger storage event manually
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'stopDrawing',
        newValue: 'true',
        oldValue: null
      }));
      
      console.log('Main page: Stop command sent');
    }, 50);
  };

  // Handle individual redraw from WinnerList
  const handleStartIndividualRedraw = (winnerId: string) => {
    console.log('Starting individual redraw for winner:', winnerId);
    
    // Start individual redraw using context method
    startIndividualRedraw(winnerId);
    
    // Send redraw command to drawing window
    const redrawData = {
      winnerId: winnerId,
      timestamp: Date.now()
    };
    
    localStorage.removeItem('redrawWinner');
    
    setTimeout(() => {
      localStorage.setItem('redrawWinner', JSON.stringify(redrawData));
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'redrawWinner',
        newValue: JSON.stringify(redrawData),
        oldValue: null
      }));
      
      console.log('Redraw command sent for winner:', winnerId);
    }, 50);
  };

  const handleStopIndividualRedraw = (winnerId: string) => {
    console.log('Stopping individual redraw for winner:', winnerId);
    
    // Generate final number for the redrawn winner
    const participantNumbers = parseParticipantRange(state.participantRange);
    const randomIndex = Math.floor(Math.random() * participantNumbers.length);
    const selectedNumber = participantNumbers[randomIndex];
    const finalNumber = selectedNumber.toString().padStart(3, '0');

    console.log('Generated final number for redraw:', finalNumber);
    
    // Stop individual redraw with final number
    stopIndividualRedraw(winnerId, finalNumber);
    
    // Send stop redraw command to drawing window
    localStorage.setItem('stopRedraw', 'true');
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'stopRedraw',
      newValue: 'true',
      oldValue: null
    }));
    
    console.log('Stop redraw command sent');
  };

  const getSelectedPrizesInfo = () => {
    const selected = state.prizes.filter(p => selectedPrizes.includes(p.id));
    const totalWinners = selected.reduce((sum, prize) => sum + prize.quantity, 0);
    return { selected, totalWinners };
  };

  const { selected: selectedPrizesInfo, totalWinners } = getSelectedPrizesInfo();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Panel Kontrol Undian Terintegrasi
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Kelola acara undian, hadiah, dan pemenang Anda
              </p>
            </div>
            <div className="flex space-x-4">
              <Button 
                onClick={openDrawingWindow}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Buka Tampilan Undian
              </Button>
            </div>
          </div>
        </div>

        {/* Drawing Controls - Always Visible Section */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {selectedPrizes.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Hadiah Terpilih: {selectedPrizesInfo.length} hadiah
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Total Pemenang: {totalWinners} orang
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedPrizesInfo.map(prize => (
                        <span key={prize.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {prize.name} ({prize.quantity})
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                      Belum Ada Hadiah Terpilih
                    </h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Centang checkbox pada hadiah untuk memilih
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleStartDrawing}
                disabled={selectedPrizes.length === 0 || state.isGlobalDrawing}
                size="lg"
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 text-lg font-semibold"
              >
                {state.isGlobalDrawing ? 'Mengundi...' : 'MULAI UNDIAN'}
              </Button>
              <Button
                onClick={handleStopDrawing}
                disabled={selectedPrizes.length === 0 || !state.isGlobalDrawing}
                size="lg"
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 text-lg font-semibold"
              >
                BERHENTI
              </Button>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        {/*}
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800">Debug Info:</h4>
          <div className="text-sm text-yellow-700 mt-2">
            <div>Selected Prizes: {selectedPrizes.length}</div>
            <div>Is Global Drawing: {state.isGlobalDrawing ? 'Yes' : 'No'}</div>
            <div>Current Redraw Winner: {state.currentRedrawWinnerId || 'None'}</div>
            <div>Total Winners in Context: {state.winners.length}</div>
            <div>Drawing Numbers Count: {Object.keys(state.drawingNumbers).length}</div>
            <div>localStorage startDrawing: {debugInfo.startDrawing}</div>
            <div>localStorage selectedPrizeIds: {debugInfo.selectedPrizeIds}</div>
            <div>localStorage latestWinners: {debugInfo.latestWinners}</div>
          </div>
        </div>
        */}

        {/* Main Content - Tabs Layout */}
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
            <TabsTrigger value="prizes">Manajemen Hadiah</TabsTrigger>
            <TabsTrigger value="winners">Daftar Pemenang</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <LotterySettings />
          </TabsContent>

          <TabsContent value="prizes" className="space-y-6">
            <PrizeInput 
              selectedPrizes={selectedPrizes}
              onPrizeSelectionChange={(prizeIds) => {
                console.log('Prize selection changed:', prizeIds);
                setSelectedPrizes(prizeIds);
                
                if (prizeIds.length > 0) {
                  // Create winners immediately when prizes are selected
                  createWinnersForPrizes(prizeIds);
                  console.log('Created winners for prizes:', prizeIds);
                }
              }}
            />
          </TabsContent>

          <TabsContent value="winners" className="space-y-6">
            <WinnerList 
              onStartIndividualRedraw={handleStartIndividualRedraw}
              onStopIndividualRedraw={handleStopIndividualRedraw}
            />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>UndiApp V1.1</p>
          <p className="mt-1">©️ Crafted with ❤️ HI ©️</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <LotteryProvider>
      <MainContent />
    </LotteryProvider>
  );
}
