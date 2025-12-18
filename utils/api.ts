import { TranslationEngine } from "../types";
import { getHash, getHmac, toHex } from './crypto';
import { GoogleGenAI } from "@google/genai";

/**
 * Gemini 3 翻译实现 (最高优先级推荐)
 * 严格遵守 process.env.API_KEY 获取规范
 */
const callGeminiTranslation = async (text: string, target: string = 'en'): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate the following text into ${target === 'zh' ? 'Chinese' : 'English'}. 
            Return ONLY the translated text, no quotes, no explanation.
            
            Text:
            ${text}`
        });
        return response.text?.trim() || "";
    } catch (e: any) {
        console.error("[Gemini Error]", e);
        throw new Error("Gemini 翻译失败，请检查 API Key 权限。");
    }
};

/**
 * 模拟 Google 翻译网页版
 */
const callGoogleWebSimulation = async (text: string, target: string = 'en'): Promise<string> => {
    const targetLang = target === 'zh' ? 'zh-CN' : 'en';
    const url = `https://translate.google.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    try {
        const response = await fetch(url, { method: "GET" });
        if (!response.ok) throw new Error(`Google 状态码: ${response.status}`);
        const resJson = await response.json();
        return resJson[0].map((item: any) => item[0]).join("");
    } catch (e: any) {
        throw new Error("Google 翻译连接超时。国内环境请使用全局 VPN 模式。");
    }
};

/**
 * 修复后的微软翻译模拟
 */
const callMicrosoftWebSimulation = async (text: string, target: string = 'en'): Promise<string> => {
    const to = target === 'zh' ? 'zh-Hans' : 'en';
    const url = `https://www.bing.com/ttranslatev3?isGab=1&showoriginal=1`;
    
    try {
        const params = new URLSearchParams();
        params.append('fromLang', 'auto-detect');
        params.append('to', to);
        params.append('text', text);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Referer": "https://www.bing.com/translator"
            },
            body: params.toString()
        });

        if (!response.ok) throw new Error(`微软服务器返回错误: ${response.status}`);
        
        const rawText = await response.text();
        if (!rawText || rawText.trim() === "") {
            throw new Error("微软翻译返回了空内容，可能已被反爬虫拦截。");
        }

        try {
            const resJson = JSON.parse(rawText);
            return resJson[0]?.translations[0]?.text || "";
        } catch (e) {
            throw new Error("无法解析微软翻译的结果，格式不正确。");
        }
    } catch (e: any) {
        console.error("[Microsoft Simulation Error]", e);
        throw e;
    }
};

/**
 * 模拟百度翻译
 */
const callBaiduWebSimulation = async (text: string, target: string = 'en'): Promise<string> => {
    const to = target === 'zh' ? 'zh' : 'en';
    const url = `https://fanyi.baidu.com/transapi`;
    try {
        const params = new URLSearchParams({ from: 'auto', to, query: text, source: 'txt' });
        const res = await fetch(url, { method: "POST", body: params });
        if (!res.ok) throw new Error("百度翻译请求失败");
        const json = await res.json();
        return json.data?.[0]?.dst || text;
    } catch (e) {
        throw new Error("百度翻译接口异常。");
    }
};

/**
 * 修复: 补全并导出 DeepL 翻译实现，支持网页模拟和 API 模式
 */
export const callDeepLTranslation = async (engine: TranslationEngine, text: string, target: string = 'en'): Promise<string> => {
    const targetLang = target === 'zh' ? 'ZH' : 'EN';
    
    if (engine.isWebSimulation) {
        // DeepL 网页模拟 API 接口
        const url = `https://www2.deepl.com/jsonrpc`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'LMT_handle_jobs',
                    params: {
                        jobs: [{ kind: 'default', raw_en_sentence: text, raw_en_context_before: [], raw_en_context_after: [], preferred_num_beams: 3 }],
                        lang: { user_preferred_langs: ['EN', 'ZH'], source_lang_computed: 'AUTO', target_lang: targetLang },
                        priority: 1,
                        commonJobParams: { regionalVariant: 'en-US', formality: null },
                        timestamp: Date.now()
                    },
                    id: Math.floor(Math.random() * 100000000)
                })
            });
            const json = await response.json();
            return json.result?.translations?.[0]?.beams?.[0]?.postprocessed_sentence || "";
        } catch (e) {
            throw new Error("DeepL 网页模拟失败，请检查网络或切换到 API 模式。");
        }
    } else {
        if (!engine.apiKey) throw new Error("缺少 DeepL API Key");
        const isFree = engine.apiKey.endsWith(':fx');
        const url = isFree ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate';
        
        const params = new URLSearchParams();
        params.append('auth_key', engine.apiKey);
        params.append('text', text);
        params.append('target_lang', targetLang);

        const response = await fetch(url, { method: 'POST', body: params });
        const json = await response.json();
        return json.translations?.[0]?.text || "";
    }
};

/**
 * 修复: 补全并导出小牛翻译实现
 */
export const callNiuTransTranslation = async (engine: TranslationEngine, text: string, target: string = 'en'): Promise<string> => {
    if (!engine.apiKey) throw new Error("缺少小牛翻译 API Key");
    const to = target === 'zh' ? 'zh' : 'en';
    const url = `https://api.niutrans.com/NiuTransServer/translation?from=auto&to=${to}&apikey=${engine.apiKey}&src_text=${encodeURIComponent(text)}`;
    
    try {
        const response = await fetch(url, { method: 'GET' });
        const json = await response.json();
        if (json.error_code) throw new Error(`小牛翻译错误: ${json.error_msg}`);
        return json.tgt_text || "";
    } catch (e: any) {
        throw new Error(`小牛翻译请求失败: ${e.message}`);
    }
};

/**
 * 腾讯翻译君 V3 实现
 */
export const callTencentTranslation = async (engine: TranslationEngine, sourceText: string, target: string = 'en'): Promise<any> => {
  if (!engine.appId || !engine.secretKey) throw new Error("缺少腾讯翻译 SecretId 或 SecretKey");

  const SECRET_ID = engine.appId;
  const SECRET_KEY = engine.secretKey;
  const ENDPOINT = engine.endpoint || "tmt.tencentcloudapi.com";
  const REGION = engine.region || "ap-shanghai";
  const SERVICE = "tmt";
  const ACTION = "TextTranslate";
  const VERSION = "2018-03-21";

  const now = Math.floor(Date.now() / 1000);
  const date = new Date(now * 1000).toISOString().split('T')[0];

  const payload = JSON.stringify({
    SourceText: sourceText,
    Source: "auto",
    Target: target, 
    ProjectId: Number(engine.projectId) || 0
  });

  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${ENDPOINT}\n`;
  const signedHeaders = "content-type;host";
  const hashedRequestPayload = await getHash(payload);
  
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`;

  const algorithm = "TC3-HMAC-SHA256";
  const credentialScope = `${date}/${SERVICE}/tc3_request`;
  const hashedCanonicalRequest = await getHash(canonicalRequest);
  
  const stringToSign = `${algorithm}\n${now}\n${credentialScope}\n${hashedCanonicalRequest}`;

  const kSecret = new TextEncoder().encode("TC3" + SECRET_KEY);
  const kDate = await getHmac(kSecret, date);
  const kService = await getHmac(kDate, SERVICE);
  const kSigning = await getHmac(kService, "tc3_request");
  const signature = toHex(await getHmac(kSigning, stringToSign));

  const authorization = `${algorithm} Credential=${SECRET_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(`https://${ENDPOINT}`, {
    method: "POST",
    headers: {
      "Authorization": authorization,
      "Content-Type": "application/json; charset=utf-8",
      "Host": ENDPOINT,
      "X-TC-Action": ACTION,
      "X-TC-Version": VERSION,
      "X-TC-Timestamp": now.toString(),
      "X-TC-Region": REGION
    },
    body: payload
  });

  const resJson = await response.json();
  if (resJson.Response && resJson.Response.Error) {
    throw new Error(resJson.Response.Error.Message);
  }
  return resJson;
};

/**
 * 统一分发器
 */
export const translateWithEngine = async (engine: TranslationEngine, text: string, target: string = 'en'): Promise<string> => {
    if (!engine.isEnabled) throw new Error("引擎未启用");
    try {
        switch (engine.id) {
            case 'gemini': return await callGeminiTranslation(text, target);
            case 'google': return await callGoogleWebSimulation(text, target);
            case 'microsoft': return await callMicrosoftWebSimulation(text, target);
            case 'baidu': return await callBaiduWebSimulation(text, target);
            // 修复: 增加对 DeepL 和小牛翻译的支持
            case 'deepl': return await callDeepLTranslation(engine, text, target);
            case 'niutrans': return await callNiuTransTranslation(engine, text, target);
            case 'tencent': {
                const res = await callTencentTranslation(engine, text, target);
                return res.Response?.TargetText || "";
            }
            default: return text;
        }
    } catch (e: any) {
        console.error(`[Engine ${engine.id}] Error:`, e);
        throw e;
    }
};