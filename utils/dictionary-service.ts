
import { RichDictionaryResult, WordEntry } from "../types";
import { browser } from "wxt/browser";

export const fetchRichWordDetails = async (word: string): Promise<RichDictionaryResult> => {
  const response = await browser.runtime.sendMessage({
    action: 'LOOKUP_WORD_RICH',
    text: word
  });

  if (!response) throw new Error("Service unavailable");
  if (!response.success) throw new Error(response.error || "Lookup failed");

  return response.data;
};

/**
 * Adapter for bulk import in WordManager.tsx.
 * Maps the RichDictionaryResult to an array of Partial<WordEntry> to satisfy the legacy import logic.
 */
export const fetchWordDetails = async (word: string, preferredTranslation?: string, _engine?: any): Promise<Partial<WordEntry>[]> => {
    try {
        const result = await fetchRichWordDetails(word);
        
        let validMeanings = result.meanings;
        
        // If a preferred translation is provided (e.g. from file import), try to find the matching meaning card
        if (preferredTranslation) {
             const match = result.meanings.find(m => m.defCn.includes(preferredTranslation));
             if (match) validMeanings = [match];
        }

        // Map meanings to WordEntry objects
        return validMeanings.map(m => ({
            text: result.text,
            phoneticUs: result.phoneticUs,
            phoneticUk: result.phoneticUk,
            translation: m.defCn,
            englishDefinition: m.defEn,
            contextSentence: '', 
            mixedSentence: '',
            dictionaryExample: m.example,
            dictionaryExampleTranslation: m.exampleTrans,
            inflections: [...new Set([...result.inflections, ...m.inflections])],
            tags: m.tags,
            importance: m.importance,
            cocaRank: m.cocaRank
        }));

    } catch (e) {
        // Fallback or silence error for bulk import flow
        return [];
    }
};
