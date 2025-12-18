
import { StyleConfig } from "../types";

/**
 * Converts a StyleConfig object into a CSS string.
 * Used for inline styles in Content Script and potentially elsewhere.
 */
export const getStyleStr = (config: StyleConfig): string => {
    const decor = config.underlineStyle !== 'none' ? `${config.underlineStyle} ${config.underlineColor}` : 'none';
    return `
        color: ${config.color};
        background-color: ${config.backgroundColor};
        font-weight: ${config.isBold ? 'bold' : 'normal'};
        font-style: ${config.isItalic ? 'italic' : 'normal'};
        text-decoration: ${decor};
        text-underline-offset: ${config.underlineOffset};
        font-size: ${config.fontSize};
        cursor: pointer;
        line-height: 1.2;
    `.replace(/\s+/g, ' ');
};
