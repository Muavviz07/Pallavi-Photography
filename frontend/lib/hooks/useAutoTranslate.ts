import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/components/LanguageProvider";

// Translation cache to avoid hitting the API repeatedly
const translationCache = new Map<string, string>();

async function translateBatch(texts: string[], targetLang: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const uncachedTexts: string[] = [];

  for (const text of texts) {
    const cacheKey = `${text}:${targetLang}`;
    if (translationCache.has(cacheKey)) {
      result[text] = translationCache.get(cacheKey)!;
    } else {
      uncachedTexts.push(text);
    }
  }

  if (uncachedTexts.length === 0) {
    return result;
  }

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: uncachedTexts, targetLang }),
    });

    if (res.ok) {
      const { translations } = await res.json();
      uncachedTexts.forEach((text, index) => {
        const translated = translations[index] || text;
        const cacheKey = `${text}:${targetLang}`;
        translationCache.set(cacheKey, translated);
        result[text] = translated;
      });
    } else {
      uncachedTexts.forEach(text => {
        result[text] = text;
      });
    }
  } catch (error) {
    console.error("Batch translation error:", error);
    uncachedTexts.forEach(text => {
      result[text] = text;
    });
  }

  return result;
}

export function useAutoTranslate() {
  const { lang } = useTranslation("common");
  const pathname = usePathname();
  const prevLangRef = useRef(lang);

  useEffect(() => {
    // Disable translation in the admin panel to avoid mangling form inputs and edit fields
    if (!pathname || pathname.startsWith("/delq-portal") || pathname.startsWith("/login")) {
      prevLangRef.current = lang;
      return;
    }

    const isFrench = lang === "FR";
    const prevLang = prevLangRef.current;
    prevLangRef.current = lang;

    // Filter out numbers, punctuation, short symbols, and very long text items
    const shouldTranslate = (text: string) => {
      const trimmed = text.trim();
      return (
        trimmed.length > 1 &&
        trimmed.length < 1000 &&
        !/^\d+$/.test(trimmed) &&
        !trimmed.match(/^[,.!?;:\-()\"'\s#+*&%@_=|\\/<>]+$/i)
      );
    };

    let observer: MutationObserver | null = null;
    let pendingNodes: Text[] = [];
    let isTranslating = false;

    const translateNodes = async (nodes: Text[]) => {
      pendingNodes.push(...nodes);

      if (isTranslating || pendingNodes.length === 0) return;
      isTranslating = true;

      while (pendingNodes.length > 0) {
        const currentBatch = [...pendingNodes];
        pendingNodes = [];

        // Filter text nodes
        const filtered = currentBatch.filter(n => {
          const parent = n.parentElement;
          if (!parent) return false;
          
          // Skip code, styles, scripts, svgs, noscripts, etc.
          if (parent.closest("script, style, noscript, iframe, svg, pre, code")) {
            return false;
          }

          const orig = (n as any).originalText || n.textContent || "";
          return shouldTranslate(orig);
        });

        if (filtered.length === 0) {
          continue;
        }

        // Collect unique original texts
        const uniqueTexts = Array.from(new Set(filtered.map(n => {
          if (!(n as any).originalText) {
            (n as any).originalText = n.textContent || "";
          }
          return (n as any).originalText;
        })));

        // Fetch batch translation
        const translationMap = await translateBatch(uniqueTexts, "fr");

        // Temporarily disconnect observer during DOM modifications to prevent loops
        if (observer) observer.disconnect();

        // Apply translations
        filtered.forEach(n => {
          const orig = (n as any).originalText;
          const translated = translationMap[orig];
          if (translated && n.textContent !== translated) {
            n.textContent = translated;
          }
        });

        // Reconnect observer
        if (observer && isFrench) {
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
          });
        }
      }

      isTranslating = false;
    };

    const revertNodes = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = walker.nextNode())) {
        const textNode = node as Text;
        if ((textNode as any).originalText !== undefined && textNode.textContent !== (textNode as any).originalText) {
          textNode.textContent = (textNode as any).originalText;
        }
      }
    };

    if (!isFrench) {
      // Revert everything back to original English
      if (prevLang === "FR") {
        revertNodes();
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }
      return;
    }

    // Collect all initial text nodes
    const allTextNodes: Text[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      allTextNodes.push(node as Text);
    }

    translateNodes(allTextNodes);

    // Setup mutation observer to watch for dynamic DOM updates and additions
    observer = new MutationObserver((mutations) => {
      const nodesToTranslate: Text[] = [];

      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") {
          const textNode = mutation.target as Text;
          const textVal = textNode.textContent || "";
          const cacheKey = `${(textNode as any).originalText || textVal}:fr`;
          const expectedTranslation = translationCache.get(cacheKey);
          if (textVal !== expectedTranslation) {
            (textNode as any).originalText = textVal;
            nodesToTranslate.push(textNode);
          }
        } else if (mutation.type === "childList") {
          mutation.addedNodes.forEach((added) => {
            if (added.nodeType === Node.TEXT_NODE) {
              (added as any).originalText = added.textContent || "";
              nodesToTranslate.push(added as Text);
            } else if (added.nodeType === Node.ELEMENT_NODE) {
              // Ignore scripts, styles, and other metadata elements
              const tag = (added as HTMLElement).tagName?.toLowerCase();
              if (tag === "script" || tag === "style" || tag === "iframe") return;
              
              const elementWalker = document.createTreeWalker(added, NodeFilter.SHOW_TEXT, null);
              let childNode;
              while ((childNode = elementWalker.nextNode())) {
                (childNode as any).originalText = childNode.textContent || "";
                nodesToTranslate.push(childNode as Text);
              }
            }
          });
        }
      });

      if (nodesToTranslate.length > 0) {
        translateNodes(nodesToTranslate);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [lang, pathname]);
}
