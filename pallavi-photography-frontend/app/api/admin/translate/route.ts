import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { translateText, translateMarkdown } from "@/lib/translation-utils";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify session
    const session = await auth();
    if (!session || !(session as any).accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const { text, isMarkdown } = body;

    if (!text) {
      return NextResponse.json({ error: "Missing 'text' parameter" }, { status: 400 });
    }

    // 3. Translate text
    let translatedText = "";
    if (isMarkdown) {
      translatedText = await translateMarkdown(text);
    } else {
      translatedText = await translateText(text);
    }

    return NextResponse.json({ translatedText });
  } catch (error: any) {
    console.error("Translation API error:", error);
    return NextResponse.json({ error: error.message || "Failed to translate text" }, { status: 500 });
  }
}
