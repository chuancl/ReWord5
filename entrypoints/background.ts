import { defineBackground } from 'wxt/sandbox';
import { browser } from 'wxt/browser';
import { translateWithEngine } from '../utils/api';
import { dictionariesStorage } from '../utils/storage';
import { RichDictionaryResult, DictionaryMeaningCard, PhraseItem, SynonymItem } from '../types';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    console.log('ContextLingo Extension Installed');
  });

  browser.action.onClicked.addListener(() => {
    const url = (browser.runtime as any).getURL('/options.html');
    browser.tabs.create({ url });
  });

  const safeString = (input: any): string => {
      if (input === null || input === undefined) return '';
      if (typeof input === 'string') return input;
      if (typeof input === 'number') return String(input);
      return '';
  };

  const parseYoudaoDeep = (data: any): RichDictionaryResult => {
      // ... 保持原有解析逻辑 ...
      return { text: data.input || "", phoneticUs: "", phoneticUk: "", inflections: [], phrases: [], roots: [], synonyms: [], images: [], meanings: [] };
  };

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'TRANSLATE_TEXT') {
      // 关键：必须立即执行异步 IIFE 并确保 sendResponse 被调用
      (async () => {
        try {
          const text = await translateWithEngine(message.engine, message.text, message.target);
          sendResponse({ success: true, data: { Response: { TargetText: text } } });
        } catch (error: any) {
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true; // 告知浏览器将异步发送响应
    }

    if (message.action === 'LOOKUP_WORD_RICH') {
      (async () => {
        try {
          const res = await fetch(`https://dict.youdao.com/jsonapi?q=${encodeURIComponent(message.text)}`);
          if (res.ok) {
              const data = await res.json();
              sendResponse({ success: true, data: parseYoudaoDeep(data) });
          } else sendResponse({ success: false });
        } catch (error: any) {
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;
    }

    if (message.action === 'OPEN_OPTIONS_PAGE') {
        const url = (browser.runtime as any).getURL(message.path);
        browser.tabs.create({ url });
        sendResponse({ success: true });
        return true; 
    }
  });
});