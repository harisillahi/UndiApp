"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { LotteryProvider, useLottery } from '@/context/LotteryContext';
import { LotterySettings } from '@/components/LotterySettings';
import { PrizeInput } from '@/components/PrizeInput';
import { WinnerList } from '@/components/WinnerList';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- LOGIN FORM COMPONENT ---
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'undiappv1.1' && password === 'metal48-Voice56') {
      setError('');
      onLogin();
    } else {
      setError('Username or password is incorrect.');
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center bg-white">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 shadow-lg p-8 rounded-2xl flex flex-col gap-4 min-w-[320px]"
      >
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">Login</h2>
        <input
          type="text"
          placeholder="Username"
          className="p-3 rounded border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="p-3 rounded border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition"
        >
          Login
        </button>
      </form>
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>UndiApp V1.1</p>
        <p className="mt-1">©️ Crafted with ❤️ HI ©️</p>
      </div>
    </div>
  );
}

// --- MAIN CONTENT ---
function MainContent() {

  // --- Drawing Mode State ---
  const { 
    state, 
    createWinnersForPrizes,
    startGlobalDrawing,
    stopGlobalDrawing,
    setGlobalDrawing,
    setDrawingNumbers,
    startIndividualRedraw,
    stopIndividualRedraw,
    setParticipantRange,
    setDrawMode,
    setParticipantNames
  } = useLottery();
  const drawMode = state.drawMode;
  const participantNames = state.participantNames;

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
    const interval = setInterval(updateDebugInfo, 1000);
    return () => clearInterval(interval);
  }, [isClient]);

  // Send selected prizes to drawing window immediately when selection changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (selectedPrizes.length > 0) {
      localStorage.setItem('selectedPrizeIds', JSON.stringify(selectedPrizes));
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
      // ...existing code...
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

  // --- NEW: Get participant list based on mode ---
  const getParticipantList = (): string[] => {
    if (drawMode === 'name') {
      return participantNames
        .split('\n')
        .map((name: string) => name.trim())
        .filter((name: string) => name.length > 0);
    } else {
      // Number mode: use range
      if (!state.participantRange || state.participantRange.trim() === '') {
        return Array.from({ length: 100 }, (_, i) => (i + 1).toString());
      }
      if (state.participantRange.includes('-')) {
        const [start, end] = state.participantRange.split('-').map((num: string) => parseInt(num.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          return Array.from({ length: end - start + 1 }, (_, i) => (start + i).toString());
        }
      }
      if (state.participantRange.includes(',')) {
        return state.participantRange.split(',').map((num: string) => num.trim()).filter((num: string) => num.length > 0);
      }
      const num = parseInt(state.participantRange.trim());
      if (!isNaN(num) && num > 0) {
        return Array.from({ length: num }, (_, i) => (i + 1).toString());
      }
      return Array.from({ length: 100 }, (_, i) => (i + 1).toString());
    }
  };

  const handleStartDrawing = () => {
    if (typeof window === 'undefined') return;
    if (selectedPrizes.length === 0) {
      alert('Pilih minimal satu hadiah terlebih dahulu dengan mencentang checkbox');
      return;
    }
    if (drawMode === 'name' && getParticipantList().length === 0) {
      alert('Masukkan minimal satu nama peserta untuk undian nama');
      return;
    }
    // ...existing code...
    startGlobalDrawing(selectedPrizes);
    localStorage.removeItem('startDrawing');
    localStorage.removeItem('stopDrawing');
    setTimeout(() => {
      localStorage.setItem('startDrawing', 'true');
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'startDrawing',
        newValue: 'true',
        oldValue: null
      }));
    }, 50);
  };

  const handleStopDrawing = () => {
    if (typeof window === 'undefined') return;
    const participants = getParticipantList();
    const finalNumbers: { [winnerId: string]: string } = {};
    state.winners.forEach((winner: any) => {
      const randomIndex = Math.floor(Math.random() * participants.length);
      const selected = participants[randomIndex];
      finalNumbers[winner.id] = selected ? selected.toString() : '';
    });
    stopGlobalDrawing(finalNumbers);
    localStorage.removeItem('startDrawing');
    setTimeout(() => {
      localStorage.setItem('stopDrawing', 'true');
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'stopDrawing',
        newValue: 'true',
        oldValue: null
      }));
    }, 50);
  };

  // ...existing code for individual redraw...

  const getSelectedPrizesInfo = (): { selected: any[]; totalWinners: number } => {
    const selected = state.prizes.filter((p: any) => selectedPrizes.includes(p.id));
    const totalWinners = selected.reduce((sum: number, prize: any) => sum + prize.quantity, 0);
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

        {/* Drawing Mode Toggle & Input */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <label className="font-semibold">Mode Undian:</label>
              <button
                className={`px-4 py-2 rounded ${drawMode === 'number' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                onClick={() => setDrawMode('number')}
              >Nomor</button>
              <button
                className={`px-4 py-2 rounded ${drawMode === 'name' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                onClick={() => setDrawMode('name')}
              >Nama</button>
            </div>
            {drawMode === 'name' ? (
              <div className="mt-2">
                <label className="block font-medium mb-1">Daftar Nama Peserta (satu per baris)</label>
                <textarea
                  className="w-full min-h-[120px] p-2 border rounded"
                  placeholder="Masukkan nama peserta, satu per baris..."
                  value={participantNames}
                  onChange={e => setParticipantNames(e.target.value)}
                  disabled={state.isGlobalDrawing}
                />
                <p className="text-xs text-gray-500 mt-1">Contoh: Andi\nBudi\nCitra\nDewi</p>
                <p className="text-xs text-gray-500 mt-1">Total peserta: {getParticipantList().length}</p>
              </div>
            ) : (
              <div className="mt-2">
                <label className="block font-medium mb-1">Rentang Peserta (misal: 1-100)</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={state.participantRange}
                  onChange={e => setParticipantRange((e.target as HTMLInputElement).value)}
                  disabled={state.isGlobalDrawing}
                />
                <p className="text-xs text-gray-500 mt-1">Total peserta: {getParticipantList().length}</p>
              </div>
            )}
          </div>
          {/* Drawing Controls */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-3">
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
            <div className="flex items-center space-x-4">
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
              onStartIndividualRedraw={startIndividualRedraw}
              onStopIndividualRedraw={(winnerId: string) => {
                // Use the current animated value as the final winner value
                const finalValue = state.drawingNumbers[winnerId] || '';
                stopIndividualRedraw(winnerId, finalValue);
              }}
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

// --- PAGE COMPONENT WITH LOGIN + SESSION LOGIC ---
export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login session on mount (disabled 5-min rule)
  useEffect(() => {
    const loginTimestamp = localStorage.getItem('undiapp_login_time');
    if (loginTimestamp) {
      setIsLoggedIn(true);
    }
  }, []);

  // On login, set timestamp
  const handleLogin = () => {
    localStorage.setItem('undiapp_login_time', Date.now().toString());
    setIsLoggedIn(true);
  };

  // On every page load, update timestamp if logged in (to keep session alive on refresh)
  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('undiapp_login_time', Date.now().toString());
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <LotteryProvider>
      <MainContent />
    </LotteryProvider>
  );
}
