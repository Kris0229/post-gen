const API_KEY_STORAGE_KEY = 'openai_api_key';
const CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';

export type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high';

export interface ChatMessageInput {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OpenAIError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getStoredApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE_KEY) ?? '';
}

export function setStoredApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

export async function* streamChatCompletion(opts: {
  apiKey: string;
  model: string;
  reasoningEffort?: ReasoningEffort;
  messages: ChatMessageInput[];
  signal?: AbortSignal;
}): AsyncGenerator<string, void, unknown> {
  const res = await fetch(CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model,
      stream: true,
      messages: opts.messages,
      ...(opts.reasoningEffort ? { reasoning_effort: opts.reasoningEffort } : {}),
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.error?.message ?? message;
    } catch {
      // ignore parse failure, keep default message
    }
    throw new OpenAIError(res.status, message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') return;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // ignore malformed SSE chunk
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function testConnection(apiKey: string): Promise<{ ok: boolean; message: string }> {
  try {
    for await (const chunk of streamChatCompletion({
      apiKey,
      model: 'gpt-5',
      reasoningEffort: 'minimal',
      messages: [{ role: 'user', content: 'ping' }],
    })) {
      if (chunk) break;
    }
    return { ok: true, message: '連線成功' };
  } catch (e) {
    if (e instanceof OpenAIError) {
      if (e.status === 401) return { ok: false, message: 'API Key 無效（401 Unauthorized）' };
      return { ok: false, message: `連線失敗（${e.status}）：${e.message}` };
    }
    return { ok: false, message: e instanceof Error ? e.message : '連線失敗' };
  }
}
