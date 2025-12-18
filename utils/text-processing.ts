
/**
 * 将文本拆分为句子数组
 * 保留标点符号在句子末尾
 */
export const splitTextIntoSentences = (text: string): string[] => {
    if (!text) return [];
    
    // 匹配中文句号、感叹号、问号，以及英文对应标点
    // 这是一个简单的拆分逻辑，可以根据需要增强
    const segmenter = new RegExp(/([。！？.!?]+)/);
    
    const parts = text.split(segmenter);
    const sentences: string[] = [];
    
    for (let i = 0; i < parts.length; i += 2) {
        const sentence = parts[i];
        const punctuation = parts[i + 1] || '';
        
        if (sentence.trim()) {
            sentences.push(sentence + punctuation);
        }
    }
    
    return sentences;
};

/**
 * 清理并标准化英文文本以便匹配
 * (移除标点，转小写，用于存在性检查)
 */
export const normalizeEnglishText = (text: string): string => {
    return text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ");
};
