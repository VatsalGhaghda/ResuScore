/**
 * Format Analysis Engine
 * Analyzes resume format based on extracted text patterns
 */

export interface FormatAnalysis {
  layout: {
    isSingleColumn: boolean;
    confidence: number;
    hasMultiColumn: boolean;
    issues: string[];
  };
  fonts: {
    usesStandardFonts: boolean;
    note: string;
  };
  images: {
    hasImages: boolean;
    hasImageReferences: boolean;
    issues: string[];
  };
  tables: {
    hasTables: boolean;
    tableCount: number;
    issues: string[];
  };
  headersFooters: {
    hasHeader: boolean;
    hasFooter: boolean;
    headerContent?: string;
    footerContent?: string;
    issues: string[];
  };
  overallFormatScore: number;
  suggestions: string[];
}

/**
 * Analyze resume format
 */
export function analyzeFormat(text: string, wordCount: number): FormatAnalysis {
  const layout = analyzeLayout(text);
  const fonts = analyzeFonts(text);
  const images = analyzeImages(text);
  const tables = analyzeTables(text);
  const headersFooters = analyzeHeadersFooters(text);

  // Calculate overall format score
  const overallFormatScore = calculateFormatScore(layout, fonts, images, tables, headersFooters);

  // Generate suggestions
  const suggestions = generateFormatSuggestions(layout, fonts, images, tables, headersFooters);

  return {
    layout,
    fonts,
    images,
    tables,
    headersFooters,
    overallFormatScore,
    suggestions,
  };
}

/**
 * Analyze layout - detect single vs multi-column
 */
function analyzeLayout(text: string): FormatAnalysis['layout'] {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const issues: string[] = [];
  let hasMultiColumn = false;
  let confidence = 0.8; // Default confidence for single column

  // Check for multi-column indicators
  // Multi-column layouts often have:
  // 1. Very short lines followed by content on same "line"
  // 2. Excessive whitespace patterns
  // 3. Text that appears to be side-by-side

  // Analyze line length distribution
  const lineLengths = lines.map(line => line.trim().length);
  const avgLineLength = lineLengths.reduce((a, b) => a + b, 0) / lineLengths.length;
  const shortLines = lineLengths.filter(len => len < 30).length;
  const shortLineRatio = shortLines / lineLengths.length;

  // If many very short lines, might be multi-column
  if (shortLineRatio > 0.4 && avgLineLength < 40) {
    hasMultiColumn = true;
    confidence = 0.6;
    issues.push('Text pattern suggests multi-column layout which may confuse ATS systems');
  }

  // Check for excessive whitespace (indicator of columns)
  const whitespacePattern = /\s{5,}/g;
  const excessiveWhitespace = (text.match(whitespacePattern) || []).length;
  if (excessiveWhitespace > 10) {
    hasMultiColumn = true;
    confidence = 0.5;
    issues.push('Excessive whitespace detected, may indicate multi-column formatting');
  }

  // Check for side-by-side content patterns (e.g., "2020 - 2023    Software Engineer")
  const sideBySidePattern = /\d{4}\s*-\s*\d{4}\s{3,}[A-Z]/g;
  if (sideBySidePattern.test(text)) {
    hasMultiColumn = true;
    confidence = 0.7;
    issues.push('Date and job title appear side-by-side, suggesting multi-column layout');
  }

  return {
    isSingleColumn: !hasMultiColumn,
    confidence,
    hasMultiColumn,
    issues,
  };
}

/**
 * Analyze font usage
 * Note: We can't detect actual fonts from extracted text,
 * but we can provide guidance
 */
function analyzeFonts(text: string): FormatAnalysis['fonts'] {
  // Since we only have extracted text, we can't detect actual fonts
  // But we can check for special characters that might indicate non-standard fonts
  const specialChars = /[^\x00-\x7F]/g;
  const specialCharCount = (text.match(specialChars) || []).length;
  const specialCharRatio = specialCharCount / text.length;

  let usesStandardFonts = true;
  let note = 'Font analysis requires document structure. Ensure you use standard fonts (Arial, Calibri, Times New Roman).';

  if (specialCharRatio > 0.1) {
    note = 'Document contains many special characters. Ensure fonts are ATS-compatible.';
  }

  return {
    usesStandardFonts,
    note,
  };
}

/**
 * Analyze images and graphics
 */
function analyzeImages(text: string): FormatAnalysis['images'] {
  const issues: string[] = [];
  let hasImages = false;
  let hasImageReferences = false;

  // Check for image references in text
  const imagePatterns = [
    /\[image\]/gi,
    /\[picture\]/gi,
    /\[photo\]/gi,
    /\[graphic\]/gi,
    /\[logo\]/gi,
    /image\s+\d+/gi,
    /figure\s+\d+/gi,
  ];

  for (const pattern of imagePatterns) {
    if (pattern.test(text)) {
      hasImageReferences = true;
      hasImages = true;
      issues.push('Image references detected in text. ATS systems cannot read images.');
      break;
    }
  }

  // Check for very short text (might indicate image-based PDF)
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < 50 && text.length < 500) {
    hasImages = true;
    issues.push('Very little text extracted. File might be image-based (scanned PDF). ATS cannot read scanned images.');
  }

  // Check for common image-based resume indicators
  const imageBasedIndicators = [
    /scanned/gi,
    /image\s+file/gi,
    /picture\s+of/gi,
  ];

  for (const pattern of imageBasedIndicators) {
    if (pattern.test(text)) {
      hasImages = true;
      issues.push('Document appears to be image-based. Convert to text-based format for ATS compatibility.');
      break;
    }
  }

  return {
    hasImages,
    hasImageReferences,
    issues,
  };
}

/**
 * Analyze tables in text
 */
function analyzeTables(text: string): FormatAnalysis['tables'] {
  const issues: string[] = [];
  let hasTables = false;
  let tableCount = 0;

  // Tables in extracted text often show as:
  // 1. Multiple consecutive lines with similar structure
  // 2. Tab-separated values
  // 3. Pipe-separated values
  // 4. Aligned columns (hard to detect in plain text)

  // Check for tab-separated patterns (common in tables)
  const tabPattern = /[^\t]+\t[^\t]+/g;
  const tabMatches = text.match(tabPattern) || [];
  if (tabMatches.length > 3) {
    hasTables = true;
    tableCount = Math.ceil(tabMatches.length / 3);
    issues.push('Tab-separated data detected, likely from tables. ATS may have difficulty reading table structures.');
  }

  // Check for pipe-separated patterns
  const pipePattern = /[^|]+\|[^|]+/g;
  const pipeMatches = text.match(pipePattern) || [];
  if (pipeMatches.length > 3) {
    hasTables = true;
    tableCount = Math.max(tableCount, Math.ceil(pipeMatches.length / 3));
    issues.push('Pipe-separated data detected, likely from tables. Consider using plain text format.');
  }

  // Check for repeated patterns that might indicate table rows
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const similarLines = findSimilarLinePatterns(lines);
  if (similarLines > 5) {
    hasTables = true;
    tableCount++;
    issues.push('Repeated line patterns detected, may indicate table structure. ATS prefers plain text lists.');
  }

  return {
    hasTables,
    tableCount,
    issues,
  };
}

/**
 * Find similar line patterns (potential table rows)
 */
function findSimilarLinePatterns(lines: string[]): number {
  if (lines.length < 3) return 0;

  let similarCount = 0;
  const linePatterns = lines.map(line => {
    // Extract pattern (alphanumeric sequences)
    return line.replace(/\d+/g, 'N').replace(/[A-Za-z]+/g, 'W').substring(0, 20);
  });

  // Count similar patterns
  const patternCounts: { [key: string]: number } = {};
  for (const pattern of linePatterns) {
    patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
  }

  // Count patterns that appear multiple times
  for (const count of Object.values(patternCounts)) {
    if (count >= 3) {
      similarCount += count;
    }
  }

  return similarCount;
}

/**
 * Analyze headers and footers
 */
function analyzeHeadersFooters(text: string): FormatAnalysis['headersFooters'] {
  const issues: string[] = [];
  let hasHeader = false;
  let hasFooter = false;
  let headerContent: string | undefined;
  let footerContent: string | undefined;

  const lines = text.split('\n').filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    return {
      hasHeader: false,
      hasFooter: false,
      issues: ['No content detected'],
    };
  }

  // Check first few lines for header patterns
  const headerLines = lines.slice(0, 3).join(' ').toLowerCase();
  const headerPatterns = [
    /page\s+\d+/gi,
    /confidential/gi,
    /draft/gi,
    /resume\s+of/gi,
  ];

  for (const pattern of headerPatterns) {
    if (pattern.test(headerLines)) {
      hasHeader = true;
      headerContent = lines.slice(0, 3).join(' | ');
      issues.push('Header content detected. Ensure important information is not only in headers/footers.');
      break;
    }
  }

  // Check last few lines for footer patterns
  const footerLines = lines.slice(-3).join(' ').toLowerCase();
  const footerPatterns = [
    /page\s+\d+/gi,
    /confidential/gi,
    /©/g,
    /copyright/gi,
  ];

  for (const pattern of footerPatterns) {
    if (pattern.test(footerLines)) {
      hasFooter = true;
      footerContent = lines.slice(-3).join(' | ');
      issues.push('Footer content detected. ATS may not read content in headers/footers.');
      break;
    }
  }

  // Check if contact info appears only at start (might be in header)
  const contactAtStart = /(email|phone|address).*@|(\+?\d)/i.test(lines.slice(0, 5).join(' '));
  const contactElsewhere = /(email|phone|address).*@|(\+?\d)/i.test(lines.slice(5).join(' '));
  
  if (contactAtStart && !contactElsewhere) {
    issues.push('Contact information appears only at the top. Ensure it\'s in the main body, not just in header.');
  }

  return {
    hasHeader,
    hasFooter,
    headerContent,
    footerContent,
    issues,
  };
}

/**
 * Calculate overall format score
 */
function calculateFormatScore(
  layout: FormatAnalysis['layout'],
  fonts: FormatAnalysis['fonts'],
  images: FormatAnalysis['images'],
  tables: FormatAnalysis['tables'],
  headersFooters: FormatAnalysis['headersFooters']
): number {
  let score = 100;

  // Deduct points for issues
  if (layout.hasMultiColumn) {
    score -= 20;
  }
  if (images.hasImages) {
    score -= 25;
  }
  if (tables.hasTables) {
    score -= 15;
  }
  if (headersFooters.hasHeader || headersFooters.hasFooter) {
    score -= 10;
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Generate format suggestions
 */
function generateFormatSuggestions(
  layout: FormatAnalysis['layout'],
  fonts: FormatAnalysis['fonts'],
  images: FormatAnalysis['images'],
  tables: FormatAnalysis['tables'],
  headersFooters: FormatAnalysis['headersFooters']
): string[] {
  const suggestions: string[] = [];

  if (layout.hasMultiColumn) {
    suggestions.push('Use a single-column layout for better ATS compatibility');
    suggestions.push('Avoid side-by-side formatting (dates and job titles should be on separate lines)');
  }

  if (images.hasImages) {
    suggestions.push('Remove all images, graphics, and logos from your resume');
    suggestions.push('If your PDF is scanned, convert it to a text-based PDF');
    suggestions.push('Replace image-based skill bars with plain text lists');
  }

  if (tables.hasTables) {
    suggestions.push('Convert tables to plain text bullet points');
    suggestions.push('Use simple lists instead of table structures');
  }

  if (headersFooters.hasHeader || headersFooters.hasFooter) {
    suggestions.push('Move important information from headers/footers to the main body');
    suggestions.push('Ensure contact information is in plain text in the main document');
  }

  if (suggestions.length === 0) {
    suggestions.push('Format looks good! Your resume appears to be ATS-friendly in terms of layout.');
  }

  return suggestions;
}
