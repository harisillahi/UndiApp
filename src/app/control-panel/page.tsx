"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { LotteryProvider, useLottery } from '@/context/LotteryContext';
import { LotterySettings } from '@/components/LotterySettings';
import { PrizeInput } from '@/components/PrizeInput';
import { WinnerList } from '@/components/WinnerList';
import { ParticipantTable } from '@/components/ParticipantTable';
import { DoorPrizeInput } from '@/components/DoorPrizeInput';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseCSV, validateCSVFile, exportToCSV, type Participant } from '@/lib/utils';
import { Plus } from 'lucide-react';

// --- LOGIN FORM COMPONENT ---
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'undiappv1.1' && password === 'ice65-try-cents8') {
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
    setParticipants,
    setMode,
    addDoorPrize,
    updateDoorPrize,
    deleteDoorPrize,
    startDoorPrizeDrawing,
    stopDoorPrizeDrawing,
  } = useLottery();

  const [csvError, setCsvError] = useState<string>('');
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
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

  // CSV upload handler
  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvError('');
    setIsUploadingCsv(true);

    try {
      const validation = validateCSVFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const text = await file.text();
      const participants = parseCSV(text);
      setParticipants(participants);
      alert(`Berhasil! ${participants.length} peserta dimuat dari CSV.`);
    } catch (error) {
      setCsvError(error instanceof Error ? error.message : 'Kesalahan saat membaca CSV');
    } finally {
      setIsUploadingCsv(false);
      // Reset input to allow re-uploading the same file
      event.target.value = '';
    }
  };

  // Get available participants excluding already-drawn winners
  const getParticipantList = (): Participant[] => {
    const allParticipants = state.participants || [];
    const assigned = state.winners.map(w => w.participantNumber).filter(p => p);
    return allParticipants.filter(p => !assigned.includes(p.number));
  };

  const handleStartDrawing = () => {
    if (typeof window === 'undefined') return;
    if (selectedPrizes.length === 0) {
      alert('Pilih minimal satu hadiah terlebih dahulu dengan mencentang checkbox');
      return;
    }
    if (state.participants.length === 0) {
      alert('Silakan unggah file CSV peserta terlebih dahulu!');
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
    
    // Separate targeted and non-targeted participants
    const targetedParticipants = participants.filter(p => p.target === true);
    const nonTargetedParticipants = participants.filter(p => !p.target);
    
    const finalNumbers: { [winnerId: string]: string } = {};
    const usedParticipants = new Set<string>();
    
    state.winners.forEach((winner: any) => {
      let selected;
      
      // First, try to use targeted participants
      if (targetedParticipants.length > 0) {
        const availableTargets = targetedParticipants.filter(p => !usedParticipants.has(p.number));
        if (availableTargets.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableTargets.length);
          selected = availableTargets[randomIndex];
        }
      }
      
      // If no targeted participant available, use non-targeted
      if (!selected && nonTargetedParticipants.length > 0) {
        const availableNonTargets = nonTargetedParticipants.filter(p => !usedParticipants.has(p.number));
        if (availableNonTargets.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableNonTargets.length);
          selected = availableNonTargets[randomIndex];
        }
      }
      
      // Fallback to any remaining participant
      if (!selected) {
        const remaining = participants.filter(p => !usedParticipants.has(p.number));
        if (remaining.length > 0) {
          const randomIndex = Math.floor(Math.random() * remaining.length);
          selected = remaining[randomIndex];
        }
      }
      
      if (selected) {
        usedParticipants.add(selected.number);
        finalNumbers[winner.id] = `${selected.number} - ${selected.name}`;
      }
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

        {/* Mode Toggle */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-gray-900 dark:text-white">Mode:</span>
            <Button
              variant={state.mode === 'regular' ? 'default' : 'outline'}
              onClick={() => setMode('regular')}
            >
              Mode Regular
            </Button>
            <Button
              variant={state.mode === 'doorprize' ? 'default' : 'outline'}
              onClick={() => setMode('doorprize')}
            >
              Mode Door Prize
            </Button>
          </div>
        </div>

        {/* Door Prize Mode Content */}
        {state.mode === 'doorprize' ? (
          <div className="space-y-6">
            {/* Add Door Prize Button */}
            <Button
              onClick={() => addDoorPrize({ name: '', quantity: 1, participants: [] })}
              className="w-full"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Tambah Door Prize
            </Button>

            {/* Door Prize List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.doorPrizes.map((doorPrize, index) => (
                <DoorPrizeInput
                  key={doorPrize.id}
                  doorPrize={doorPrize}
                  onUpdate={updateDoorPrize}
                  onDelete={deleteDoorPrize}
                  index={index}
                />
              ))}
            </div>

            {/* Drawing Controls for Door Prize Mode */}
            {state.doorPrizes.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={startDoorPrizeDrawing}
                    disabled={state.isGlobalDrawing || state.doorPrizes.some(dp => dp.participants.length === 0)}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 text-lg font-semibold"
                  >
                    {state.isGlobalDrawing ? 'Mengundi...' : 'MULAI UNDIAN SEMUA DOOR PRIZE'}
                  </Button>
                  <Button
                    onClick={stopDoorPrizeDrawing}
                    disabled={!state.isGlobalDrawing}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 text-lg font-semibold"
                  >
                    BERHENTI
                  </Button>
                </div>
                {state.doorPrizes.some(dp => dp.participants.length === 0) && (
                  <p className="text-sm text-orange-600 mt-2">
                    ⚠️ Pastikan semua door prize sudah memiliki file CSV peserta
                  </p>
                )}
              </div>
            )}

            {/* Door Prize Winners */}
            {state.doorPrizes.some(dp => dp.winners.length > 0) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">Pemenang Door Prize</h3>
                <div className="space-y-6">
                  {state.doorPrizes.map((doorPrize) => (
                    doorPrize.winners.length > 0 && (
                      <div key={doorPrize.id}>
                        <h4 className="font-semibold text-lg mb-2">{doorPrize.name}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {doorPrize.winners.map((winner, idx) => (
                            <div key={winner.id} className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                              <div className="text-sm text-gray-600 dark:text-gray-400">Pemenang {idx + 1}</div>
                              <div className="font-semibold">{winner.participantNumber}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Regular Mode Content */
          <>

        {/* CSV Upload & Participant List */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Data Peserta</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="csv-upload" className="block font-medium mb-2">
                Unggah File CSV Peserta
              </label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                disabled={isUploadingCsv || state.isGlobalDrawing}
                className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {csvError && (
                <p className="text-sm text-red-500 mt-2">{csvError}</p>
              )}
              {isUploadingCsv && (
                <p className="text-sm text-blue-500 mt-2">Memproses CSV...</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Format CSV: Kolom "number" dan "name" (atau "nomor" dan "nama"). 
                <br />
                Contoh: number,name<br />
                1,Andi<br />
                2,Budi
              </p>
            </div>
            {/* Participant Table */}
            <div className="mt-4">
              <ParticipantTable participants={state.participants} />
            </div>
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
        </>
        )}

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
