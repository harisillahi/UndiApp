"use client";

import React, { useState } from 'react';
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
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Unggah gambar PNG atau JPG (maks 2MB) untuk digunakan sebagai latar belakang di jendela undian. Gambar besar akan dikompres secara otomatis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
