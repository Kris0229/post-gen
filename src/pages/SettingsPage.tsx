import { useEffect, useState } from 'react';
import { subscribeConfig, updateConfig } from '../services/settings';

export default function SettingsPage() {
  const [fetchWebhookUrl, setFetchWebhookUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeConfig((config) => setFetchWebhookUrl(config.fetchWebhookUrl));
    return unsubscribe;
  }, []);

  async function handleSave() {
    await updateConfig({ fetchWebhookUrl: fetchWebhookUrl.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold text-giants-black">設定</h1>
      <label className="mb-1 block text-sm font-medium text-giants-black">抓全文 Webhook 網址</label>
      <input
        type="url"
        value={fetchWebhookUrl}
        onChange={(e) => setFetchWebhookUrl(e.target.value)}
        placeholder="https://your-n8n.example.com/webhook/fetch-fulltext"
        className="w-full rounded-md border border-giants-black/20 px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={handleSave}
        className="mt-2 rounded-md bg-giants-orange px-4 py-1.5 text-sm font-medium text-white"
      >
        {saved ? '已儲存' : '儲存'}
      </button>
    </div>
  );
}
