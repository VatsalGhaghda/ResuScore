import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import { cleanText, normalizeWhitespace, countWords, isResumeLike } from '../utils/textPreprocessor';

export interface ProcessedFile {
  text: string;
  cleanedText: string;
  wordCount: number;
  characterCount: number;
  fileType: 'pdf' | 'docx';
  success: boolean;
  isResumeLike: boolean;
  error?: string;
  metadata?: {
    pageCount?: number;
    title?: string;
    author?: string;
  };
}

/**
 * Extract text from a PDF file
 */
export async function extractTextFromPDF(filePath: string): Promise<ProcessedFile> {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    // Check file size (max 10MB for processing)
    const stats = fs.statSync(filePath);
    if (stats.size > 10 * 1024 * 1024) {
      throw new Error('File too large. Maximum size is 10MB.');
    }

    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    
    // Check if text was extracted
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      throw new Error('No text content found in PDF. The file might be image-based or corrupted.');
    }

    const rawText = pdfData.text;
    const cleanedText = cleanText(rawText);
    const normalizedText = normalizeWhitespace(cleanedText);
    
    return {
      text: rawText,
      cleanedText: normalizedText,
      wordCount: countWords(normalizedText),
      characterCount: normalizedText.replace(/\s/g, '').length,
      fileType: 'pdf',
      success: true,
      isResumeLike: isResumeLike(normalizedText),
      metadata: {
        pageCount: pdfData.numpages,
        title: pdfData.info?.Title,
        author: pdfData.info?.Author,
      },
    };
  } catch (error: any) {
    return {
      text: '',
      cleanedText: '',
      wordCount: 0,
      characterCount: 0,
      fileType: 'pdf',
      success: false,
      isResumeLike: false,
      error: error.message || 'Failed to extract text from PDF',
    };
  }
}

/**
 * Extract text from a DOCX file
 */
export async function extractTextFromDOCX(filePath: string): Promise<ProcessedFile> {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    // Check file size (max 10MB for processing)
    const stats = fs.statSync(filePath);
    if (stats.size > 10 * 1024 * 1024) {
      throw new Error('File too large. Maximum size is 10MB.');
    }

    const result = await mammoth.extractRawText({ path: filePath });
    
    // Check if text was extracted
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('No text content found in DOCX file. The file might be empty or corrupted.');
    }

    const rawText = result.value;
    const cleanedText = cleanText(rawText);
    const normalizedText = normalizeWhitespace(cleanedText);
    
    return {
      text: rawText,
      cleanedText: normalizedText,
      wordCount: countWords(normalizedText),
      characterCount: normalizedText.replace(/\s/g, '').length,
      fileType: 'docx',
      success: true,
      isResumeLike: isResumeLike(normalizedText),
      metadata: {},
    };
  } catch (error: any) {
    return {
      text: '',
      cleanedText: '',
      wordCount: 0,
      characterCount: 0,
      fileType: 'docx',
      success: false,
      isResumeLike: false,
      error: error.message || 'Failed to extract text from DOCX',
    };
  }
}

/**
 * Process a resume file based on its type
 */
export async function processResumeFile(filePath: string, fileType: string): Promise<ProcessedFile> {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    return await extractTextFromPDF(filePath);
  } else if (ext === '.docx') {
    return await extractTextFromDOCX(filePath);
  } else {
    return {
      text: '',
      cleanedText: '',
      wordCount: 0,
      characterCount: 0,
      fileType: ext === '.pdf' ? 'pdf' : 'docx',
      success: false,
      isResumeLike: false,
      error: `Unsupported file type: ${ext}. Only PDF and DOCX files are supported.`,
    };
  }
}

/**
 * Clean up uploaded file
 */
export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}
