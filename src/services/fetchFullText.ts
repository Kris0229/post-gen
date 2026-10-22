export interface FetchFullTextResult {
  title?: string;
  text?: string;
  chars?: number;
  error?: string;
}

export const MIN_FULLTEXT_CHARS = 500;

// 被 DataDome／Cloudflare 等擋下時，webhook 可能回傳驗證頁或 JSON，字數常常仍超過門檻
export function looksLikeBotBlock(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      // not JSON, fall through to keyword check
    }
  }
  return trimmed.length < 5000 && /captcha|datadome|cf-chl|just a moment/i.test(trimmed);
}

export async function fetchFullTextViaWebhook(
  webhookUrl: string,
  link: string,
): Promise<FetchFullTextResult> {
  // Apps Script 網頁應用程式不回應 OPTIONS。Content-Type 必須是
  // text/plain（可帶 charset=utf-8），且不能加其他會觸發預檢的 header，
  // 瀏覽器才會把這次 POST 當成 CORS simple request。本文仍是 JSON 字串。
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ url: link }),
  });
  if (!res.ok) {
    return { error: `HTTP ${res.status}` };
  }
  return (await res.json()) as FetchFullTextResult;
}
