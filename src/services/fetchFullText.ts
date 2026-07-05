export interface FetchFullTextResult {
  title?: string;
  text?: string;
  chars?: number;
  error?: string;
}

export const MIN_FULLTEXT_CHARS = 500;

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
