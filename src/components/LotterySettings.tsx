"use client";

import React, { useState, useEffect } from 'react';
import { useLottery } from '@/context/LotteryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { validateImageFile, fileToBase64 } from '@/lib/utils';

export function LotterySettings() {
  const { state, setEventName, setParticipantRange, setTheme, setBackgroundImage } = useLottery();
  const [imageError, setImageError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [bgAlpha, setBgAlpha] = useState('100');
  const [fontColor, setFontColor] = useState('#1e293b');
  const [fontSize, setFontSize] = useState('48');
  const [eventNameFontColor, setEventNameFontColor] = useState('#1e293b');
  const [eventNameFontSize, setEventNameFontSize] = useState('32');
  const [prizeNameFontColor, setPrizeNameFontColor] = useState('#1e293b');
  const [prizeNameFontSize, setPrizeNameFontSize] = useState('28');
  const [totalWinnerFontColor, setTotalWinnerFontColor] = useState('#1e293b');
  const [totalWinnerFontSize, setTotalWinnerFontSize] = useState('24');
  const [fontFamily, setFontFamily] = useState('sans');

  // Load all settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBgAlpha(localStorage.getItem('drawingBgAlpha') || '100');
      setFontColor(localStorage.getItem('drawingFontColor') || '#1e293b');
      setFontSize(localStorage.getItem('drawingFontSizePx') || '48');
      setEventNameFontColor(localStorage.getItem('eventNameFontColor') || '#1e293b');
      setEventNameFontSize(localStorage.getItem('eventNameFontSizePx') || '32');
      setPrizeNameFontColor(localStorage.getItem('prizeNameFontColor') || '#1e293b');
      setPrizeNameFontSize(localStorage.getItem('prizeNameFontSizePx') || '28');
      setTotalWinnerFontColor(localStorage.getItem('totalWinnerFontColor') || '#1e293b');
      setTotalWinnerFontSize(localStorage.getItem('totalWinnerFontSizePx') || '24');
      setFontFamily(localStorage.getItem('drawingFontFamily') || 'sans');
    }
  }, []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageError('');
    setIsUploading(true);

    try {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const base64 = await fileToBase64(file);
      setBackgroundImage(base64);
      localStorage.setItem('drawingBgImage', base64);
      window.dispatchEvent(new StorageEvent('storage', { key: 'drawingBgImage', newValue: base64 }));
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Kesalahan saat mengunggah gambar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Pengaturan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="eventName" className="text-sm font-medium">
              Nama Acara
            </Label>
            <Input
              id="eventName"
              type="text"
              placeholder="Masukkan nama acara"
              value={state.eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Participant Range */}
          <div className="space-y-2">
            <Label htmlFor="participantRange" className="text-sm font-medium">
              Rentang Peserta
            </Label>
            <Input
              id="participantRange"
              type="text"
              placeholder="contoh: 100-150 atau 1,5,10,25"
              value={state.participantRange}
              onChange={(e) => setParticipantRange(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Masukkan rentang (contoh: 100-150) atau nomor spesifik (contoh: 1,5,10,25)
            </p>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="theme-toggle" className="text-sm font-medium">
                Tema Gelap
              </Label>
              <p className="text-xs text-gray-500">
                Beralih antara tema terang dan gelap
              </p>
            </div>
            <Switch
              id="theme-toggle"
              checked={state.theme === 'dark'}
              onCheckedChange={handleThemeToggle}
            />
          </div>

          {/* Background Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="backgroundImage" className="text-sm font-medium">
              Gambar Latar Belakang untuk Jendela Undian
            </Label>
            <div className="space-y-2">
              <Input
                id="backgroundImage"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="w-full"
              />
              {imageError && (
                <p className="text-sm text-red-500">{imageError}</p>
              )}
              {isUploading && (
                <p className="text-sm text-blue-500">Mengunggah gambar...</p>
              )}
              {state.backgroundImage && !imageError && (
                <div className="mt-2">
                  <p className="text-sm text-green-600">✓ Gambar latar belakang berhasil diunggah</p>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <img
                      src={state.backgroundImage}
                      alt="Pratinjau latar belakang"
                      className="w-full h-32 object-cover"
                    />
                  </div>
                  {/* Delete Background Image Button */}
                  <button
                    type="button"
                    className="mt-2 w-full sm:w-auto bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium py-2 px-4 rounded transition"
                    onClick={() => {
                      setBackgroundImage('');
                      localStorage.removeItem('drawingBgImage');
                      window.dispatchEvent(new StorageEvent('storage', {
                        key: 'drawingBgImage',
                        newValue: null,
                      }));
                      alert('Background image dihapus.');
                    }}
                  >
                    Hapus Gambar Latar
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Unggah gambar PNG atau JPG (maks 2MB) untuk digunakan sebagai latar belakang di jendela undian. Gambar besar akan dikompres secara otomatis.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Drawing Window Appearance Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col gap-4 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tampilan Font di Drawing Window
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
          {/* Winner Number */}
          <div className="flex flex-col items-center text-center w-full">
            <label className="text-sm text-gray-700 dark:text-gray-200 mb-1">Warna Nomor</label>
            <input
              type="color"
              value={fontColor}
              onChange={e => {
                const value = e.target.value;
                setFontColor(value);
                localStorage.setItem('drawingFontColor', value);
                window.dispatchEvent(new StorageEvent('storage', {
                  key: 'drawingFontColor',
                  newValue: value,
                }));
              }}
              className="w-10 h-7 p-0 border-0 bg-transparent"
            />
            <label className="text-sm text-gray-700 dark:text-gray-200 mt-2 mb-1">Ukuran (px)</label>
            <input
              type="number"
              min={8}
              max={200}
              step={1}
              value={fontSize}
              onChange={e => {
                const value = e.target.value;
                setFontSize(value);
                localStorage.setItem('drawingFontSizePx', value);
                window.dispatchEvent(new StorageEvent('storage', {
                  key: 'drawingFontSizePx',
                  newValue: value,
                }));
              }}
              className="p-2 rounded border border-gray-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white w-20 mx-auto"
            />
          </div>
          {/* Event Name */}
          <div className="flex flex-col items-center text-center w-full">
            <label className="text-sm text-gray-700 dark:text-gray-200 mb-1">Warna Event</label>
            <input
              type="color"
              value={eventNameFontColor}
              onChange={e => {
                const value = e.target.value;
                setEventNameFontColor(value);
                localStorage.setItem('eventNameFontColor', value);
                window.dispatchEvent(new StorageEvent('storage', {
                  key: 'eventNameFontColor',
                  newValue: value,
                }));
              }}
              className="w-10 h-7 p-0 border-0 bg-transparent"
            />
            <label className="text-sm text-gray-700 dark:text-gray-200 mt-2 mb-1">Ukuran (px)</label>
            <input
              type="number"
              min={8}
              max={200}
              step={1}
              value={eventNameFontSize}
              onChange={e => {
                const value = e.target.value;
                setEventNameFontSize(value);
                localStorage.setItem('eventNameFontSizePx', value);
                window.dispatchEvent(new StorageEvent('storage', {
                  key: 'eventNameFontSizePx',
                  newValue: value,
                }));
              }}
              className="p-2 rounded border border-gray-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white w-20 mx-auto"
            />
          </div>
          {/* Prize Name */}
          <div className="flex flex-col items-center text-center w-full">
            <label className="text-sm text-gray-700 dark:text-gray-200 mb-1">Warna Hadiah</label>
            <input
              type="color"
              value={prizeNameFontColor}
              onChange={e => {
                const value = e.target.value;
                setPrizeNameFontColor(value);
                localStorage.setItem('prizeNameFontColor', value);
                window.dispatchEvent(new StorageEvent('storage', {
                  key: 'prizeNameFontColor',
                  newValue: value,
                }));
              }}
              className="w-10 h-7 p-0 border-0 bg-transparent"
            />
            <label className="text-sm text-gray-700 dark:text-gray-200 mt-2 mb-1">Ukuran (px)</label>
            <input
              type="number"
              min={8}
              max={200}
              step={1}
              value={prizeNameFontSize}
              onChange={e => {
                const value = e.target.value;
                setPrizeNameFontSize(value);
                localStorage.setItem('prizeNameFontSizePx', value);
                window.dispatchEvent(new StorageEvent('storage', {
                  key: 'prizeNameFontSizePx',
                  newValue: value,
                }));
              }}
              className="p-2 rounded border border-gray-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white w-20 mx-auto"
            />
          </div>
          {/* Total Winner */}
          <div className="flex flex-col items-center text-center w-full">
            <label className="text-sm text-gray-700 dark:text-gray-200 mb-1">Warna Total</label>
            <input
              type="color"
              value={totalWinnerFontColor}
              onChange={e => {
                const value = e.target.value;
                setTotalWinnerFontColor(value);
                localStorage.setItem('totalWinnerFontColor', value);
                window.dispatchEvent(new StorageEvent('storage', {
                  key: 'totalWinnerFontColor',
                  newValue: value,
                }));
              }}
              className="w-10 h-7 p-0 border-0 bg-transparent"
            />
            <label className="text-sm text-gray-700 dark:text-gray-200 mt-2 mb-1">Ukuran (px)</label>
            <input
              type="number"
              min={8}
              max={200}
              step={1}
              value={totalWinnerFontSize}
              onChange={e => {
                const value = e.target.value;
                setTotalWinnerFontSize(value);
                localStorage.setItem('totalWinnerFontSizePx', value);
                window.dispatchEvent(new StorageEvent('storage', {
                  key: 'totalWinnerFontSizePx',
                  newValue: value,
                }));
              }}
              className="p-2 rounded border border-gray-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white w-20 mx-auto"
            />
          </div>
          {/* Background Transparency */}
          <div className="flex flex-col items-center text-center w-full">
            <label className="text-sm text-gray-700 dark:text-gray-200 mb-1">Transparansi Latar (%)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={bgAlpha}
              onChange={e => {
                const value = e.target.value;
                setBgAlpha(value);
                localStorage.setItem('drawingBgAlpha', value);
                window.dispatchEvent(new StorageEvent('storage', {
                  key: 'drawingBgAlpha',
                  newValue: value,
                }));
              }}
              className="w-32 mx-auto"
            />
            <span className="text-xs text-gray-500 mt-1">
              {bgAlpha}%
            </span>
          </div>
          {/* Font Family */}
          <div className="flex flex-col items-center text-center w-full">
            <label className="text-sm text-gray-700 dark:text-gray-200 mb-1">Jenis Font</label>
            <select
              value={fontFamily}
              onChange={e => {
                const value = e.target.value;
                setFontFamily(value);
                localStorage.setItem('drawingFontFamily', value);
                window.dispatchEvent(new StorageEvent('storage', {
                  key: 'drawingFontFamily',
                  newValue: value,
                }));
              }}
              className="p-2 rounded border border-gray-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white w-32 mx-auto"
            >
              <option value="sans">Sans (Default)</option>
              <option value="serif">Serif</option>
              <option value="mono">Monospace</option>
              <option value="poppins">Poppins</option>
              <option value="roboto">Roboto</option>
              <option value="nunito">Nunito</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Pengaturan ini akan langsung diterapkan di jendela undian.
        </p>
      </div>
    </>
  );
}
