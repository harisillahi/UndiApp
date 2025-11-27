"use client";

import React, { useState } from 'react';
import type { DoorPrize } from '@/context/LotteryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { parseCSV, validateCSVFile, validateImageFile, fileToBase64, type Participant } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

interface DoorPrizeInputProps {
  doorPrize: DoorPrize;
  onUpdate: (id: string, updates: Partial<DoorPrize>) => void;
  onDelete: (id: string) => void;
  index: number;
}

export function DoorPrizeInput({ doorPrize, onUpdate, onDelete, index }: DoorPrizeInputProps) {
  const [csvError, setCsvError] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
      onUpdate(doorPrize.id, { 
        participants, 
        csvFileName: file.name 
      });
    } catch (error) {
      setCsvError(error instanceof Error ? error.message : 'Kesalahan saat membaca CSV');
    } finally {
      setIsUploadingCsv(false);
      event.target.value = '';
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageError('');
    setIsUploadingImage(true);

    try {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const base64 = await fileToBase64(file);
      onUpdate(doorPrize.id, { image: base64 });
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Kesalahan saat mengunggah gambar');
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Door Prize {index + 1}</CardTitle>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(doorPrize.id)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name */}
        <div>
          <Label htmlFor={`name-${doorPrize.id}`}>Nama Hadiah</Label>
          <Input
            id={`name-${doorPrize.id}`}
            type="text"
            placeholder="Contoh: Grand Prize"
            value={doorPrize.name}
            onChange={(e) => onUpdate(doorPrize.id, { name: e.target.value })}
          />
        </div>

        {/* Quantity */}
        <div>
          <Label htmlFor={`quantity-${doorPrize.id}`}>Jumlah Pemenang</Label>
          <Input
            id={`quantity-${doorPrize.id}`}
            type="number"
            min="1"
            value={doorPrize.quantity}
            onChange={(e) => onUpdate(doorPrize.id, { quantity: parseInt(e.target.value) || 1 })}
          />
        </div>

        {/* CSV Upload */}
        <div>
          <Label htmlFor={`csv-${doorPrize.id}`}>File CSV Peserta</Label>
          <Input
            id={`csv-${doorPrize.id}`}
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            disabled={isUploadingCsv}
          />
          {csvError && <p className="text-sm text-red-500 mt-1">{csvError}</p>}
          {isUploadingCsv && <p className="text-sm text-blue-500 mt-1">Memproses CSV...</p>}
          {doorPrize.csvFileName && (
            <p className="text-sm text-green-600 mt-1">
              ✓ {doorPrize.csvFileName} ({doorPrize.participants.length} peserta)
            </p>
          )}
        </div>

        {/* Image Upload */}
        <div>
          <Label htmlFor={`image-${doorPrize.id}`}>Gambar Hadiah (Opsional)</Label>
          <Input
            id={`image-${doorPrize.id}`}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleImageUpload}
            disabled={isUploadingImage}
          />
          {imageError && <p className="text-sm text-red-500 mt-1">{imageError}</p>}
          {isUploadingImage && <p className="text-sm text-blue-500 mt-1">Mengunggah gambar...</p>}
          {doorPrize.image && (
            <div className="mt-2">
              <img
                src={doorPrize.image}
                alt={doorPrize.name}
                className="w-20 h-20 object-cover rounded border"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdate(doorPrize.id, { image: '' })}
                className="mt-2"
              >
                Hapus Gambar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
