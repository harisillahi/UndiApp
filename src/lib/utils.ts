import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function exportToCSV(data: any[], filename: string = 'pemenang-undian.csv') {
  try {
    if (!data || data.length === 0) {
      throw new Error('Tidak ada data untuk diekspor');
    }

    // Get headers from the first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      throw new Error('Browser tidak mendukung unduhan file');
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw error;
  }
}

export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  if (file.type !== 'image/png' && file.type !== 'image/jpeg' && file.type !== 'image/jpg' && file.type !== 'image/webp') {
    return { isValid: false, error: 'Harap unggah file gambar PNG, JPG, atau WebP saja' };
  }
  
  // Electron app - allow much larger images (up to 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'Ukuran file gambar harus kurang dari 10MB.' };
  }
  
  return { isValid: true };
}

export function compressImage(file: File, maxWidth: number = 1920, quality: number = 0.95): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      // Only resize if image is larger than maxWidth
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw image
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Use original format if PNG, otherwise JPEG
      const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      
      // High quality output
      const compressedDataUrl = canvas.toDataURL(outputFormat, quality);
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => reject(new Error('Gagal memuat gambar'));
    img.src = URL.createObjectURL(file);
  });
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // First validate the file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      reject(new Error(validation.error));
      return;
    }
    
    // Use compression for better storage efficiency
    compressImage(file)
      .then(resolve)
      .catch(reject);
  });
}

export function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface Participant {
  number: string;
  name: string;
  department?: string; // Group - for ensuring distribution across groups
  function?: string; // Sub-group - for display/information only
  targetGP?: boolean; // Target GP: mark as guaranteed winner in Grand Prize only
  targetDP?: boolean; // Target DP: mark as guaranteed winner in Door Prize only
}

export function parseCSV(csvText: string): Participant[] {
  const lines = csvText.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV harus memiliki header dan minimal satu baris data');
  }
  
  // Detect delimiter (comma or semicolon)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';
  
  // Parse header
  const header = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
  const numberIndex = header.findIndex(h => h === 'number' || h === 'nomor' || h === 'no');
  const nameIndex = header.findIndex(h => h === 'name' || h === 'nama');
  // Support both old (department/function) and new (group/sub-group) column names
  const departmentIndex = header.findIndex(h => h === 'department' || h === 'departemen' || h === 'dept' || h === 'group' || h === 'grup');
  const functionIndex = header.findIndex(h => h === 'function' || h === 'fungsi' || h === 'jabatan' || h === 'sub-group' || h === 'subgroup' || h === 'sub group');
  const targetGPIndex = header.findIndex(h => h === 'target gp' || h === 'targetgp' || h === 'target_gp');
  const targetDPIndex = header.findIndex(h => h === 'target dp' || h === 'targetdp' || h === 'target_dp');
  
  if (nameIndex === -1) {
    throw new Error('CSV harus memiliki kolom "name" (atau "nama")');
  }
  
  const hasNumberColumn = numberIndex !== -1;
  
  // Parse data rows
  const participants: Participant[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const values = line.split(delimiter).map(v => v.trim());
    
    if (values.length <= nameIndex) {
      console.warn(`Baris ${i + 1} tidak memiliki cukup kolom, dilewati`);
      continue;
    }
    
    // Use provided number or leave empty
    const number = hasNumberColumn && values[numberIndex] ? values[numberIndex] : '';
    const name = values[nameIndex];
    const department = departmentIndex !== -1 ? values[departmentIndex]?.trim() : undefined;
    const functionValue = functionIndex !== -1 ? values[functionIndex]?.trim() : undefined;
    const targetGPValue = targetGPIndex !== -1 ? values[targetGPIndex] : undefined;
    const targetDPValue = targetDPIndex !== -1 ? values[targetDPIndex] : undefined;
    
    // Parse target as boolean (true, 1, yes -> true, anything else -> false/undefined)
    const targetGP = targetGPValue 
      ? (targetGPValue.toLowerCase() === 'true' || targetGPValue === '1' || targetGPValue.toLowerCase() === 'yes')
      : undefined;
    const targetDP = targetDPValue 
      ? (targetDPValue.toLowerCase() === 'true' || targetDPValue === '1' || targetDPValue.toLowerCase() === 'yes')
      : undefined;
    
    if (name) {
      participants.push({ 
        number, 
        name, 
        department: department || undefined,
        function: functionValue || undefined,
        targetGP,
        targetDP
      });
    }
  }
  
  if (participants.length === 0) {
    throw new Error('Tidak ada data peserta yang valid ditemukan dalam CSV');
  }
  
  return participants;
}

export function validateCSVFile(file: File): { isValid: boolean; error?: string } {
  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    return { isValid: false, error: 'Harap unggah file CSV saja' };
  }
  
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'Ukuran file CSV harus kurang dari 5MB' };
  }
  
  return { isValid: true };
}
