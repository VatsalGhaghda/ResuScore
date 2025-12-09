import path from 'path';
import fs from 'fs';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate file before processing
 */
export function validateFile(filePath: string, originalName: string, fileSize: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    errors.push('File not found on server');
    return { isValid: false, errors, warnings };
  }

  // Validate file extension
  const ext = path.extname(originalName).toLowerCase();
  const allowedExtensions = ['.pdf', '.docx'];
  if (!allowedExtensions.includes(ext)) {
    errors.push(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`);
  }

  // Validate file size (5MB limit for upload, but we check 10MB for processing)
  const maxUploadSize = 5 * 1024 * 1024; // 5MB
  const maxProcessSize = 10 * 1024 * 1024; // 10MB

  if (fileSize > maxUploadSize) {
    errors.push(`File too large. Maximum upload size is ${formatFileSize(maxUploadSize)}`);
  } else if (fileSize > maxProcessSize) {
    warnings.push(`File is large (${formatFileSize(fileSize)}). Processing may take longer.`);
  }

  // Check minimum file size (should be at least 1KB)
  const minSize = 1024; // 1KB
  if (fileSize < minSize) {
    warnings.push('File is very small. It may not contain sufficient content.');
  }

  // Validate file name
  if (originalName.length > 255) {
    warnings.push('File name is very long. Consider using a shorter name.');
  }

  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|com|scr|vbs|js|jar)$/i,
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(originalName)) {
      warnings.push('File name contains potentially suspicious patterns.');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format file size to human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file content type matches extension
 */
export function validateFileContent(filePath: string, expectedType: 'pdf' | 'docx'): boolean {
  try {
    const buffer = fs.readFileSync(filePath);
    const fileHeader = buffer.slice(0, 8);

    if (expectedType === 'pdf') {
      // PDF files start with %PDF
      const pdfHeader = Buffer.from('%PDF');
      return fileHeader.slice(0, 4).equals(pdfHeader);
    } else if (expectedType === 'docx') {
      // DOCX files are ZIP archives, check for ZIP header
      const zipHeader = Buffer.from([0x50, 0x4B, 0x03, 0x04]); // PK..
      return fileHeader.slice(0, 4).equals(zipHeader);
    }

    return false;
  } catch (error) {
    return false;
  }
}
