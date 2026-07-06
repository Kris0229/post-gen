import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  setArticleState,
  subscribeToArticle,
  updateArticleFullText,
  updateArticleTranslation,
} from '../services/articles';
import { fetchFullTextViaWebhook, MIN_FULLTEXT_CHARS } from '../services/fetchFullText';
import { getConfig } from '../services/settings';
import { OpenAIError, streamChatCompletion } from '../lib/openai';
import { sourceColor } from '../lib/format';
import SaveMaterialModal from '../components/SaveMaterialModal';
import type { Article } from '../types';

type ViewMode = 'original' | 'translation' | 'compare';

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null | undefined>(undefined);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [manualText, setManualText] = useState('');
  const [view, setView] = useState<ViewMode>('original');
  const attempted = useRef(false);

  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState('');
  const [streamingTranslation, setStreamingTranslation] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    attempted.current = false;
    setArticle(undefined);
    const unsubscribe = subscribeToArticle(id, setArticle);
    return unsubscribe;
  }, [id]);

  useEffect(() => {
    if (!article || attempted.current) return;
    if (article.fullText) return;
    attempted.current = true;
    void runFetch(article);
  }, [article]);

  async function runFetch(target: Article) {
    setFetching(true);
    setFetchError('');
    try {
      const config = await getConfig();
      if (!config.fetchWebhookUrl) {
        setFetchError('尚未在設定頁填入抓全文 webhook 網址，請至設定頁設定後重新整理');
        return;
      }
      const result = await fetchFullTextViaWebhook(config.fetchWebhookUrl, target.link);
      const text = result.text ?? '';
      if (result.error || text.length < MIN_FULLTEXT_CHARS) {
        setFetchError(result.error ? `抓取失敗：${result.error}` : `抓取內容過短（僅 ${text.length} 字），可能遇到付費牆`);
        return;
      }
      const shouldAdoptTitle = target.title === target.link && !!result.title;
      await updateArticleFullText(target.id, text, shouldAdoptTitle ? result.title : undefined);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : '抓取失敗');
    } finally {
      setFetching(false);
    }
  }

  async function handleManualSave() {
    if (!article || !manualText.trim()) return;
    await updateArticleFullText(article.id, manualText.trim());
    setFetchError('');
    setManualText('');
  }

  async function handleTranslate() {
    if (!article) return;
    const config = await getConfig();
    if (!config.apiKey) {
      navigate('/settings');
      return;
    }
    setTranslating(true);
    setTranslateError('');
    setStreamingTranslation('');
    setView('translation');
    let acc = '';
    try {
      for await (const chunk of streamChatCompletion({
        apiKey: config.apiKey,
        model: 'gpt-5',
        reasoningEffort: 'minimal',
        messages: [
          { role: 'system', content: config.translatorInstructions },
          { role: 'user', content: article.fullText },
        ],
      })) {
        acc += chunk;
        setStreamingTranslation(acc);
      }
      await updateArticleTranslation(article.id, acc);
    } catch (e) {
      if (acc) {
        await updateArticleTranslation(article.id, acc).catch(() => {});
      }
      if (e instanceof OpenAIError && e.status === 401) {
        navigate('/settings');
        return;
      }
      setTranslateError(e instanceof Error ? e.message : '翻譯失敗');
    } finally {
      setTranslating(false);
    }
  }

  async function handleSkip() {
    if (!article) return;
    await setArticleState(article.id, 'skipped');
    navigate('/');
  }

  if (article === undefined) {
    return <div className="p-4 text-sm text-giants-black/50">載入中…</div>;
  }
  if (article === null) {
    return <div className="p-4 text-sm text-giants-black/50">找不到這篇文章</div>;
  }

  const needsManualInput = !article.fullText && !fetching && fetchError;
  const translationText = translating ? streamingTranslation : article.translation;

  return (
    <div className="p-4 pb-24">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3 text-sm text-giants-black/60"
      >
        ← 返回
      </button>

      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${sourceColor(article.source)}`}>
          {article.source}
        </span>
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-giants-orange underline"
        >
          開啟原文
        </a>
      </div>
      <h1 className="mb-4 text-lg font-bold text-giants-black">{article.title}</h1>

      {fetching && (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 w-full rounded bg-giants-black/10" />
          <div className="h-4 w-full rounded bg-giants-black/10" />
          <div className="h-4 w-3/4 rounded bg-giants-black/10" />
        </div>
      )}

      {needsManualInput && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="mb-2">{fetchError}</p>
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="請貼上文章全文"
            rows={8}
            className="w-full rounded-md border border-giants-black/20 p-2 text-sm text-giants-black"
          />
          <button
            type="button"
            onClick={handleManualSave}
            disabled={!manualText.trim()}
            className="mt-2 rounded-md bg-giants-orange px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            儲存全文
          </button>
        </div>
      )}

      {article.fullText && (
        <>
          <div className="mb-3 flex gap-1 border-b border-giants-black/10">
            {(
              [
                ['original', '原文'],
                ['translation', '譯文'],
                ['compare', '對照'],
              ] as [ViewMode, string][]
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={`px-3 py-2 text-sm font-medium border-b-2 ${
                  view === mode
                    ? 'border-giants-orange text-giants-orange'
                    : 'border-transparent text-giants-black/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {view === 'original' && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-giants-black">{article.fullText}</p>
          )}
          {view === 'translation' && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-giants-black">
              {translationText || (translating ? '' : '尚未翻譯')}
            </p>
          )}
          {view === 'compare' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h2 className="mb-1 text-xs font-bold text-giants-black/50">原文</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-giants-black">{article.fullText}</p>
              </div>
              <div>
                <h2 className="mb-1 text-xs font-bold text-giants-black/50">譯文</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-giants-black">
                  {translationText || (translating ? '' : '尚未翻譯')}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {article.fullText && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-giants-black/10 bg-white p-3">
          {translateError && (
            <div className="mb-2 flex items-center justify-between rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              <span>{translateError}</span>
              <button type="button" onClick={handleTranslate} className="font-medium underline">
                重試
              </button>
            </div>
          )}
          <div className="mx-auto flex max-w-2xl justify-center gap-3">
            {!article.translation && !translating && (
              <button
                type="button"
                onClick={handleSkip}
                className="rounded-md border border-giants-black/20 px-6 py-2 text-sm font-medium text-giants-black"
              >
                略過
              </button>
            )}
            {!article.translation && (
              <button
                type="button"
                onClick={handleTranslate}
                disabled={translating}
                className="rounded-md bg-giants-orange px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {translating ? '翻譯中…' : '翻譯'}
              </button>
            )}
            {article.translation && !translating && (
              <>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="rounded-md border border-giants-black/20 px-6 py-2 text-sm font-medium text-giants-black"
                >
                  略過
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveModal(true)}
                  className="rounded-md bg-giants-orange px-6 py-2 text-sm font-medium text-white"
                >
                  儲存為素材
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showSaveModal && (
        <SaveMaterialModal
          article={article}
          onClose={() => setShowSaveModal(false)}
          onSaved={() => {
            setShowSaveModal(false);
            navigate('/');
          }}
        />
      )}
    </div>
  );
}
