import fs from 'fs';
import path from 'path';

// Stable free Google Translate client API
const GOOGLE_TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t';

// Mirrors for LibreTranslate if needed
const LIBRETRANSLATE_MIRRORS = [
  'https://libretranslate.de/translate',
  'https://translate.argosopentech.com/translate',
  'https://translate.terraprint.co/translate'
];

/**
 * Translates a plain text string from English to French using a robust translator chain.
 */
export async function translateText(text: string, targetLang: string = 'fr'): Promise<string> {
  if (!text || text.trim() === '') return '';
  
  // Try Google Translate GTX API first (very fast, reliable, no key needed)
  try {
    const url = `${GOOGLE_TRANSLATE_API}&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data[0]) {
        const translated = data[0].map((item: any) => item[0] || '').join('');
        if (translated) return translated.trim();
      }
    }
  } catch (error) {
    console.warn('Google Translate API error:', error);
  }

  // Fallback to LibreTranslate mirrors
  for (const mirror of LIBRETRANSLATE_MIRRORS) {
    try {
      const response = await fetch(mirror, {
        method: 'POST',
        body: JSON.stringify({
          q: text,
          source: 'en',
          target: targetLang,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.translatedText) {
          return data.translatedText.trim();
        }
      }
    } catch (error) {
      console.warn(`Mirror ${mirror} failed:`, error);
    }
  }

  console.error(`All translation services failed for: "${text.substring(0, 30)}...". Falling back to English.`);
  return text; // Fallback to original text
}

/**
 * Translates a Markdown block, preserving formatting syntax.
 */
export async function translateMarkdown(markdown: string): Promise<string> {
  if (!markdown) return '';
  const lines = markdown.split('\n');
  const translatedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Pass through empty lines
    if (trimmed === '') {
      translatedLines.push('');
      continue;
    }

    // Preserve Blockquotes
    if (trimmed.startsWith('>')) {
      const content = trimmed.substring(1).trim();
      const translatedContent = await translateText(content);
      translatedLines.push(`> ${translatedContent}`);
      continue;
    }

    // Preserve numbered lists (e.g. "1. Item")
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const prefix = numMatch[1];
      const content = numMatch[2];
      const translatedContent = await translateText(content);
      translatedLines.push(`${prefix}. ${translatedContent}`);
      continue;
    }

    // Preserve standard bullet lists
    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      const symbol = trimmed.charAt(0);
      const content = trimmed.substring(1).trim();
      const translatedContent = await translateText(content);
      translatedLines.push(`${symbol} ${translatedContent}`);
      continue;
    }

    // Preserve Markdown Headings (#, ##, ###)
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const hashes = headingMatch[1];
      const content = headingMatch[2];
      const translatedContent = await translateText(content);
      translatedLines.push(`${hashes} ${translatedContent}`);
      continue;
    }

    // Standard paragraph or bold inline text
    const translatedLine = await translateText(line);
    translatedLines.push(translatedLine);
  }

  return translatedLines.join('\n');
}

/**
 * Updates a specific key in both the English and French translation JSON files.
 * If frenchValue is not provided, it will be automatically generated.
 */
export async function updateTranslationKey(
  namespace: string,
  key: string,
  englishValue: string,
  frenchValue?: string
): Promise<void> {
  const localesPath = path.join(process.cwd(), 'public/locales');
  
  // Ensure directories exist
  const enDir = path.join(localesPath, 'en');
  const frDir = path.join(localesPath, 'fr');
  
  if (!fs.existsSync(enDir)) fs.mkdirSync(enDir, { recursive: true });
  if (!fs.existsSync(frDir)) fs.mkdirSync(frDir, { recursive: true });

  // Update English JSON
  const enFilePath = path.join(enDir, `${namespace}.json`);
  let enContent: Record<string, string> = {};
  if (fs.existsSync(enFilePath)) {
    try {
      enContent = JSON.parse(fs.readFileSync(enFilePath, 'utf8'));
    } catch (e) {
      console.error(`Error reading/parsing ${enFilePath}`, e);
    }
  }
  enContent[key] = englishValue;
  fs.writeFileSync(enFilePath, JSON.stringify(enContent, null, 2), 'utf8');
  
  // Update French JSON
  const frFilePath = path.join(frDir, `${namespace}.json`);
  let frContent: Record<string, string> = {};
  if (fs.existsSync(frFilePath)) {
    try {
      frContent = JSON.parse(fs.readFileSync(frFilePath, 'utf8'));
    } catch (e) {
      console.error(`Error reading/parsing ${frFilePath}`, e);
    }
  }

  if (frenchValue) {
    frContent[key] = frenchValue;
  } else {
    // If the namespace is 'blogs', use translateMarkdown for the body content
    if (namespace === 'blogs' && key.startsWith('content_')) {
      frContent[key] = await translateMarkdown(englishValue);
    } else {
      frContent[key] = await translateText(englishValue);
    }
  }
  
  fs.writeFileSync(frFilePath, JSON.stringify(frContent, null, 2), 'utf8');
  console.log(`[Locale Update] Saved key "${key}" in namespace "${namespace}"`);
}

/**
 * Updates multiple keys at once in the target namespace.
 */
export async function bulkUpdateTranslations(
  namespace: string,
  updates: Record<string, string>,
  frenchUpdates?: Record<string, string>
): Promise<void> {
  const localesPath = path.join(process.cwd(), 'public/locales');
  const enFilePath = path.join(localesPath, 'en', `${namespace}.json`);
  const frFilePath = path.join(localesPath, 'fr', `${namespace}.json`);

  // Ensure directories exist
  const enDir = path.dirname(enFilePath);
  const frDir = path.dirname(frFilePath);
  if (!fs.existsSync(enDir)) fs.mkdirSync(enDir, { recursive: true });
  if (!fs.existsSync(frDir)) fs.mkdirSync(frDir, { recursive: true });

  let enContent: Record<string, string> = {};
  let frContent: Record<string, string> = {};

  if (fs.existsSync(enFilePath)) {
    try {
      enContent = JSON.parse(fs.readFileSync(enFilePath, 'utf8'));
    } catch (e) {}
  }
  
  if (fs.existsSync(frFilePath)) {
    try {
      frContent = JSON.parse(fs.readFileSync(frFilePath, 'utf8'));
    } catch (e) {}
  }

  for (const [key, englishValue] of Object.entries(updates)) {
    enContent[key] = englishValue;
    
    // If explicit French translation is provided, use it
    if (frenchUpdates && frenchUpdates[key]) {
      frContent[key] = frenchUpdates[key];
    } else {
      // Auto-translate
      if (namespace === 'blogs' && key.startsWith('content_')) {
        frContent[key] = await translateMarkdown(englishValue);
      } else {
        frContent[key] = await translateText(englishValue);
      }
    }
  }

  fs.writeFileSync(enFilePath, JSON.stringify(enContent, null, 2), 'utf8');
  fs.writeFileSync(frFilePath, JSON.stringify(frContent, null, 2), 'utf8');
  console.log(`[Locale Bulk Update] Saved ${Object.keys(updates).length} keys in namespace "${namespace}"`);
}
