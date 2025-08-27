"use client";

import React from 'react';
import { useLottery } from '@/context/LotteryContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { exportToCSV } from '@/lib/utils';

interface WinnerListProps {
  onStartIndividualRedraw?: (winnerId: string) => void;
  onStopIndividualRedraw?: (winnerId: string) => void;
}

export function WinnerList({ onStartIndividualRedraw, onStopIndividualRedraw }: WinnerListProps) {
  const { state, updateWinner, clearWinners } = useLottery();

  const handleConfirmWinner = (winnerId: string) => {
    updateWinner(winnerId, { confirmed: true });
  };

  const handleRedrawWinner = (winnerId: string) => {
    console.log('Starting redraw process for winner:', winnerId);
    
    if (onStartIndividualRedraw) {
      onStartIndividualRedraw(winnerId);
    } else {
      // Fallback to old method if no prop provided
      if (typeof window === 'undefined') return;
      
      // Mark winner as unconfirmed and trigger redraw
      updateWinner(winnerId, { confirmed: false, participantNumber: '' });
      
      // Send redraw command to existing drawing window via localStorage
      const redrawData = {
        winnerId: winnerId,
        timestamp: Date.now()
      };
      
      console.log('Sending redraw data:', redrawData);
      
      // Clear any existing redraw commands first
      localStorage.removeItem('redrawWinner');
      
      // Small delay to ensure clearing is processed
      setTimeout(() => {
        localStorage.setItem('redrawWinner', JSON.stringify(redrawData));
        
        // Trigger storage event for cross-window communication
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'redrawWinner',
          newValue: JSON.stringify(redrawData),
          oldValue: null
        }));
        
        console.log('Redraw command sent for winner:', winnerId);
      }, 50);
    }
  };

  const handleStopRedraw = (winnerId: string) => {
    console.log('Stopping redraw process for winner:', winnerId);
    
    if (onStopIndividualRedraw) {
      onStopIndividualRedraw(winnerId);
    } else {
      // Fallback to old method if no prop provided
      if (typeof window === 'undefined') return;
      
      // Send stop redraw command to drawing window
      localStorage.setItem('stopRedraw', 'true');
      
      // Trigger storage event for cross-window communication
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'stopRedraw',
        newValue: 'true',
        oldValue: null
      }));
      
      console.log('Stop redraw command sent');
    }
  };

  const handleExportCSV = () => {
    if (typeof window === 'undefined') return;
    
    if (state.winners.length === 0) {
      alert('Tidak ada pemenang untuk diekspor');
      return;
    }

    try {
      const exportData = state.winners.map(winner => ({
        'Nama Acara': state.eventName || 'Acara Tanpa Judul',
        'Nama Hadiah': winner.prizeName,
        'Nomor Pemenang': winner.participantNumber,
        'Status': winner.confirmed ? 'Dikonfirmasi' : 'Menunggu',
        'Tanggal': new Date().toLocaleDateString('id-ID'),
        'Waktu': new Date().toLocaleTimeString('id-ID'),
      }));

      const filename = `${state.eventName || 'undian'}-pemenang-${new Date().toISOString().split('T')[0]}.csv`;
      exportToCSV(exportData, filename);
    } catch (error) {
      alert('Kesalahan saat mengekspor CSV: ' + (error instanceof Error ? error.message : 'Kesalahan tidak diketahui'));
    }
  };

  const handleClearAllWinners = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua pemenang? Tindakan ini tidak dapat dibatalkan.')) {
      clearWinners();
    }
  };

  const confirmedWinners = state.winners.filter(w => w.confirmed);
  const pendingWinners = state.winners.filter(w => !w.confirmed);

  // Helper function to get display number for a winner
  const getDisplayNumber = (winner: any): string => {
    // If there's an animated number for this winner, show it
    const animatedNumber = state.drawingNumbers[winner.id];
    if (animatedNumber) {
      return animatedNumber;
    }
    
    // If global drawing is active, show animated number
    if (state.isGlobalDrawing && animatedNumber) {
      return animatedNumber;
    }
    
    // If individual redraw is active for this winner, show animated number
    if (state.currentRedrawWinnerId === winner.id && animatedNumber) {
      return animatedNumber;
    }
    
    // Otherwise show the actual participant number or placeholder
    return winner.participantNumber || '---';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex justify-between items-center">
          Daftar Pemenang
          <div className="flex space-x-2">
            {state.winners.length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearAllWinners}
                >
                  Hapus Semua
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleExportCSV}
                >
                  Ekspor CSV
                </Button>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {state.winners.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Belum ada pemenang. Pilih hadiah untuk membuat slot pemenang.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{state.winners.length}</div>
                <div className="text-sm text-gray-600">Total Pemenang</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{confirmedWinners.length}</div>
                <div className="text-sm text-gray-600">Dikonfirmasi</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{pendingWinners.length}</div>
                <div className="text-sm text-gray-600">Menunggu</div>
              </div>
            </div>

            {/* Drawing Status */}
            {(state.isGlobalDrawing || state.currentRedrawWinnerId) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-center">
                  <div className="text-blue-800 font-semibold">
                    {state.isGlobalDrawing ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800 mr-2"></div>
                        Mengundi semua pemenang...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800 mr-2"></div>
                        Mengundi ulang pemenang...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Winners Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Hadiah</TableHead>
                    <TableHead>Nomor Pemenang</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.winners.map((winner) => {
                    const isBeingRedrawn = state.currentRedrawWinnerId === winner.id;
                    const isGlobalDrawing = state.isGlobalDrawing;
                    const displayNumber = getDisplayNumber(winner);
                    const isAnimating = isBeingRedrawn || isGlobalDrawing;
                    
                    return (
                      <TableRow 
                        key={winner.id} 
                        className={isBeingRedrawn ? 'bg-orange-50 border-orange-200' : ''}
                      >
                        <TableCell className="font-medium">{winner.prizeName}</TableCell>
                        <TableCell>
                          <span 
                            className={`font-mono text-lg ${
                              isAnimating ? 'text-red-600 animate-pulse' : 'text-green-600'
                            }`}
                          >
                            {displayNumber}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isBeingRedrawn ? (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800 animate-pulse">
                              Mengundi ulang...
                            </Badge>
                          ) : isGlobalDrawing ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 animate-pulse">
                              Mengundi...
                            </Badge>
                          ) : (
                            <Badge 
                              variant={winner.confirmed ? "default" : "secondary"}
                              className={winner.confirmed ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                            >
                              {winner.confirmed ? 'Dikonfirmasi' : 'Menunggu'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {/* UNDI ULANG Button - Enabled only if there is winner number and not during global drawing */}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRedrawWinner(winner.id)}
                              disabled={!winner.participantNumber || isGlobalDrawing || isBeingRedrawn}
                            >
                              Undi Ulang
                            </Button>
                            
                            {/* KONFIRMASI Button - Enabled only if there is winner number and not confirmed */}
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleConfirmWinner(winner.id)}
                              disabled={!winner.participantNumber || winner.confirmed || isGlobalDrawing || isBeingRedrawn}
                            >
                              Konfirmasi
                            </Button>
                            
                            {/* BERHENTI Button - Enabled only during individual redraw */}
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleStopRedraw(winner.id)}
                              disabled={!isBeingRedrawn}
                              className={isBeingRedrawn ? "animate-pulse" : ""}
                            >
                              Berhenti
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Event Info */}
            {state.eventName && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900">Informasi Acara</h3>
                <div className="mt-2 space-y-1 text-sm text-blue-700">
                  <div><strong>Acara:</strong> {state.eventName}</div>
                  <div><strong>Rentang Peserta:</strong> {state.participantRange || 'Tidak ditentukan'}</div>
                  <div><strong>Total Hadiah:</strong> {state.prizes.length}</div>
                  <div><strong>Tanggal Ekspor:</strong> {new Date().toLocaleDateString('id-ID')}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
