"use client";

import React, { useState } from 'react';
import { useLottery, Prize } from '@/context/LotteryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { fileToBase64 } from '@/lib/utils';

interface PrizeInputProps {
  selectedPrizes: string[];
  onPrizeSelectionChange: (selectedPrizes: string[]) => void;
}

export function PrizeInput({ selectedPrizes, onPrizeSelectionChange }: PrizeInputProps) {
  const { state, addPrize, updatePrize, deletePrize } = useLottery();
  const [isAddingPrize, setIsAddingPrize] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [newPrize, setNewPrize] = useState({ name: '', quantity: 1, image: '' });
  const [imageError, setImageError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageError('');
    setIsUploading(true);

    try {
      const base64 = await fileToBase64(file);
      
      if (isEditing && editingPrize) {
        setEditingPrize({ ...editingPrize, image: base64 });
      } else {
        setNewPrize({ ...newPrize, image: base64 });
      }
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Kesalahan saat mengunggah gambar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddPrize = () => {
    if (!newPrize.name.trim()) {
      alert('Harap masukkan nama hadiah');
      return;
    }

    addPrize({
      name: newPrize.name,
      quantity: newPrize.quantity,
      image: newPrize.image,
    });

    setNewPrize({ name: '', quantity: 1, image: '' });
    setIsAddingPrize(false);
    setImageError('');
  };

  const handleEditPrize = () => {
    if (!editingPrize || !editingPrize.name.trim()) {
      alert('Harap masukkan nama hadiah');
      return;
    }

    updatePrize(editingPrize.id, {
      name: editingPrize.name,
      quantity: editingPrize.quantity,
      image: editingPrize.image,
    });

    setEditingPrize(null);
    setImageError('');
  };

  const handlePrizeSelection = (prizeId: string, checked: boolean) => {
    if (checked) {
      onPrizeSelectionChange([...selectedPrizes, prizeId]);
    } else {
      onPrizeSelectionChange(selectedPrizes.filter(id => id !== prizeId));
    }
  };

  const resetForm = () => {
    setNewPrize({ name: '', quantity: 1, image: '' });
    setEditingPrize(null);
    setImageError('');
    setIsUploading(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex justify-between items-center">
          Manajemen Hadiah
          <Dialog open={isAddingPrize} onOpenChange={setIsAddingPrize}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsAddingPrize(true); }}>
                Tambah Hadiah
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Hadiah Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prizeName">Nama Hadiah</Label>
                  <Input
                    id="prizeName"
                    value={newPrize.name}
                    onChange={(e) => setNewPrize({ ...newPrize, name: e.target.value })}
                    placeholder="Masukkan nama hadiah"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prizeQuantity">Jumlah</Label>
                  <Input
                    id="prizeQuantity"
                    type="number"
                    min="1"
                    value={newPrize.quantity}
                    onChange={(e) => setNewPrize({ ...newPrize, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prizeImage">Gambar Hadiah (PNG atau JPG)</Label>
                  <Input
                    id="prizeImage"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(e) => handleImageUpload(e, false)}
                    disabled={isUploading}
                  />
                  {imageError && <p className="text-sm text-red-500">{imageError}</p>}
                  {isUploading && <p className="text-sm text-blue-500">Mengunggah...</p>}
                  {newPrize.image && (
                    <div className="mt-2">
                      <img src={newPrize.image} alt="Pratinjau hadiah" className="w-20 h-20 object-cover rounded" />
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddingPrize(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleAddPrize} disabled={isUploading}>
                    Tambah Hadiah
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {state.prizes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Belum ada hadiah yang ditambahkan. Klik "Tambah Hadiah" untuk memulai.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Centang checkbox untuk memilih hadiah yang akan diundi
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Pilih</TableHead>
                    <TableHead>Nama Hadiah</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Gambar</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.prizes.map((prize) => (
                    <TableRow key={prize.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPrizes.includes(prize.id)}
                          onCheckedChange={(checked) => handlePrizeSelection(prize.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{prize.name}</TableCell>
                      <TableCell>{prize.quantity}</TableCell>
                      <TableCell>
                        {prize.image ? (
                          <img src={prize.image} alt={prize.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setEditingPrize({ ...prize });
                                  setImageError('');
                                }}
                              >
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Berhasil</DialogTitle>
                              </DialogHeader>
                              {editingPrize && (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="editPrizeName">Nama Hadiah</Label>
                                    <Input
                                      id="editPrizeName"
                                      value={editingPrize.name}
                                      onChange={(e) => setEditingPrize({ ...editingPrize, name: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="editPrizeQuantity">Jumlah</Label>
                                    <Input
                                      id="editPrizeQuantity"
                                      type="number"
                                      min="1"
                                      value={editingPrize.quantity}
                                      onChange={(e) => setEditingPrize({ ...editingPrize, quantity: parseInt(e.target.value) || 1 })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="editPrizeImage">Gambar Hadiah (PNG atau JPG)</Label>
                                    <Input
                                      id="editPrizeImage"
                                      type="file"
                                      accept="image/png,image/jpeg,image/jpg"
                                      onChange={(e) => handleImageUpload(e, true)}
                                      disabled={isUploading}
                                    />
                                    {imageError && <p className="text-sm text-red-500">{imageError}</p>}
                                    {isUploading && <p className="text-sm text-blue-500">Mengunggah...</p>}
                                    {editingPrize.image && (
                                      <div className="mt-2">
                                        <img src={editingPrize.image} alt="Pratinjau hadiah" className="w-20 h-20 object-cover rounded" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={() => setEditingPrize(null)}>
                                      Batal
                                    </Button>
                                    <Button onClick={handleEditPrize} disabled={isUploading}>
                                      Simpan Perubahan
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin ingin menghapus "${prize.name}"?`)) {
                                deletePrize(prize.id);
                                // Remove from selected prizes if it was selected
                                if (selectedPrizes.includes(prize.id)) {
                                  onPrizeSelectionChange(selectedPrizes.filter(id => id !== prize.id));
                                }
                              }
                            }}
                          >
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
