
import { WordCategory, StyleConfig, OriginalTextConfig } from "../types";
import { getStyleStr } from "./style-helper";

/**
 * Builds the HTML string for a replaced word, applying layout and styles.
 */
export const buildReplacementHtml = (
    targetChinese: string, 
    englishReplacement: string, 
    category: WordCategory,
    styles: Record<WordCategory, StyleConfig>,
    originalTextConfig: OriginalTextConfig,
    entryId: string // Added entryId for interaction
): string => {
    const transStyle = styles[category];
    const origStyle = originalTextConfig.style;
    const activeLayout = originalTextConfig.activeMode === 'horizontal' ? originalTextConfig.horizontal : originalTextConfig.vertical;

    // Wrappers
    const transPrefix = activeLayout.wrappers.translation.prefix;
    const transSuffix = activeLayout.wrappers.translation.suffix;
    const origPrefix = activeLayout.wrappers.original.prefix;
    const origSuffix = activeLayout.wrappers.original.suffix;

    const isVertical = originalTextConfig.activeMode === 'vertical';
    
    // Determine baseline roles for Vertical mode
    const baselineTarget = activeLayout.baselineTarget || 'original';
    const isTransBase = baselineTarget === 'translation';

    // Style Overrides for Vertical Alignment
    
    const transBaseStyle = getStyleStr(transStyle);
    const origBaseStyle = getStyleStr(origStyle);

    let transOverride = '';
    let origOverride = '';

    if (isVertical) {
        if (isTransBase) {
            // Translation is Base
            // Force font-size to ensure it sticks, overriding any potential inheritance issues or defaults
            transOverride = `line-height: normal; vertical-align: baseline; font-size: ${transStyle.fontSize};`;
            // Original is RT -> Compact
            origOverride = 'line-height: 1;'; 
        } else {
            // Original is Base
            origOverride = `line-height: normal; vertical-align: baseline; font-size: ${origStyle.fontSize};`;
            // Translation is RT -> Compact
            transOverride = 'line-height: 1;';
        }
    }

    // 1. Translation Element
    // Added data-entry-id and removed title attribute
    const transInner = `<span style="${transBaseStyle} border-bottom: 2px solid transparent; ${transOverride}" 
       class="context-lingo-target"
       data-entry-id="${entryId}"
       data-original-text="${targetChinese}"
       onmouseover="this.style.borderColor='rgba(59, 130, 246, 0.5)'" 
       onmouseout="this.style.borderColor='transparent'"
       >${transPrefix}${englishReplacement}${transSuffix}</span>`;

    // 2. Original Element (Optional)
    let origInner = '';
    if (originalTextConfig.show) {
        origInner = `<span style="${origBaseStyle} white-space: nowrap; ${origOverride}">${origPrefix}${targetChinese}${origSuffix}</span>`;
    }

    // 3. Layout Construction
    if (!originalTextConfig.show) {
        return `<span class="context-lingo-wrapper" style="margin: 0; padding: 0; display: inline;">${transInner}</span>`;
    }

    if (originalTextConfig.activeMode === 'horizontal') {
        const first = activeLayout.translationFirst ? transInner : origInner;
        const second = activeLayout.translationFirst ? origInner : transInner;
        
        // Use display: inline to prevent justification gaps
        return `<span class="context-lingo-wrapper" style="margin: 0; padding: 0; display: inline;">${first}${second}</span>`;
    } else {
        // Vertical Layout (Ruby)
        const baseInner = isTransBase ? transInner : origInner;
        const rtInner = isTransBase ? origInner : transInner;

        let rubyPosition = 'over';
        
        if (activeLayout.translationFirst) {
            // Visual Order: Trans (Top) -> Orig (Bottom)
            if (isTransBase) {
                rubyPosition = 'under';
            } else {
                rubyPosition = 'over';
            }
        } else {
            // Visual Order: Orig (Top) -> Trans (Bottom)
            if (isTransBase) {
                rubyPosition = 'over';
            } else {
                rubyPosition = 'under';
            }
        }

        // ruby-align: start and text-align: left are crucial for fixing left whitespace
        return `<ruby class="context-lingo-wrapper" style="ruby-position: ${rubyPosition}; margin: 0; padding: 0; ruby-align: start; -webkit-ruby-align: start; text-align: left;">${baseInner}<rt style="font-size: 100%; font-family: inherit;">${rtInner}</rt></ruby>`;
    }
};
