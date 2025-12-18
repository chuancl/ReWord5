// Helper functions for Tencent Cloud API V3 Signature using Web Crypto API

export async function getHash(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function getHmac(key: string | Uint8Array, message: string): Promise<Uint8Array> {
  const keyData = typeof key === 'string' ? new TextEncoder().encode(key) : key;
  const msgData = new TextEncoder().encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  return new Uint8Array(signature);
}

export function toHex(buffer: Uint8Array): string {
  return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
}
