import { TranslationEngine } from "../types";
import { getHash, getHmac, toHex } from './crypto';

/**
 * 模拟 Google 翻译网页版 (多域名兼容版)
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

        if (!response.ok) {
            throw new Error(`Google 响应异常: ${response.status}`);
        }

        const resJson = await response.json();
        return resJson[0].map((item: any) => item[0]).join("");
    } catch (e: any) {
        if (e.name === 'TypeError' || e.message.includes('fetch')) {
            throw new Error("Google 翻译连接超时。请检查：1. 是否开启了 VPN；2. 翻墙工具是否配置了全局模式。");
        }
        throw e;
    }
};

/**
 * 模拟 微软翻译网页版 (Bing Translator)
 * 修复 401 错误：使用 Bing 官网内部接口而非 Azure 接口
 */
const callMicrosoftWebSimulation = async (text: string, target: string = 'en'): Promise<string> => {
    const to = target === 'zh' ? 'zh-Hans' : 'en';
    // 关键修复：使用 Bing 官网的 translatev3 接口
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

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error("微软翻译模拟请求被拒绝。可能是 Bing 增加了频率限制或校验，请尝试更换网络环境。");
            }
            throw new Error(`微软翻译响应异常: ${response.status}`);
        }

        const resJson = await response.json();
        // Bing 返回的是一个数组 [{ translations: [{ text: "..." }] }]
        return resJson[0]?.translations[0]?.text || "";
    } catch (e: any) {
        console.error("[Microsoft Simulation Error]", e);
        throw e;
    }
};

/**
 * 模拟 百度翻译网页版 (修复 1022 错误版)
 */
const callBaiduWebSimulation = async (text: string, target: string = 'en'): Promise<string> => {
    const to = target === 'zh' ? 'zh' : 'en';
    const url = `https://fanyi.baidu.com/transapi`;
    
    const params = new URLSearchParams();
    params.append('from', 'auto');
    params.append('to', to);
    params.append('query', text);
    params.append('source', 'txt');

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1",
            "Referer": "https://fanyi.baidu.com/",
            "Origin": "https://fanyi.baidu.com"
        },
        body: params.toString()
    });

    if (!response.ok) {
        throw new Error(`百度响应异常: ${response.status}`);
    }

    const resJson = await response.json();
    if (resJson.error) {
        if (resJson.error === 1022) {
            throw new Error("百度翻译返回 1022 (参数错误)。可能是请求过快，请暂时改用 Google 或微软翻译。");
        }
        throw new Error(`百度翻译错误: ${resJson.error}`);
    }

    try {
        if (resJson.data && Array.isArray(resJson.data)) {
            return resJson.data.map((item: any) => item.dst).join("\n");
        }
        throw new Error("百度返回数据格式不正确");
    } catch (e) {
        throw new Error("解析百度翻译结果失败");
    }
};

/**
 * 模拟 DeepL 网页版 JSON-RPC 请求
 */
const callDeepLWebSimulation = async (text: string, target: string = 'en'): Promise<string> => {
    const targetLang = target.toUpperCase() === 'ZH' ? 'ZH' : 'EN';
    const id = Math.floor(Math.random() * 100000000);
    const iCount = (text.split('i').length - 1) + (text.split('I').length - 1);
    
    const getTimeStamp = () => {
        const ts = Date.now();
        if (iCount === 0) return ts;
        return ts - (ts % (iCount + 1)) + (iCount + 1);
    };

    const payload = {
        jsonrpc: "2.0",
        method: "LMT_handle_jobs",
        params: {
            jobs: [{
                kind: "default",
                sentences: [{ text, id: 0, prefix: "" }],
                raw_en_context_before: [],
                raw_en_context_after: []
            }],
            lang: {
                target_lang: targetLang,
                source_lang_user_selected: "auto"
            },
            priority: 1,
            commonJobParams: {
                browserType: 1,
                formality: null
            },
            timestamp: getTimeStamp()
        },
        id
    };

    try {
        const response = await fetch("https://www2.deepl.com/jsonrpc?method=LMT_handle_jobs", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "*/*",
                "Cache-Control": "no-cache"
            },
            body: JSON.stringify(payload)
        });

        if (response.status === 429) {
            throw new Error("DeepL 429 频率超限。请改用 Google 或微软翻译。");
        }

        if (!response.ok) {
            throw new Error(`DeepL 响应异常: ${response.status}`);
        }

        const resJson = await response.json();
        if (resJson.error) {
            throw new Error(`DeepL 错误: ${resJson.error.message || '未知'}`);
        }

        const translatedText = resJson.result?.translations?.[0]?.beams?.[0]?.sentences?.[0]?.text;
        if (!translatedText) {
            throw new Error("DeepL 需要人机验证：请前往 DeepL 官网手动翻译一次后再尝试。");
        }

        return translatedText;
    } catch (e: any) {
        if (e.name === 'TypeError') {
            throw new Error("DeepL 无法访问，可能被防火墙拦截，请检查 VPN 设置。");
        }
        throw e;
    }
};

/**
 * 统一翻译入口
 */
export const callTencentTranslation = async (engine: TranslationEngine, sourceText: string = 'Hello', target: string = 'en'): Promise<any> => {
  if (!engine.appId || !engine.secretKey) {
    throw new Error("缺少腾讯翻译 SecretId 或 SecretKey");
  }

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

export const callNiuTransTranslation = async (engine: TranslationEngine, sourceText: string, target: string = 'en'): Promise<any> => {
    if (!engine.apiKey) throw new Error("缺少小牛翻译 API Key");
    const endpoint = engine.endpoint || 'https://api.niutrans.com/NiuTransServer/translation';
    const params = new URLSearchParams({
        from: 'auto',
        to: target === 'zh' ? 'zh' : 'en',
        apikey: engine.apiKey,
        src_text: sourceText
    });
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });
    const resJson = await response.json();
    if (resJson.error_code) throw new Error(`小牛翻译错误: ${resJson.error_code} - ${resJson.error_msg}`);
    return { Response: { TargetText: resJson.tgt_text } };
};

export const callDeepLTranslation = async (engine: TranslationEngine, sourceText: string, target: string = 'en'): Promise<any> => {
    if (engine.isWebSimulation || (!engine.apiKey && !engine.isCustom)) {
        const text = await callDeepLWebSimulation(sourceText, target);
        return { Response: { TargetText: text } };
    }
    if (!engine.apiKey) throw new Error("缺少 DeepL API Key");
    const isFree = engine.apiKey.endsWith(':fx');
    const endpoint = engine.endpoint || (isFree ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate');
    const params = new URLSearchParams({
        auth_key: engine.apiKey,
        text: sourceText,
        target_lang: target === 'zh' ? 'ZH' : 'EN'
    });
    const response = await fetch(`${endpoint}?${params.toString()}`, { method: 'POST' });
    if (!response.ok) throw new Error(`DeepL API 错误: ${response.statusText}`);
    const resJson = await response.json();
    return { Response: { TargetText: resJson.translations?.[0]?.text || "" } };
};

export const translateWithEngine = async (engine: TranslationEngine, text: string, target: string = 'en'): Promise<string> => {
    if (!engine.isEnabled) throw new Error("引擎未启用");
    try {
        switch (engine.id) {
            case 'google': {
                return await callGoogleWebSimulation(text, target);
            }
            case 'microsoft': {
                return await callMicrosoftWebSimulation(text, target);
            }
            case 'baidu': {
                return await callBaiduWebSimulation(text, target);
            }
            case 'tencent': {
                const res = await callTencentTranslation(engine, text, target);
                return res.Response?.TargetText || "";
            }
            case 'niutrans': {
                const res = await callNiuTransTranslation(engine, text, target);
                return res.Response?.TargetText || "";
            }
            case 'deepl': {
                const res = await callDeepLTranslation(engine, text, target);
                return res.Response?.TargetText || "";
            }
            default: {
                // 如果是用户添加的自定义引擎且没有匹配 ID，默认走 AI 或 Simulated
                return `Simulated: ${text}`;
            }
        }
    } catch (e: any) {
        throw e;
    }
};