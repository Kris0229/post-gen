import { useEffect, useState } from 'react';
import { subscribeConfig, updateConfig } from '../services/settings';
import { getStoredApiKey, setStoredApiKey, testConnection } from '../lib/openai';
import { estimateTokens } from '../lib/format';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const [translatorInstructions, setTranslatorInstructions] = useState('');
  const [blogInstructions, setBlogInstructions] = useState('');
  const [fetchWebhookUrl, setFetchWebhookUrl] = useState('');
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    setApiKey(getStoredApiKey());
    const unsubscribe = subscribeConfig((config) => {
      setTranslatorInstructions(config.translatorInstructions);
      setBlogInstructions(config.blogInstructions);
      setFetchWebhookUrl(config.fetchWebhookUrl);
    });
    return unsubscribe;
  }, []);

  function handleSaveApiKey() {
    setStoredApiKey(apiKey.trim());
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 1500);
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection(apiKey.trim());
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  }

  async function handleSaveConfig() {
    await updateConfig({
      translatorInstructions,
      blogInstructions,
      fetchWebhookUrl: fetchWebhookUrl.trim(),
    });
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 1500);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4 pb-12">
      <h1 className="text-xl font-bold text-giants-black">設定</h1>

      <section>
        <h2 className="mb-2 text-sm font-bold text-giants-black">OpenAI API Key</h2>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          className="w-full rounded-md border border-giants-black/20 px-3 py-2 text-sm"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSaveApiKey}
            className="rounded-md bg-giants-orange px-4 py-1.5 text-sm font-medium text-white"
          >
            {apiKeySaved ? '已儲存' : '儲存'}
          </button>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || !apiKey.trim()}
            className="rounded-md border border-giants-black/20 px-4 py-1.5 text-sm font-medium text-giants-black disabled:opacity-50"
          >
            {testing ? '測試中…' : '連線測試'}
          </button>
          {testResult && (
            <span className={`text-sm ${testResult.ok ? 'text-emerald-600' : 'text-red-600'}`}>
              {testResult.message}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-giants-black/50">API Key 僅存於本機瀏覽器（localStorage），不會上傳到 Firestore。</p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-giants-black">翻譯 System Prompt</h2>
        <textarea
          value={translatorInstructions}
          onChange={(e) => setTranslatorInstructions(e.target.value)}
          rows={8}
          className="w-full rounded-md border border-giants-black/20 p-2 text-sm"
        />
        <p className="mt-1 text-xs text-giants-black/50">
          {translatorInstructions.length} 字／約 {estimateTokens(translatorInstructions)} tokens（粗估）
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-giants-black">部落格文章助手 Instructions</h2>
        <textarea
          value={blogInstructions}
          onChange={(e) => setBlogInstructions(e.target.value)}
          rows={10}
          className="w-full rounded-md border border-giants-black/20 p-2 text-sm"
        />
        <p className="mt-1 text-xs text-giants-black/50">
          {blogInstructions.length} 字／約 {estimateTokens(blogInstructions)} tokens（粗估）
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-giants-black">抓全文 Webhook 網址</h2>
        <input
          type="url"
          value={fetchWebhookUrl}
          onChange={(e) => setFetchWebhookUrl(e.target.value)}
          placeholder="https://your-n8n.example.com/webhook/fetch-fulltext"
          className="w-full rounded-md border border-giants-black/20 px-3 py-2 text-sm"
        />
      </section>

      <button
        type="button"
        onClick={handleSaveConfig}
        className="rounded-md bg-giants-orange px-6 py-2 text-sm font-medium text-white"
      >
        {configSaved ? '已儲存' : '儲存設定'}
      </button>
    </div>
  );
}
