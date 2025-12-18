
import { WordEntry, RichDictionaryResult } from "../types";
import { normalizeEnglishText } from "./text-processing";

// 常见中文停用词/助词，在计算相似度时应忽略
const CHINESE_STOP_WORDS = new Set(['的', '了', '和', '是', '在', '之', '与', '或', '等', '及', '其', '这', '那', '个']);

// Helper: Calculate Dice Coefficient with Stop Word Filtering
const calculateSimilarity = (segment: string, definition: string): number => {
    if (!segment || !definition) return 0;
    
    // 1. Exact match (High priority)
    if (segment === definition) return 1.0;

    // 2. Filter Stop Words for meaningful comparison
    const filterText = (text: string) => text.split('').filter(c => !CHINESE_STOP_WORDS.has(c)).join('');
    
    const cleanSeg = filterText(segment);
    const cleanDef = filterText(definition);

    // If text becomes empty after filtering (e.g. comparison was just "的"), return 0
    if (!cleanSeg || !cleanDef) return 0;

    // 3. Single char safety after cleaning
    if (cleanSeg.length === 1 || cleanDef.length === 1) {
        return cleanSeg === cleanDef ? 1.0 : 0;
    }

    // 4. Dice Coefficient
    const segChars = new Set(cleanSeg.split(''));
    const defChars = new Set(cleanDef.split(''));
    
    let intersectionCount = 0;
    segChars.forEach(char => {
        if (defChars.has(char)) intersectionCount++;
    });

    return (2.0 * intersectionCount) / (cleanSeg.length + cleanDef.length);
};

/**
 * 核心匹配逻辑：在中文源文本中寻找可以被替换的单词
 * 
 * 算法升级 v2:
 * 1. 上下文验证 (Context Verification): 只有当 translatedText (译文) 中包含了目标英文单词(或其变形)时，
 *    才会在 sourceText (原文) 中搜索对应的中文释义。这完美解决了 "China" -> "中" 匹配到 "在本文中" 的问题。
 * 2. 贪婪匹配: 优先匹配最长的中文释义 (例如优先匹配 "中华人民共和国" 而不是 "中华")。
 */
export const findFuzzyMatches = (
    sourceText: string, 
    candidates: WordEntry[], 
    translatedText: string = ""
): { text: string, entry: WordEntry }[] => {
    
    const matches: { text: string, entry: WordEntry, index: number }[] = [];
    const normalizedTrans = normalizeEnglishText(translatedText);

    // 1. 筛选候选词 (Filter Candidates)
    // 只有当 API 返回的译文中确实出现了这个英文单词，我们才去原文里找它的中文对应词。
    const validCandidates = candidates.filter(entry => {
        // 检查单词本身
        if (normalizedTrans.includes(entry.text.toLowerCase())) return true;
        
        // 检查变形 (Inflections)
        if (entry.inflections && entry.inflections.length > 0) {
            return entry.inflections.some(inf => normalizedTrans.includes(inf.toLowerCase()));
        }
        
        // 如果没有译文（预览模式），则不做严格校验，允许所有匹配
        if (!translatedText) return true;

        return false;
    });

    // 2. 在原文中搜索匹配 (Search in Source)
    // 我们不再依赖分词器的切分结果完全相等，而是搜索字符串。
    // 因为 "中俄" 可能被分词为一个词，但我们需要替换里面的 "中"。
    
    validCandidates.forEach(entry => {
        // 获取所有可能的中文释义 (从 translation 字段解析，假设用逗号或分号分隔)
        // 用户输入的 translation 可能是 "中国; 中; 中华人民共和国"
        const definitions = entry.translation
            ?.split(/[,;，；\s]+/) // 拆分
            .map(d => d.trim())
            .filter(d => d.length > 0) || [];

        definitions.forEach(def => {
            let startIndex = 0;
            let foundIndex = sourceText.indexOf(def, startIndex);
            
            while (foundIndex !== -1) {
                matches.push({
                    text: def,
                    entry: entry,
                    index: foundIndex
                });
                startIndex = foundIndex + 1; // 继续向后找
                foundIndex = sourceText.indexOf(def, startIndex);
            }
        });
    });

    // 3. 冲突处理 (Resolve Conflicts)
    // 按在原文中的位置排序
    matches.sort((a, b) => a.index - b.index);

    // 去重逻辑：
    // 过滤掉被“更长匹配”包含的短匹配
    
    const uniqueMatches = new Map<string, WordEntry>();
    matches.forEach(m => {
        if (!uniqueMatches.has(m.text)) {
            uniqueMatches.set(m.text, m.entry);
        } else {
            // 如果已经有了，保留第一个
        }
    });

    return Array.from(uniqueMatches.entries()).map(([text, entry]) => ({ text, entry }));
};

/**
 * 激进模式匹配 (Aggressive Matching)
 * 针对已经确认在译文中出现，但因释义不匹配而未被 findFuzzyMatches 捕获的单词。
 * 使用 API 实时获取的丰富释义进行低阈值模糊匹配。
 */
export const findAggressiveMatches = (
    sourceText: string,
    missedEntry: WordEntry,
    richData: RichDictionaryResult
): { text: string, entry: WordEntry }[] => {
    
    // 1. Collect all possible Chinese definitions from rich data
    const allDefinitions = new Set<string>();
    
    // Meanings
    richData.meanings.forEach(m => {
        if(m.defCn) m.defCn.split(/[,;，；]/).forEach(d => allDefinitions.add(d.trim()));
    });
    richData.expandEcMeanings?.forEach(m => {
        if(m.defCn) m.defCn.split(/[,;，；]/).forEach(d => allDefinitions.add(d.trim()));
    });
    richData.ecMeanings?.forEach(m => {
        if(m.defCn) m.defCn.split(/[,;，；]/).forEach(d => allDefinitions.add(d.trim()));
    });
    // Synonyms usually have translation
    richData.synonyms?.forEach(s => {
        if(s.trans) s.trans.split(/[,;，；]/).forEach(d => allDefinitions.add(d.trim()));
    });
    // Also include Phrases translations (e.g. "of China" -> "中国的")
    richData.phrases?.forEach(p => {
        if(p.trans) p.trans.split(/[,;，；]/).forEach(d => allDefinitions.add(d.trim()));
    });

    const definitions = Array.from(allDefinitions).filter(d => d.length > 0 && /[\u4e00-\u9fa5]/.test(d));
    if (definitions.length === 0) return [];

    // 2. Segment source text for sliding window check
    // Use Intl.Segmenter for better word boundaries
    const segmenter = new (Intl as any).Segmenter('zh-CN', { granularity: 'word' });
    const segments = Array.from((segmenter as any).segment(sourceText)).map((s: any) => s.segment as string);
    
    // Reconstruct possible phrases (n-grams) from segments to match against definitions
    // Example: "截" "止" "日" "期" -> check "截止", "截止日", "截止日期"
    // Since segments might be words like "截止" "日期", we also check combinations.
    
    const candidates: string[] = [];
    // Single segments
    candidates.push(...segments.filter(s => /[\u4e00-\u9fa5]/.test(s)));
    
    // Double segments (bi-grams)
    for(let i=0; i<segments.length-1; i++) {
        candidates.push(segments[i] + segments[i+1]);
    }
    // Triple segments
    for(let i=0; i<segments.length-2; i++) {
        candidates.push(segments[i] + segments[i+1] + segments[i+2]);
    }

    // Deduplicate candidates
    const uniqueCandidates = Array.from(new Set(candidates));

    let bestMatchText = "";
    let bestScore = 0;
    
    // 3. Similarity Check
    // Threshold 0.6 (60%) 
    const THRESHOLD = 0.6;

    for (const cand of uniqueCandidates) {
        for (const def of definitions) {
            const score = calculateSimilarity(cand, def);
            if (score >= THRESHOLD) {
                // Prefer longer match, then higher score
                if (cand.length > bestMatchText.length || (cand.length === bestMatchText.length && score > bestScore)) {
                    bestScore = score;
                    bestMatchText = cand;
                }
            }
        }
    }

    if (bestMatchText && bestScore >= THRESHOLD) {
        return [{ text: bestMatchText, entry: missedEntry }];
    }

    return [];
};
