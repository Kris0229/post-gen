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
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: link }),
  });
  if (!res.ok) {
    return { error: `HTTP ${res.status}` };
  }
  return (await res.json()) as FetchFullTextResult;
}
