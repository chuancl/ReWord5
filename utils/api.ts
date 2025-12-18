
import { TranslationEngine } from "../types";
import { getHash, getHmac, toHex } from './crypto';

export interface TencentTMTParams {
  SourceText: string;
  Source: string;
  Target: string;
  ProjectId: number;
}

/**
 * Call Tencent Cloud TMT API (TextTranslate)
 * Doc: https://cloud.tencent.com/document/api/551/15619
 */
export const callTencentTranslation = async (engine: TranslationEngine, sourceText: string = 'Hello', target: string = 'en'): Promise<any> => {
  if (!engine.appId || !engine.secretKey) {
    throw new Error("Missing SecretId or SecretKey");
  }

  const SECRET_ID = engine.appId; // In our UI, appId maps to SecretId for Tencent
  const SECRET_KEY = engine.secretKey;
  const ENDPOINT = engine.endpoint || "tmt.tencentcloudapi.com";
  const REGION = engine.region || "ap-shanghai";
  const SERVICE = "tmt";
  const ACTION = "TextTranslate";
  const VERSION = "2018-03-21";

  // 1. Time params
  const now = Math.floor(Date.now() / 1000);
  const date = new Date(now * 1000).toISOString().split('T')[0]; // UTC Date YYYY-MM-DD

  // 2. Payload
  const payloadObj = {
    SourceText: sourceText,
    Source: "auto",
    Target: target, 
    ProjectId: Number(engine.projectId) || 0
  };
  const payload = JSON.stringify(payloadObj);

  // 3. Canonical Request
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

  // 4. String to Sign
  const algorithm = "TC3-HMAC-SHA256";
  const credentialScope = `${date}/${SERVICE}/tc3_request`;
  const hashedCanonicalRequest = await getHash(canonicalRequest);
  
  const stringToSign = 
    algorithm + "\n" +
    now + "\n" +
    credentialScope + "\n" +
    hashedCanonicalRequest;

  // 5. Signature
  const kSecret = new TextEncoder().encode("TC3" + SECRET_KEY);
  const kDate = await getHmac(kSecret, date);
  const kService = await getHmac(kDate, SERVICE);
  const kSigning = await getHmac(kService, "tc3_request");
  const signature = toHex(await getHmac(kSigning, stringToSign));

  // 6. Authorization Header
  const authorization = 
    `${algorithm} ` +
    `Credential=${SECRET_ID}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, ` +
    `Signature=${signature}`;

  // 7. Execute Request
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

// Placeholder for legacy support if needed
export const prepareTencentParams = (engine: TranslationEngine, sourceText: string) => {
    return {
        message: "Use callTencentTranslation for real requests"
    };
};
