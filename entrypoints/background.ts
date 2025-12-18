import { defineBackground } from 'wxt/sandbox';
import { browser } from 'wxt/browser';
import { translateWithEngine } from '../utils/api';
import { RichDictionaryResult, DictionaryMeaningCard, PhraseItem, SynonymItem, RootItem } from '../types';

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
      return String(input);
  };

  /**
   * 深度解析有道词典 JSON API 响应
   */
  const parseYoudaoDeep = (data: any): RichDictionaryResult => {
      const input = data.input || "";
      const ec = data.ec?.word?.[0] || {};
      const collins = data.collins?.collins_entries?.[0] || {};
      const expandEc = data.expand_ec?.word?.[0] || {};

      // 1. 解析义项卡片
      const meanings: DictionaryMeaningCard[] = [];
      
      // 优先从 EC 解析基础义项
      if (ec.trs) {
          ec.trs.forEach((trWrapper: any) => {
              const raw = trWrapper.tr?.[0]?.l?.i?.[0] || "";
              const match = raw.match(/^([a-z]+\.)\s*(.*)/);
              meanings.push({
                  partOfSpeech: match ? match[1] : 'n.',
                  defCn: match ? match[2] : raw,
                  defEn: "",
                  inflections: [],
                  tags: data.ec?.exam_type || [],
                  importance: data.collins?.collins_entries?.[0]?.star || 0,
                  cocaRank: 0,
                  example: "",
                  exampleTrans: ""
              });
          });
      }

      // 2. 解析短语
      const phrases: PhraseItem[] = [];
      if (data.phrs?.phrs) {
          data.phrs.phrs.slice(0, 10).forEach((p: any) => {
              const head = p.phr?.headword?.l?.i;
              const trans = p.phr?.trs?.[0]?.tr?.l?.i || p.phr?.trs?.[0]?.tr?.[0]?.l?.i;
              if (head && trans) phrases.push({ text: head, trans });
          });
      }

      // 3. 解析词根
      const roots: RootItem[] = [];
      if (data.rel_word?.rels) {
          data.rel_word.rels.forEach((r: any) => {
              const pos = r.rel?.pos;
              const words = r.rel?.words?.map((w: any) => ({ text: w.word, trans: w.tran })) || [];
              if (words.length > 0) roots.push({ root: pos || "相关", words });
          });
      }

      // 4. 解析近义词
      const synonyms: SynonymItem[] = [];
      if (data.syno?.synos) {
          data.syno.synos.forEach((s: any) => {
              const ws = s.syno?.ws?.map((w: any) => w.w).join(", ");
              if (ws) synonyms.push({ text: ws, trans: s.syno?.tran || "" });
          });
      }

      return {
          text: input,
          phoneticUs: ec.usphone || "",
          phoneticUk: ec.ukphone || "",
          inflections: ec.wfs?.map((wf: any) => wf.wf?.value).filter(Boolean) || [],
          phrases,
          roots,
          synonyms,
          images: data.pic_dict?.pic?.map((p: any) => p.image).filter(Boolean) || [],
          meanings: meanings.length > 0 ? meanings : [{
              partOfSpeech: 'n.',
              defCn: "暂无详细释义",
              defEn: "",
              inflections: [],
              tags: [],
              importance: 0,
              cocaRank: 0,
              example: "",
              exampleTrans: ""
          }]
      };
  };

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'TRANSLATE_TEXT') {
      (async () => {
        try {
          const text = await translateWithEngine(message.engine, message.text, message.target);
          sendResponse({ success: true, data: { Response: { TargetText: text } } });
        } catch (error: any) {
          console.error("BG Translation Error:", error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true; 
    }

    if (message.action === 'LOOKUP_WORD_RICH') {
      (async () => {
        try {
          const res = await fetch(`https://dict.youdao.com/jsonapi?q=${encodeURIComponent(message.text)}`);
          if (res.ok) {
              const data = await res.json();
              sendResponse({ success: true, data: parseYoudaoDeep(data) });
          } else {
              sendResponse({ success: false, error: "HTTP Error " + res.status });
          }
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
    
    if (message.action === 'SUGGEST_WORD') {
        (async () => {
            try {
                const res = await fetch(`https://dict.youdao.com/suggest?q=${encodeURIComponent(message.text)}&le=en&num=5&doctype=json`);
                const json = await res.json();
                const items = json.data?.entries?.map((e: any) => ({ entry: e.entry, explanation: e.explain })) || [];
                sendResponse({ success: true, data: items });
            } catch (e) {
                sendResponse({ success: false });
            }
        })();
        return true;
    }
  });
});