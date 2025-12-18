import { defineBackground } from 'wxt/sandbox';
import { browser } from 'wxt/browser';
import { callTencentTranslation } from '../utils/api';
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

  browser.commands.onCommand.addListener((command) => {
    if (command === 'translate-page') {
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        if (tabs[0]?.id) {
          browser.tabs.sendMessage(tabs[0].id, { action: 'TRIGGER_TRANSLATION' });
        }
      });
    }
  });

  // --- Aggressive Sanitization Helper ---
  const safeString = (input: any): string => {
      if (input === null || input === undefined) return '';
      if (typeof input === 'string') return input;
      if (typeof input === 'number') return String(input);
      
      // If it's an object, try to extract known text-bearing properties
      if (typeof input === 'object') {
          const candidates = [
              input.value, 
              input.text, 
              input.word, 
              input.headword, 
              input.tran,
              input.translation,
              input.def,
              input.content,
              input.sentOrig,
              input.sentTrans,
              input.examType,
              input.i // Youdao weird structure often has value in 'i'
          ];
          for (const c of candidates) {
              if (c && (typeof c === 'string' || typeof c === 'number')) return String(c);
          }
          return ''; // Discard unknown objects
      }
      return '';
  };

  const normalizeTags = (tags: any): string[] => {
      if (!Array.isArray(tags)) return [];
      return tags.map(t => safeString(t)).filter(t => t.trim().length > 0);
  };

  const normalizeForms = (forms: any): string[] => {
      if (!Array.isArray(forms)) return [];
      return forms.map(f => safeString(f)).filter(f => f.trim().length > 0);
  };

  // --- 2. Deep Parse Youdao JSON ---
  const parseYoudaoDeep = (data: any): RichDictionaryResult => {
      
      // 1. Phonetics
      let phoneticUs = "";
      let phoneticUk = "";
      const simpleWord = data.simple?.word?.[0];
      const ecWord = data.ec?.word?.[0];
      
      if (simpleWord) {
          const us = safeString(simpleWord['usphone']);
          const uk = safeString(simpleWord['ukphone']);
          phoneticUs = us ? `/${us}/` : '';
          phoneticUk = uk ? `/${uk}/` : '';
      } else if (ecWord) {
          const us = safeString(ecWord['usphone']);
          const uk = safeString(ecWord['ukphone']);
          phoneticUs = us ? `/${us}/` : '';
          phoneticUk = uk ? `/${uk}/` : '';
      }

      // 2. Public Info: Inflections
      let inflections: string[] = [];
      if (data.collins_primary?.words?.indexforms) {
           inflections = normalizeForms(data.collins_primary.words.indexforms);
      } 
      if (inflections.length === 0 && data.wfs) {
           data.wfs.forEach((item: any) => { 
               if (item.wf) {
                   const val = safeString(item.wf.name || item.wf.value || item.wf);
                   if (val) inflections.push(val);
               }
           });
      }

      // 3. Phrases (phrs)
      const phrases: PhraseItem[] = [];
      if (data.phrs?.phrs && Array.isArray(data.phrs.phrs)) {
          data.phrs.phrs.forEach((item: any) => {
              const text = safeString(item.phr?.headword?.l?.i);
              
              const transList: string[] = [];
              if (item.phr?.trs && Array.isArray(item.phr.trs)) {
                  item.phr.trs.forEach((t: any) => {
                      const trStr = safeString(t.tr?.l?.i);
                      if (trStr) transList.push(trStr);
                  });
              }
              const trans = transList.join('; ');

              if (text && trans) {
                  phrases.push({ text, trans });
              }
          });
      }

      // 4. Roots (rel_word)
      const roots: { root: string; words: { text: string; trans: string }[] }[] = [];
      if (data.rel_word?.rels) {
          data.rel_word.rels.forEach((rel: any) => {
              const rootWords: { text: string; trans: string }[] = [];
              if (rel.rel?.words) {
                   rel.rel.words.forEach((w: any) => {
                       const text = safeString(w.word);
                       const trans = safeString(w.tran);
                       if (text && trans) rootWords.push({ text, trans });
                   });
              }
              if (rootWords.length > 0) {
                  roots.push({ root: safeString(rel.rel?.pos) || 'Root', words: rootWords });
              }
          });
      }

      // 5. Synonyms (syno)
      const synonyms: SynonymItem[] = [];
      if (data.syno?.synos && Array.isArray(data.syno.synos)) {
          data.syno.synos.forEach((group: any) => {
              const meaning = safeString(group.syno?.tran);
              
              if (group.syno?.ws && Array.isArray(group.syno.ws)) {
                  group.syno.ws.forEach((wItem: any) => {
                       const text = safeString(wItem.w);
                       if (text) {
                           synonyms.push({ text, trans: meaning });
                       }
                  });
              }
          });
      }

      // 6. Pictures (pic_dict)
      const images: string[] = [];
      if (data.pic_dict?.pic) {
          data.pic_dict.pic.forEach((p: any) => {
              const url = safeString(p.image);
              if (url) images.push(url);
          });
      }

      // 7. Video (word_video)
      let video = undefined;
      if (data.word_video?.word_videos && Array.isArray(data.word_video.word_videos)) {
          const v = data.word_video.word_videos[0]?.video;
          if (v) {
              const url = safeString(v.url || v.video_url); 
              const cover = safeString(v.cover);
              const title = safeString(v.title);
              if (url) {
                  video = { title: title || '视频讲解', url, cover };
              }
          }
      }

      // Common data
      const globalTags = normalizeTags(data.ec?.exam_type || []); 
      let star = 0;
      if (data.collins?.collins_entries?.[0]?.star) {
          const s = parseInt(String(data.collins.collins_entries[0].star));
          if (!isNaN(s)) star = s;
      }

      // 8. Explicit Parsing for Alternate Views
      const expandEcMeanings: DictionaryMeaningCard[] = [];
      if (data.expand_ec?.word) {
          // Typically an array, iterate
          const words = Array.isArray(data.expand_ec.word) ? data.expand_ec.word : [data.expand_ec.word];
          words.forEach((w: any) => {
              const pos = safeString(w.pos);
              
              if (w.transList && Array.isArray(w.transList)) {
                  w.transList.forEach((tr: any) => {
                      // Logic: expand_ec.word[0].transList[0].trans
                      const defCn = safeString(tr.trans);
                      
                      // Logic: expand_ec.word[0].transList[0].content.sents[0].sentOrig
                      let example = '';
                      let exampleTrans = '';

                      if (tr.content && tr.content.sents && Array.isArray(tr.content.sents) && tr.content.sents.length > 0) {
                          const sentObj = tr.content.sents[0];
                          example = safeString(sentObj.sentOrig);
                          exampleTrans = safeString(sentObj.sentTrans);
                      }
                      
                      // Logic: English meaning empty
                      const defEn = '';

                      if (defCn) {
                          expandEcMeanings.push({
                              partOfSpeech: pos,
                              defCn,
                              defEn,
                              inflections: [],
                              tags: globalTags,
                              importance: 0,
                              cocaRank: 0,
                              example,
                              exampleTrans
                          });
                      }
                  });
              }
          });
      }

      const ecMeanings: DictionaryMeaningCard[] = [];
      // Logic: ec.word[0].trs -> loop -> tr[0].l.i[0]
      if (data.ec?.word) {
           const ecWords = Array.isArray(data.ec.word) ? data.ec.word : [data.ec.word];
           ecWords.forEach((w: any) => {
               if (w.trs && Array.isArray(w.trs)) {
                   w.trs.forEach((trItem: any) => {
                       // Try various structures Youdao uses for TR
                       if (trItem.tr && Array.isArray(trItem.tr)) {
                           const lObj = trItem.tr[0]?.l;
                           if (lObj && lObj.i) {
                               // i can be string or array
                               const raw = Array.isArray(lObj.i) ? lObj.i[0] : lObj.i;
                               const defCn = safeString(raw);
                               if (defCn) {
                                   ecMeanings.push({
                                       partOfSpeech: '', // Often embedded in text like "n. 书"
                                       defCn,
                                       defEn: '',
                                       inflections: [],
                                       tags: globalTags,
                                       importance: 0,
                                       cocaRank: 0,
                                       example: '',
                                       exampleTrans: ''
                                   });
                               }
                           }
                       }
                   });
               }
           });
      }

      // 9. Primary Meanings Logic (Default Strategy: Collins > ExpandEC > EC)
      const meanings: DictionaryMeaningCard[] = [];
      let source: 'collins' | 'expand_ec' | 'ec' = 'ec'; // default fallback

      // Try Collins First
      if (data.collins_primary?.gramcat && Array.isArray(data.collins_primary.gramcat) && data.collins_primary.gramcat.length > 0) {
          data.collins_primary.gramcat.forEach((cat: any) => {
               const pos = safeString(cat.partofspeech);
               const forms = normalizeForms(cat.forms || []); 
               
               if (cat.senses && Array.isArray(cat.senses)) {
                    cat.senses.forEach((sense: any) => {
                        let defCn = safeString(sense.word); 
                        if (!defCn || /^[a-zA-Z\s-]+$/.test(defCn)) {
                            defCn = safeString(sense.chn_tran);
                        }
                        const defEn = safeString(sense.definition);
                        const exObj = sense.examples?.[0];
                        let example = '';
                        let exampleTrans = '';

                        if (exObj) {
                            example = safeString(exObj.example) || safeString(exObj.ex);
                            exampleTrans = safeString(exObj.sense?.word);
                            if (!exampleTrans) {
                                exampleTrans = safeString(exObj.tran);
                            }
                        }

                        if (defCn || defEn) {
                            meanings.push({
                                partOfSpeech: pos,
                                defCn,
                                defEn,
                                inflections: forms.length > 0 ? forms : inflections,
                                tags: globalTags,
                                importance: star,
                                cocaRank: 0, 
                                example,
                                exampleTrans
                            });
                        }
                    });
               }
          });
          if (meanings.length > 0) source = 'collins';
      }

      // Fallback to ExpandEC if no Collins
      if (meanings.length === 0 && expandEcMeanings.length > 0) {
          meanings.push(...expandEcMeanings);
          source = 'expand_ec';
      }
      
      // Fallback to EC if no ExpandEC
      if (meanings.length === 0 && ecMeanings.length > 0) {
          meanings.push(...ecMeanings);
          source = 'ec';
      }

      return {
          text: safeString(data.simple?.word?.[0]?.['return-phrase'] || data.input),
          phoneticUs,
          phoneticUk,
          inflections,
          phrases,
          roots,
          synonyms,
          images,
          video,
          meanings,
          expandEcMeanings,
          ecMeanings,
          source
      };
  };

  const fetchAndParse = async (word: string): Promise<RichDictionaryResult | null> => {
      const dictionaries = await dictionariesStorage.getValue();
      const youdao = dictionaries.find(d => d.id === 'youdao' && d.isEnabled) || dictionaries.find(d => d.id === 'youdao');

      if (youdao) {
          try {
              const res = await fetch(`https://dict.youdao.com/jsonapi?q=${encodeURIComponent(word)}`);
              if (res.ok) {
                  const data = await res.json();
                  return parseYoudaoDeep(data);
              }
          } catch (e) {
              console.warn(`Dict Youdao error`, e);
          }
      }
      return null;
  };

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'TRANSLATE_TEXT') {
      (async () => {
        try {
          if (message.engine.id === 'tencent') {
             const result = await callTencentTranslation(message.engine, message.text, message.target);
             sendResponse({ success: true, data: result });
          } else {
             sendResponse({ success: true, data: { Response: { TargetText: `Simulated: ${message.text}` } } });
          }
        } catch (error: any) {
          sendResponse({ success: false, error: error.message || String(error) });
        }
      })();
      return true; 
    }

    if (message.action === 'LOOKUP_WORD_RICH') {
      (async () => {
        try {
          const result = await fetchAndParse(message.text);
          if (result) {
              sendResponse({ success: true, data: result });
          } else {
              sendResponse({ success: false, error: "No data found" });
          }
        } catch (error: any) {
          console.error('Lookup Error:', error);
          sendResponse({ success: false, error: error.message || String(error) });
        }
      })();
      return true;
    }

    if (message.action === 'SUGGEST_WORD') {
      (async () => {
          try {
            const response = await fetch(`https://dict.youdao.com/suggest?num=5&ver=3.0&doctype=json&cache=false&le=en&q=${encodeURIComponent(message.text)}`);
            if (response.ok) {
                const data = await response.json();
                const mappedEntries = data.data?.entries?.map((item: any) => ({
                    entry: item.entry,
                    explanation: item.explain
                })) || [];
                
                sendResponse({ success: true, data: mappedEntries });
            } else {
                sendResponse({ success: false, data: [] });
            }
          } catch (error: any) {
            console.error('Suggest Error:', error);
            sendResponse({ success: false, error: error.message || String(error) });
          }
      })();
      return true;
    }

    // New handler to open options page securely
    if (message.action === 'OPEN_OPTIONS_PAGE') {
        const url = (browser.runtime as any).getURL(message.path);
        browser.tabs.create({ url });
        sendResponse({ success: true });
        return true; 
    }
  });
});