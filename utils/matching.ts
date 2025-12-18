import { WordEntry, RichDictionaryResult } from "../types";
import { normalizeEnglishText } from "./text-processing";

// 常见中文停用词/助词
const CHINESE_STOP_WORDS = new Set(['的', '了', '和', '是', '在', '之', '与', '或', '等', '及', '其', '这', '那', '个']);

const calculateSimilarity = (segment: string, definition: string): number => {
    if (!segment || !definition) return 0;
    if (segment === definition) return 1.0;
    const filterText = (text: string) => text.split('').filter(c => !CHINESE_STOP_WORDS.has(c)).join('');
    const cleanSeg = filterText(segment);
    const cleanDef = filterText(definition);
    if (!cleanSeg || !cleanDef) return 0;
    if (cleanSeg.length === 1 || cleanDef.length === 1) return cleanSeg === cleanDef ? 1.0 : 0;
    const segChars = new Set(cleanSeg.split(''));
    const defChars = new Set(cleanDef.split(''));
    let intersectionCount = 0;
    segChars.forEach(char => { if (defChars.has(char)) intersectionCount++; });
    return (2.0 * intersectionCount) / (cleanSeg.length + cleanDef.length);
};

/**
 * 核心匹配逻辑：在中文源文本中寻找可以被替换的单词
 * 返回匹配的中文文本、对应的词条、以及在译文中实际出现的英文形态
 */
export const findFuzzyMatches = (
    sourceText: string, 
    candidates: WordEntry[], 
    translatedText: string = ""
): { text: string, entry: WordEntry, matchedWord: string }[] => {
    
    const matches: { text: string, entry: WordEntry, matchedWord: string, index: number }[] = [];
    const normalizedTrans = ` ${normalizeEnglishText(translatedText).toLowerCase()} `; // 加空格方便全词匹配

    // 1. 识别在译文中出现的英文词态
    const validMatchesWithForm = candidates.map(entry => {
        const baseWord = entry.text.toLowerCase();
        const inflections = (entry.inflections || []).map(i => i.toLowerCase());
        
        // 合并原型和所有变体，按长度降序排列（防止 matches 匹配到 match）
        const allForms = Array.from(new Set([baseWord, ...inflections])).sort((a, b) => b.length - a.length);
        
        // 寻找第一个出现在译文中的形式
        const foundForm = allForms.find(form => normalizedTrans.includes(` ${form} `) || normalizedTrans.includes(` ${form}s `) || normalizedTrans.includes(` ${form}es `));

        if (foundForm || !translatedText) {
            return { entry, matchedWord: foundForm || entry.text };
        }
        return null;
    }).filter((item): item is { entry: WordEntry, matchedWord: string } => item !== null);

    // 2. 在中文原文中搜索这些词条对应的中文释义
    validMatchesWithForm.forEach(({ entry, matchedWord }) => {
        const definitions = entry.translation
            ?.split(/[,;，；\s/]+/) 
            .map(d => d.trim())
            .filter(d => d.length > 0) || [];

        definitions.forEach(def => {
            let startIndex = 0;
            let foundIndex = sourceText.indexOf(def, startIndex);
            
            while (foundIndex !== -1) {
                matches.push({
                    text: def,
                    entry: entry,
                    matchedWord: matchedWord,
                    index: foundIndex
                });
                startIndex = foundIndex + 1; 
                foundIndex = sourceText.indexOf(def, startIndex);
            }
        });
    });

    // 3. 贪婪匹配去重
    matches.sort((a, b) => b.text.length - a.text.length || a.index - b.index);

    const finalResults: typeof matches = [];
    const occupiedRanges: [number, number][] = [];

    for (const match of matches) {
        const start = match.index;
        const end = match.index + match.text.length;
        const isOverlapping = occupiedRanges.some(([os, oe]) => (start >= os && start < oe) || (end > os && end <= oe));

        if (!isOverlapping) {
            finalResults.push(match);
            occupiedRanges.push([start, end]);
        }
    }

    return finalResults.map(r => ({ text: r.text, entry: r.entry, matchedWord: r.matchedWord }));
};

/**
 * 激进模式匹配 (Aggressive Matching)
 * 同样需要支持词态识别
 */
export const findAggressiveMatches = (
    sourceText: string,
    missedEntry: WordEntry,
    richData: RichDictionaryResult,
    translatedText: string = ""
): { text: string, entry: WordEntry, matchedWord: string }[] => {
    
    // 首先确定英文形态
    const normTrans = ` ${normalizeEnglishText(translatedText).toLowerCase()} `;
    const allForms = Array.from(new Set([missedEntry.text.toLowerCase(), ...(missedEntry.inflections || []).map(i => i.toLowerCase())])).sort((a, b) => b.length - a.length);
    const matchedWord = allForms.find(f => normTrans.includes(` ${f} `)) || missedEntry.text;

    const allDefinitions = new Set<string>();
    richData.meanings.forEach(m => {
        if(m.defCn) m.defCn.split(/[,;，；/]/).forEach(d => allDefinitions.add(d.trim()));
    });
    
    const definitions = Array.from(allDefinitions).filter(d => d.length > 0 && /[\u4e00-\u9fa5]/.test(d));
    if (definitions.length === 0) return [];

    const segmenter = new (Intl as any).Segmenter('zh-CN', { granularity: 'word' });
    const segments = Array.from((segmenter as any).segment(sourceText)).map((s: any) => s.segment as string);
    const candidates: string[] = [];
    segments.forEach((s, i) => {
        if (/[\u4e00-\u9fa5]/.test(s)) {
            candidates.push(s);
            if (segments[i+1]) candidates.push(s + segments[i+1]);
        }
    });

    const uniqueCandidates = Array.from(new Set(candidates));
    let bestMatchText = "";
    let bestScore = 0;
    const THRESHOLD = 0.65;

    for (const cand of uniqueCandidates) {
        for (const def of definitions) {
            const score = calculateSimilarity(cand, def);
            if (score >= THRESHOLD) {
                if (cand.length > bestMatchText.length || (cand.length === bestMatchText.length && score > bestScore)) {
                    bestScore = score;
                    bestMatchText = cand;
                }
            }
        }
    }

    if (bestMatchText) {
        return [{ text: bestMatchText, entry: missedEntry, matchedWord }];
    }

    return [];
};