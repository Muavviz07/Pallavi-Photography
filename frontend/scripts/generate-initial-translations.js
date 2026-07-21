const fs = require('fs');
const path = require('path');

const GOOGLE_TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t';

async function translateText(text) {
  if (!text || text.trim() === '') return '';
  try {
    const url = `${GOOGLE_TRANSLATE_API}&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data[0]) {
        const translated = data[0].map((item) => item[0] || '').join('');
        if (translated) return translated.trim();
      }
    }
  } catch (error) {
    console.error(`Translation failed for: "${text.substring(0, 30)}..."`, error);
  }
  return text; // Fallback to original text
}

async function translateObject(obj) {
  const translated = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // If it is a blog content block containing Markdown-like lines, translate line by line
      if (key.startsWith('content_')) {
        const lines = value.split('\n');
        const translatedLines = [];
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === '') {
            translatedLines.push('');
            continue;
          }
          if (trimmed.startsWith('>')) {
            const tr = await translateText(trimmed.substring(1).trim());
            translatedLines.push(`> ${tr}`);
            continue;
          }
          if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
            const tr = await translateText(trimmed.substring(1).trim());
            translatedLines.push(`- ${tr}`);
            continue;
          }
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
          if (numMatch) {
            const tr = await translateText(numMatch[2]);
            translatedLines.push(`${numMatch[1]}. ${tr}`);
            continue;
          }
          const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
          if (headingMatch) {
            const tr = await translateText(headingMatch[2]);
            translatedLines.push(`${headingMatch[1]} ${tr}`);
            continue;
          }
          translatedLines.push(await translateText(line));
        }
        translated[key] = translatedLines.join('\n');
      } else {
        translated[key] = await translateText(value);
      }
      console.log(`  ✓ Translated key "${key}"`);
    } else if (typeof value === 'object' && value !== null) {
      translated[key] = await translateObject(value);
    } else {
      translated[key] = value;
    }
  }
  return translated;
}

async function main() {
  const localesPath = path.join(__dirname, '../public/locales');
  const enPath = path.join(localesPath, 'en');
  const frPath = path.join(localesPath, 'fr');
  
  if (!fs.existsSync(frPath)) {
    fs.mkdirSync(frPath, { recursive: true });
  }
  
  const files = fs.readdirSync(enPath).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    const enFile = path.join(enPath, file);
    const frFile = path.join(frPath, file);
    
    const enContent = JSON.parse(fs.readFileSync(enFile, 'utf8'));
    console.log(`\nTranslating file: ${file}...`);
    
    const frContent = await translateObject(enContent);
    
    fs.writeFileSync(frFile, JSON.stringify(frContent, null, 2), 'utf8');
    console.log(`✓ Generated: ${file}`);
  }
  
  console.log('\n✅ Initial French translations generated successfully!');
}

main().catch(console.error);
