"use client";

import React from 'react';
import type { Participant } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ParticipantTableProps {
  participants: Participant[];
}

export function ParticipantTable({ participants }: ParticipantTableProps) {
  if (participants.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Belum ada data peserta. Silakan unggah file CSV.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="max-h-[200px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
            <TableRow>
              <TableHead className="w-32 font-semibold">Nomor</TableHead>
              <TableHead className="font-semibold">Nama</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((participant, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{participant.number}</TableCell>
                <TableCell>{participant.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border-t">
        Total: {participants.length} peserta
      </div>
    </div>
  );
}
