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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
        <p>UndiApp V1.2</p>
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
    setUseDepartmentSort,
    setUseGroupDistribution,
    setViewMode,
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

  const showInstructions = () => {
    const instructions = `📋 PANDUAN MENGGUNAKAN UNDIAPP

1️⃣ PERSIAPAN CSV:
   • Kolom WAJIB: name
   • Kolom OPSIONAL: number, group, sub-group, target gp, target dp
   • Jika kolom "number" tidak ada, undian hanya menampilkan nama
   • Contoh format TANPA nomor:
     name;group;sub-group;target gp;target dp
     Alpha;Marketing;Team A;TRUE;
     Bravo;Finance;Team B;;TRUE
   • Contoh format DENGAN nomor:
     number;name;group;sub-group;target gp;target dp
     101;Alpha;Marketing;Team A;TRUE;
     102;Bravo;Finance;Team B;;TRUE

2️⃣ UPLOAD CSV:
   • Di Mode Grand Prize atau Door Prize, klik "Browse"
   • Pilih file CSV Anda
   • CSV bisa digunakan untuk kedua mode (Grand Prize & Door Prize)

3️⃣ MODE GRAND PRIZE:
   • Pilih tab "Mode Grand Prize"
   • Tambah hadiah: klik "Tambah Hadiah"
   • Isi nama hadiah, jumlah pemenang, upload gambar (opsional)
   • Centang checkbox hadiah yang mau diundi
   • DISTRIBUSI GROUP: Centang untuk memastikan minimal 1 pemenang per group
   • Klik "Buka Tampilan Undian" (jendela baru akan terbuka)
   • Klik "MULAI UNDIAN" → animasi berjalan
   • Klik "BERHENTI" → pemenang final ditampilkan

4️⃣ MODE DOOR PRIZE:
   • Pilih tab "Mode Door Prize"
   • Tambah door prize: klik "Tambah Door Prize"
   • Pilih salah satu:
     - "CSV Master" = gunakan CSV utama dari control panel
     - "Individual CSV" = upload CSV khusus untuk door prize ini
   • Isi nama hadiah, jumlah pemenang, upload gambar (opsional)
   • DISTRIBUSI GROUP: Centang untuk memastikan minimal 1 pemenang per group
   • Klik "MULAI UNDIAN SEMUA DOOR PRIZE" untuk undi semua sekaligus
   • Klik "BERHENTI" untuk finalisasi pemenang

5️⃣ PRIORITAS UNDIAN (Target → Group → Random):
   • FASE 1 - TARGET: Peserta dengan "target gp=TRUE" atau "target dp=TRUE" dijamin menang
   • FASE 2 - GROUP: Jika distribusi group aktif, minimal 1 pemenang per group
   • FASE 3 - RANDOM: Sisa slot diisi secara acak dari peserta tersisa
   
6️⃣ FITUR TARGETING:
   • target gp = TRUE → Dijamin menang di Grand Prize
   • target dp = TRUE → Dijamin menang di Door Prize
   • Pemenang Grand Prize otomatis tidak bisa menang Door Prize (begitu juga sebaliknya)

7️⃣ PENGATURAN TAMPILAN:
   • Scroll ke bawah untuk atur:
     - Warna font (nomor, event, hadiah, total)
     - Ukuran font (dalam pixel)
     - Transparansi background
     - Jenis font (Sans, Serif, Mono, Poppins, Roboto, Nunito)
   • Upload gambar background untuk jendela undian
   • Pengaturan langsung terlihat di jendela undian

✅ TIPS PENTING:
   • Pastikan browser TIDAK memblokir popup
   • Satu CSV bisa dipakai untuk semua mode undian
   • Gunakan semicolon (;) atau comma (,) sebagai pemisah
   • Nama kolom case-insensitive (Group = group = GROUP)
   • Kolom target: TRUE/1/yes = dijamin menang

📊 FORMAT CSV LENGKAP:

OPSI 1 - Hanya nama (tanpa nomor):
name;group;sub-group
Alpha;Marketing;Team A
Bravo;Finance;Team B
Charlie;IT;Team C

OPSI 2 - Dengan nomor custom:
number;name;group;sub-group;target gp;target dp
101;Alpha;Marketing;Team A;TRUE;
102;Bravo;Finance;Team B;;TRUE
103;Charlie;IT;Team C;;

Selamat menggunakan UndiApp! 🎉`;
    
    alert(instructions);
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

  // Get available participants excluding already-drawn winners across ALL prizes
  const getParticipantList = (): Participant[] => {
    const allParticipants = state.participants || [];
    // Extract participant numbers from all winners (format: "number - name")
    const assigned = state.winners
      .map(w => w.participantNumber)
      .filter(p => p)
      .map(p => p.split(' - ')[0]); // Extract just the number part
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
    
    // Get all door prize winners to exclude them from grand prize drawing
    const doorPrizeWinnerNumbers = new Set<string>();
    state.doorPrizes.forEach(doorPrize => {
      doorPrize.winners.forEach(winner => {
        if (winner.participantNumber) {
          const participantNum = winner.participantNumber.split(' - ')[0];
          doorPrizeWinnerNumbers.add(participantNum);
        }
      });
    });
    
    // Filter out door prize winners from available participants
    const availableParticipants = participants.filter(p => !doorPrizeWinnerNumbers.has(p.number));
    
    // Separate targeted and non-targeted participants
    const targetedParticipants = availableParticipants.filter(p => p.targetGP === true);
    const nonTargetedParticipants = availableParticipants.filter(p => !p.targetGP);
    
    const finalNumbers: { [winnerId: string]: string } = {};
    const usedParticipants = new Set<string>();
    const usedDepartments = new Set<string>();
    
    // Get unique departments from all participants
    const departments = Array.from(new Set(
      availableParticipants
        .map(p => p.department)
        .filter(d => d !== undefined && d !== '')
    )) as string[];
    
    const hasDepartments = departments.length > 0;
    const totalWinners = state.winners.length;
    
    // Phase 1: Assign all targeted participants first (override department rules)
    const targetedWinners: any[] = [];
    targetedParticipants.forEach(target => {
      if (targetedWinners.length < totalWinners && !usedParticipants.has(target.number)) {
        targetedWinners.push(target);
        usedParticipants.add(target.number);
        if (target.department) {
          usedDepartments.add(target.department);
        }
      }
    });
    
    // Phase 2: Ensure at least 1 winner per department (if departments exist and participants available)
    const departmentWinners: Participant[] = [];
    if (state.useGroupDistribution && hasDepartments) {
      departments.forEach(dept => {
        if (targetedWinners.length + departmentWinners.length >= totalWinners) return;
        
        // Skip if this department already has a targeted winner
        const hasTargetedInDept = targetedWinners.some(t => t.department === dept);
        if (hasTargetedInDept) return;
        
        // Find available participant from this department
        const deptParticipants = nonTargetedParticipants.filter(
          p => p.department === dept && !usedParticipants.has(p.number)
        );
        
        // Only add if participant available in this department
        if (deptParticipants.length > 0) {
          const randomIndex = Math.floor(Math.random() * deptParticipants.length);
          const selected = deptParticipants[randomIndex];
          departmentWinners.push(selected);
          usedParticipants.add(selected.number);
          usedDepartments.add(dept);
        }
        // If no participant available in this department, skip it and continue
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
    
    // Assign to winner slots
    state.winners.forEach((winner: any, index: number) => {
      if (allWinners[index]) {
        const selected = allWinners[index];
        finalNumbers[winner.id] = selected.number 
          ? `${selected.number} - ${selected.name}` 
          : selected.name;
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
                onClick={showInstructions}
                size="lg"
                variant="outline"
              >
                📖 Panduan
              </Button>
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
              Mode Grand Prize
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
                {/* Department Sort Toggle */}
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <Checkbox
                    id="useDepartmentSort"
                    checked={state.useDepartmentSort}
                    onCheckedChange={(checked) => setUseDepartmentSort(checked === true)}
                  />
                  <Label htmlFor="useDepartmentSort" className="text-sm font-medium cursor-pointer">
                    Urutkan pemenang berdasarkan Group (minimal 1 pemenang per Group)
                  </Label>
                </div>
                
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
                Format CSV: Kolom wajib "name". Opsional: "number", "group"/"department", "sub-group"/"function", "target gp", "target dp".
                <br />
                Contoh tanpa nomor: name;group;sub-group<br />
                Alpha;Marketing;Team A<br />
                Bravo;Finance;Team B<br />
                Atau dengan nomor: number;name;group<br />
                101;Charlie;IT
              </p>
            </div>
            {/* Participant Table */}
            <div className="mt-4">
              <ParticipantTable participants={state.participants} />
            </div>
          </div>
          {/* Drawing Controls */}
          <div className="mt-6 space-y-4">
            {/* Group Distribution Toggle for Grand Prize */}
            <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <Checkbox
                id="useGroupDistribution"
                checked={state.useGroupDistribution}
                onCheckedChange={(checked) => setUseGroupDistribution(checked === true)}
              />
              <Label htmlFor="useGroupDistribution" className="text-sm font-medium cursor-pointer">
                Distribusi pemenang berdasarkan Group (minimal 1 pemenang per Group)
              </Label>
            </div>
            
            {/* Drawing Window View Mode Toggle */}
            <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <Label className="text-sm font-medium">Tampilan Jendela Undian:</Label>
              <Button 
                variant={state.viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button 
                variant={state.viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
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
          <p>UndiApp V1.2</p>
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
