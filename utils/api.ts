import { TranslationEngine } from "../types";
import { getHash, getHmac, toHex } from './crypto';

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
 * 文档: https://niutrans.com/documents/contents/transapi_text_v2#accessMode
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

    // 格式化为与通用返回一致的结构
    return {
        Response: {
            TargetText: resJson.tgt_text
        }
    };
};

/**
 * 调用 DeepL 翻译
 */
export const callDeepLTranslation = async (engine: TranslationEngine, sourceText: string, target: string = 'en'): Promise<any> => {
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
        throw new Error(`DeepL 错误: ${error.message || response.statusText}`);
    }

    const resJson = await response.json();
    return {
        Response: {
            TargetText: resJson.translations?.[0]?.text || ""
        }
    };
};