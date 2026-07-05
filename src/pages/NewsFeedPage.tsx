import { useEffect, useMemo, useState } from 'react';
import ArticleRow from '../components/ArticleRow';
import AddArticleModal from '../components/AddArticleModal';
import { setArticleState, subscribeToArticles } from '../services/articles';
import type { Article } from '../types';

export default function NewsFeedPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState('');
  const [showAllStates, setShowAllStates] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToArticles(
      showAllStates,
      (data) => {
        setArticles(data);
        setError('');
      },
      (err) => setError(err.message),
    );
    return unsubscribe;
  }, [showAllStates]);

  const sources = useMemo(
    () => Array.from(new Set(articles.map((a) => a.source))).sort(),
    [articles],
  );

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (selectedSources.length > 0 && !selectedSources.includes(a.source)) return false;
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase();
        if (!a.title.toLowerCase().includes(kw) && !a.aiSummary.toLowerCase().includes(kw)) {
          return false;
        }
      }
      return true;
    });
  }, [articles, selectedSources, keyword]);

  const toggleSource = (source: string) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source],
    );
  };

  return (
    <div className="pb-20">
      <div className="sticky top-[49px] z-[5] space-y-2 border-b border-giants-black/10 bg-white p-3">
        <input
          type="search"
          placeholder="關鍵字搜尋"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full rounded-md border border-giants-black/20 px-3 py-1.5 text-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          {sources.map((source) => (
            <button
              key={source}
              type="button"
              onClick={() => toggleSource(source)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                selectedSources.includes(source)
                  ? 'border-giants-orange bg-giants-orange text-white'
                  : 'border-giants-black/20 text-giants-black/70'
              }`}
            >
              {source}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-1.5 text-xs text-giants-black/70">
            <input
              type="checkbox"
              checked={showAllStates}
              onChange={(e) => setShowAllStates(e.target.checked)}
            />
            顯示已略過/已儲存
          </label>
        </div>
      </div>

      {error && (
        <p className="p-4 text-sm text-red-600">
          讀取失敗：{error}
          {error.includes('index') && '（Firestore 需要建立複合索引，請點擊 Console 錯誤訊息中的連結建立）'}
        </p>
      )}

      {!error && filtered.length === 0 && (
        <p className="p-8 text-center text-sm text-giants-black/50">目前沒有符合條件的新聞</p>
      )}

      <div>
        {filtered.map((article) => (
          <ArticleRow
            key={article.id}
            article={article}
            onSkip={(id) => setArticleState(id, 'skipped')}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        aria-label="手動新增文章"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-giants-orange text-2xl text-white shadow-lg"
      >
        +
      </button>

      {showAddModal && <AddArticleModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
