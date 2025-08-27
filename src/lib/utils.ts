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
  if (file.type !== 'image/png' && file.type !== 'image/jpeg' && file.type !== 'image/jpg') {
    return { isValid: false, error: 'Harap unggah file gambar PNG atau JPG saja' };
  }
  
  // Check file size (limit to 2MB to prevent localStorage quota issues)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'Ukuran file gambar harus kurang dari 2MB. Harap kompres gambar Anda atau pilih file yang lebih kecil.' };
  }
  
  return { isValid: true };
}

export function compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Determine output format based on input file type
      const outputFormat = file.type === 'image/jpeg' || file.type === 'image/jpg' ? 'image/jpeg' : 'image/png';
      
      // Convert to base64 with compression
      const compressedDataUrl = canvas.toDataURL(outputFormat, quality);
      
      // Check if compressed size is still too large for localStorage
      const sizeInBytes = compressedDataUrl.length * 0.75; // Approximate size
      const maxLocalStorageSize = 1024 * 1024; // 1MB limit for localStorage
      
      if (sizeInBytes > maxLocalStorageSize) {
        // Try with lower quality
        const lowerQualityDataUrl = canvas.toDataURL(outputFormat, 0.5);
        const lowerQualitySizeInBytes = lowerQualityDataUrl.length * 0.75;
        
        if (lowerQualitySizeInBytes > maxLocalStorageSize) {
          reject(new Error('Gambar terlalu besar bahkan setelah kompresi. Harap gunakan gambar yang lebih kecil.'));
        } else {
          resolve(lowerQualityDataUrl);
        }
      } else {
        resolve(compressedDataUrl);
      }
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
