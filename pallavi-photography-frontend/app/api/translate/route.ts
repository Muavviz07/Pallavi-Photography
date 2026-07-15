import { NextRequest, NextResponse } from "next/server";

async function fetchSingleTranslation(text: string, targetLang: string): Promise<string> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
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
  } catch (e) {
    console.error(`Fallback translation error for "${text}":`, e);
  }
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { texts, targetLang = 'fr' } = body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ translations: [] });
    }

    // 1. Attempt batch translation with newline delimiter first
    const joinedText = texts.join('\n');
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(joinedText)}`;
    
    let translations: string[] = [];
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        let translatedJoined = "";
        if (data && data[0]) {
          translatedJoined = data[0].map((item: any) => item[0] || '').join('');
        }
        translations = translatedJoined.split('\n').map(t => t.trim());
      }
    } catch (e) {
      console.warn("Batch translation error, falling back to individual:", e);
    }

    // 2. Check if batch translation succeeded and returned the correct length
    if (translations.length === texts.length) {
      return NextResponse.json({ translations });
    }

    // 3. Fallback: Translate individually (chunked in groups of 5 to respect rate limits)
    console.warn(`Translation split length mismatch. Expected: ${texts.length} Got: ${translations.length}. Falling back to individual translations.`);
    const individualTranslations: string[] = [];
    
    const chunkSize = 5;
    for (let i = 0; i < texts.length; i += chunkSize) {
      const chunk = texts.slice(i, i + chunkSize);
      const chunkPromises = chunk.map(text => fetchSingleTranslation(text, targetLang));
      const chunkResults = await Promise.all(chunkPromises);
      individualTranslations.push(...chunkResults);
    }

    return NextResponse.json({ translations: individualTranslations });
  } catch (error: any) {
    console.error("Public translation API error:", error);
    return NextResponse.json({ error: error.message || "Failed to translate" }, { status: 500 });
  }
}
