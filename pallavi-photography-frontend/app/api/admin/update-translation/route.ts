import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateTranslationKey, bulkUpdateTranslations } from "@/lib/translation-utils";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify admin session
    const session = await auth();
    if (!session || !(session as any).accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request parameters
    const body = await req.json();
    const { namespace, key, value, frenchValue, bulk, updates, frenchUpdates } = body;

    if (!namespace) {
      return NextResponse.json({ error: "Missing 'namespace' parameter" }, { status: 400 });
    }

    if (bulk && updates) {
      // Perform bulk updates
      await bulkUpdateTranslations(namespace, updates, frenchUpdates);
      return NextResponse.json({ success: true, message: "Bulk translations updated successfully" });
    } else if (key && value !== undefined) {
      // Perform single key update
      await updateTranslationKey(namespace, key, value, frenchValue);
      return NextResponse.json({ success: true, message: "Translation key updated successfully" });
    } else {
      return NextResponse.json({ error: "Missing required fields ('key' and 'value' or 'bulk' and 'updates')" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Translation Route Handler error:", error);
    return NextResponse.json({ error: error.message || "Failed to update translations" }, { status: 500 });
  }
}
