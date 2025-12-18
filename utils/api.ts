import { TranslationEngine } from "../types";
import { getHash, getHmac, toHex } from './crypto';

/**
 * 模拟 DeepL 网页版 JSON-RPC 请求 (增强版)
 * 解决 429 Too Many Requests 问题的关键在于更精确的指纹模拟
 */
const callDeepLWebSimulation = async (text: string, target: string = 'en'): Promise<string> => {
    const targetLang = target.toUpperCase() === 'ZH' ? 'ZH' : 'EN';
    
    // 生成符合 DeepL 预期的请求 ID
    const id = Math.floor(Math.random() * 1000000) + 83000000;
    
    // 字符统计逻辑：DeepL 用于混淆时间戳的特征
    const iCount = (text.split('i').length - 1) + (text.split('I').length - 1);
    
    const getTimeStamp = () => {
        const ts = Date.now();
        if (iCount === 0) return ts;
        // 修正后的混淆公式：确保结果是 iCount + 1 的倍数后再进行偏移
        return ts + (iCount + 1) - (ts % (iCount + 1));
    };

    const timestamp = getTimeStamp();

    // 核心 Payload 构造：保持最小化且符合最新网页版行为
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
            timestamp
        },
        id
    };

    // 在扩展背景脚本中，Referer 的缺失是导致 429 的重要原因
    // 尽量模拟真实浏览器的 Header 环境
    const response = await fetch("https://www2.deepl.com/jsonrpc?method=LMT_handle_jobs", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "*/*",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
        },
        body: JSON.stringify(payload)
    });

    if (response.status === 429) {
        throw new Error("DeepL 限制了您的请求频率 (429)。请稍后再试，或尝试切换网络 IP。");
    }

    if (!response.ok) {
        throw new Error(`DeepL 响应异常: ${response.status} ${response.statusText}`);
    }

    const resJson = await response.json();
    if (resJson.error) {
        throw new Error(`DeepL 错误: ${resJson.error.message || '未知'}`);
    }

    // DeepL 返回多个 Beam (结果候选)，我们取第一个最好的
    const translatedText = resJson.result?.translations?.[0]?.beams?.[0]?.sentences?.[0]?.text;
    
    // 如果翻译结果为空，可能是被 DeepL 的验证码截获了
    if (!translatedText) {
        throw new Error("DeepL 返回结果为空，可能需要前往官网完成人机验证。");
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

/**
 * 调用小牛翻译 (NiuTrans)
 */
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
    if (resJson.error_code) {
        throw new Error(`小牛翻译错误: ${resJson.error_msg} (${resJson.error_code})`);
    }

    return {
        Response: {
            TargetText: resJson.tgt_text
        }
    };
};

/**
 * 调用 DeepL 翻译 (支持官方 API 和网页模拟)
 */
export const callDeepLTranslation = async (engine: TranslationEngine, sourceText: string, target: string = 'en'): Promise<any> => {
    // 如果配置为网页模拟模式或未填写 API Key，则使用网页版模拟
    if (engine.isWebSimulation || (!engine.apiKey && !engine.isCustom)) {
        try {
            const text = await callDeepLWebSimulation(sourceText, target);
            return {
                Response: {
                    TargetText: text
                }
            };
        } catch (e: any) {
            // 提供更有意义的错误封装
            throw new Error(`[网页模拟模式] ${e.message}`);
        }
    }

    // 否则执行官方 API 逻辑
    if (!engine.apiKey) throw new Error("缺少 DeepL API Key");

    const isFree = engine.apiKey.endsWith(':fx');
    const endpoint = engine.endpoint || (isFree ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate');

    const params = new URLSearchParams({
        auth_key: engine.apiKey,
        text: sourceText,
        target_lang: target === 'zh' ? 'ZH' : 'EN'
    });

    const response = await fetch(`${endpoint}?${params.toString()}`, {
        method: 'POST'
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`DeepL API 错误: ${error.message || response.statusText}`);
    }

    const resJson = await response.json();
    return {
        Response: {
            TargetText: resJson.translations?.[0]?.text || ""
        }
    };
};