import { TranslationEngine } from "../types";
import { getHash, getHmac, toHex } from './crypto';

/**
 * 模拟 Google 翻译网页版 (免 Key 极稳版)
 */
const callGoogleWebSimulation = async (text: string, target: string = 'en'): Promise<string> => {
    const targetLang = target === 'zh' ? 'zh-CN' : 'en';
    // client=gtx 是谷歌翻译在移动端/工具栏环境下的专用标识，对扩展极其友好
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Accept": "*/*",
            "Cache-Control": "no-cache"
        }
    });

    if (!response.ok) {
        throw new Error(`Google 翻译响应异常: ${response.status}`);
    }

    const resJson = await response.json();
    try {
        // Google 的返回格式是多维数组 [ [[译文, 原文, ...], ...], ... ]
        return resJson[0].map((item: any) => item[0]).join("");
    } catch (e) {
        throw new Error("解析 Google 翻译结果失败");
    }
};

/**
 * 模拟 百度翻译网页版 (免 Key 版)
 */
const callBaiduWebSimulation = async (text: string, target: string = 'en'): Promise<string> => {
    const to = target === 'zh' ? 'zh' : 'en';
    
    // 1. 语种探测
    let from = 'auto';
    try {
        const detectRes = await fetch(`https://fanyi.baidu.com/langdetect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `query=${encodeURIComponent(text.substring(0, 50))}`
        });
        const detectJson = await detectRes.json();
        from = detectJson.lan || 'auto';
    } catch (e) { /* ignore */ }

    // 2. 发起翻译 (模拟移动端接口，校验较少)
    const url = `https://fanyi.baidu.com/transapi`;
    const params = new URLSearchParams({
        from: from,
        to: to,
        query: text,
        source: 'txt'
    });

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": "https://fanyi.baidu.com/",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
        },
        body: params.toString()
    });

    if (!response.ok) {
        throw new Error(`百度翻译响应异常: ${response.status}`);
    }

    const resJson = await response.json();
    if (resJson.error) {
        throw new Error(`百度翻译错误码: ${resJson.error}`);
    }

    try {
        // 百度 transapi 返回: { data: [{ dst: '译文', src: '原文' }, ...] }
        return resJson.data.map((item: any) => item.dst).join("\n");
    } catch (e) {
        throw new Error("解析百度翻译结果失败");
    }
};

/**
 * 模拟 DeepL 网页版 JSON-RPC 请求 (最终修复版)
 */
const callDeepLWebSimulation = async (text: string, target: string = 'en'): Promise<string> => {
    const targetLang = target.toUpperCase() === 'ZH' ? 'ZH' : 'EN';
    
    // 生成混淆 ID
    const id = Math.floor(Math.random() * 100000000);
    
    // 统计文本中 'i' 的数量 (DeepL 校验反爬指纹的关键)
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

    // 修复 404：使用 www2 子域名，并在 URL 中显式带上 method 参数
    // 这是 DeepL RPC 网关的硬性要求，否则 POST 请求可能会被重定向为 GET 导致 404
    const response = await fetch("https://www2.deepl.com/jsonrpc?method=LMT_handle_jobs", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "*/*",
            "Cache-Control": "no-cache",
            "Sec-Fetch-Site": "same-site",
        },
        body: JSON.stringify(payload)
    });

    if (response.status === 429) {
        throw new Error("DeepL 频率限制 (429)：您的 IP 请求过多。请切换到 Google 或百度翻译。");
    }

    if (!response.ok) {
        throw new Error(`DeepL 响应异常: ${response.status} ${response.statusText}`);
    }

    const resJson = await response.json();
    if (resJson.error) {
        throw new Error(`DeepL 错误: ${resJson.error.message || '未知'}`);
    }

    const translatedText = resJson.result?.translations?.[0]?.beams?.[0]?.sentences?.[0]?.text;
    if (!translatedText) {
        throw new Error("DeepL 触发了人机验证：请打开 www.deepl.com 完成一次手动翻译验证，再回来使用。");
    }

    return translatedText;
};

/**
 * 调用腾讯翻译君 (TMT)
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
    if (resJson.error_code) throw new Error(`小牛翻译错误: ${resJson.error_msg}`);
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
                // 如果是自定义引擎，根据配置选择调用逻辑
                if (engine.id.startsWith('custom-')) {
                   // 暂时作为模拟处理
                   return `Custom Result: ${text}`;
                }
                return `Simulated: ${text}`;
            }
        }
    } catch (e: any) {
        throw e;
    }
};