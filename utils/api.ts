import { TranslationEngine } from "../types";
import { getHash, getHmac, toHex } from './crypto';

/**
 * 模拟 Google 翻译网页版 (免 Key 稳定版)
 */
const callGoogleWebSimulation = async (text: string, target: string = 'en'): Promise<string> => {
    const targetLang = target === 'zh' ? 'zh-CN' : 'en';
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Google 翻译异常: ${response.status}`);
    }

    const resJson = await response.json();
    // Google 的返回格式是 [ [[译文, 原文, ...], ...], ... ]
    try {
        return resJson[0].map((item: any) => item[0]).join("");
    } catch (e) {
        throw new Error("解析 Google 翻译结果失败");
    }
};

/**
 * 模拟 DeepL 网页版 JSON-RPC 请求 (硬化版)
 */
const callDeepLWebSimulation = async (text: string, target: string = 'en'): Promise<string> => {
    const targetLang = target.toUpperCase() === 'ZH' ? 'ZH' : 'EN';
    
    // 生成混淆 ID：DeepL 内部有时会校验 ID 的范围
    const id = (Math.floor(Math.random() * 100000) + 123000) * 1000;
    
    // 核心混淆：统计文本中 'i' 的数量
    const iCount = (text.split('i').length - 1) + (text.split('I').length - 1);
    
    const getTimeStamp = () => {
        let ts = Date.now();
        if (iCount !== 0) {
            // 这个偏移量是 DeepL 识别“人”还是“机”的关键特征
            ts = ts - (ts % (iCount + 1)) + (iCount + 1);
        }
        return ts;
    };

    const payload = {
        jsonrpc: "2.0",
        method: "LMT_handle_jobs",
        params: {
            jobs: [{
                kind: "default",
                sentences: [{ text, id: 1, prefix: "" }],
                raw_en_context_before: [],
                raw_en_context_after: []
            }],
            lang: {
                target_lang: targetLang,
                source_lang_user_selected: "auto"
            },
            priority: -1, // 网页版非 Pro 用户通常是 -1
            commonJobParams: {
                browserType: 1,
                // formality: null // 移除冗余字段减少特征
            },
            timestamp: getTimeStamp()
        },
        id
    };

    // 使用主域名尝试，有时 www2 的限制更严
    const response = await fetch("https://www.deepl.com/jsonrpc?method=LMT_handle_jobs", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "*/*",
            "Accept-Language": "zh-CN,zh;q=0.9",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            // 模拟浏览器 Fetch
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "Referer": "https://www.deepl.com/translator"
        },
        body: JSON.stringify(payload)
    });

    if (response.status === 429) {
        throw new Error("DeepL 429 频率超限：您的 IP 或请求特征已被 DeepL 标记。建议切换翻译引擎为 'Google' 或等待 1 小时。");
    }

    if (!response.ok) {
        throw new Error(`DeepL 响应异常: ${response.status}`);
    }

    const resJson = await response.json();
    if (resJson.error) {
        // DeepL 特有的错误码处理
        if (resJson.error.code === -32600) throw new Error("无效的请求指纹，DeepL 算法已更新。");
        throw new Error(`DeepL 错误: ${resJson.error.message || '未知'}`);
    }

    const translatedText = resJson.result?.translations?.[0]?.beams?.[0]?.sentences?.[0]?.text;
    if (!translatedText) {
        throw new Error("无法从 DeepL 获取翻译结果，可能触发布防验证。");
    }

    return translatedText;
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
    if (resJson.error_code) throw new Error(`小牛翻译错误: ${resJson.error_msg}`);
    return { Response: { TargetText: resJson.tgt_text } };
};

/**
 * 统一 DeepL 处理逻辑
 */
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

/**
 * 统一入口逻辑切换
 */
export const translateWithEngine = async (engine: TranslationEngine, text: string, target: string = 'en'): Promise<string> => {
    if (!engine.isEnabled) throw new Error("引擎未启用");

    try {
        switch (engine.id) {
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
            case 'google': {
                return await callGoogleWebSimulation(text, target);
            }
            default: {
                // 如果是自定义 AI 引擎或其他
                return `Simulated: ${text}`;
            }
        }
    } catch (e: any) {
        throw e;
    }
};