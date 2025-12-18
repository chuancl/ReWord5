import { TranslationEngine } from "../types";
import { getHash, getHmac, toHex } from './crypto';
import { GoogleGenAI } from "@google/genai";

/**
 * Gemini 3 翻译实现 (最高优先级推荐)
 * 严格遵守 process.env.API_KEY 获取规范
 */
const callGeminiTranslation = async (text: string, target: string = 'en'): Promise<string> => {
    try {
        // 每次调用创建新实例，确保获取最新的 API Key
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate the following text into ${target === 'zh' ? 'Chinese' : 'English'}. 
            Requirements:
            1. Keep technical terms professional.
            2. Maintain the tone of the original text.
            3. Return ONLY the translation, no explanation, no quotes.
            
            Text to translate:
            ${text}`,
            config: {
                temperature: 0.1,
                topP: 0.95,
            }
        });
        
        // 直接访问 .text 属性获取结果
        return response.text?.trim() || "";
    } catch (e: any) {
        console.error("[Gemini API Error]", e);
        // 如果是因为 API KEY 导致的问题，抛出可辨识的错误
        if (e.message?.includes("API key not valid")) {
            throw new Error("Gemini API Key 无效，请在环境配置中检查。");
        }
        throw new Error("Gemini AI 翻译请求失败。");
    }
};

/**
 * 模拟 Google 翻译网页版
 */
const callGoogleWebSimulation = async (text: string, target: string = 'en'): Promise<string> => {
    const targetLang = target === 'zh' ? 'zh-CN' : 'en';
    const url = `https://translate.google.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "*/*",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            }
        });

        if (!response.ok) throw new Error(`Google 响应异常: ${response.status}`);
        const resJson = await response.json();
        return resJson[0].map((item: any) => item[0]).join("");
    } catch (e: any) {
        console.error("[Google Simulation Error]", e);
        throw new Error("Google 翻译连接超时或被封锁。");
    }
};

/**
 * 模拟 微软翻译网页版 (Bing)
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
                "Referer": "https://www.bing.com/translator",
                "Origin": "https://www.bing.com"
            },
            body: params.toString()
        });

        if (!response.ok) throw new Error(`微软翻译响应异常: ${response.status}`);
        const resJson = await response.json();
        return resJson[0]?.translations[0]?.text || "";
    } catch (e: any) {
        console.error("[Microsoft Simulation Error]", e);
        throw e;
    }
};

/**
 * 腾讯翻译君 (Tencent Cloud API V3 实现)
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
    Target: target === 'zh' ? 'zh' : 'en', 
    ProjectId: Number(engine.projectId) || 0
  });

  const httpRequestMethod = "POST";
  const canonicalUri = "/";
  const canonicalQueryString = "";
  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${ENDPOINT}\n`;
  const signedHeaders = "content-type;host";
  const hashedRequestPayload = await getHash(payload);
  
  const canonicalRequest = 
    httpRequestMethod + "\n" +
    canonicalUri + "\n" +
    canonicalQueryString + "\n" +
    canonicalHeaders + "\n" +
    signedHeaders + "\n" +
    hashedRequestPayload;

  const algorithm = "TC3-HMAC-SHA256";
  const credentialScope = `${date}/${SERVICE}/tc3_request`;
  const hashedCanonicalRequest = await getHash(canonicalRequest);
  
  const stringToSign = 
    algorithm + "\n" +
    now + "\n" +
    credentialScope + "\n" +
    hashedCanonicalRequest;

  const kSecret = new TextEncoder().encode("TC3" + SECRET_KEY);
  const kDate = await getHmac(kSecret, date);
  const kService = await getHmac(kDate, SERVICE);
  const kSigning = await getHmac(kService, "tc3_request");
  const signature = toHex(await getHmac(kSigning, stringToSign));

  const authorization = 
    `${algorithm} ` +
    `Credential=${SECRET_ID}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, ` +
    `Signature=${signature}`;

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
 * 统一翻译入口
 */
export const translateWithEngine = async (engine: TranslationEngine, text: string, target: string = 'en'): Promise<string> => {
    if (!engine.isEnabled) throw new Error("引擎未启用");
    try {
        switch (engine.id) {
            case 'gemini': return await callGeminiTranslation(text, target);
            case 'google': return await callGoogleWebSimulation(text, target);
            case 'microsoft': return await callMicrosoftWebSimulation(text, target);
            case 'baidu': {
                const to = target === 'zh' ? 'zh' : 'en';
                const url = `https://fanyi.baidu.com/transapi`;
                const params = new URLSearchParams({ from: 'auto', to, query: text, source: 'txt' });
                const res = await fetch(url, { method: "POST", body: params });
                const json = await res.json();
                return json.data?.[0]?.dst || text;
            }
            case 'tencent': {
                const res = await callTencentTranslation(engine, text, target);
                return res.Response?.TargetText || "";
            }
            default: return text;
        }
    } catch (e: any) {
        console.error(`[Translation Engine Error: ${engine.id}]`, e);
        throw e;
    }
};