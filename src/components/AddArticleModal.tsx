import { useState } from 'react';
import { addManualArticle, isLinkDuplicate } from '../services/articles';

interface AddArticleModalProps {
  onClose: () => void;
}

export default function AddArticleModal({ onClose }: AddArticleModalProps) {
  const [link, setLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const trimmed = link.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError('');
    try {
      if (await isLinkDuplicate(trimmed)) {
        setError('這個網址已經加過了');
        return;
      }
      await addManualArticle(trimmed);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '新增失敗');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-xl bg-white p-4 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-lg font-bold text-giants-black">手動新增文章</h2>
        <input
          autoFocus
          type="url"
          placeholder="貼上文章網址"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full rounded-md border border-giants-black/20 px-3 py-2 text-sm"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-medium text-giants-black/70"
          >
            取消
          </button>
          <button
            type="button"
            disabled={submitting || !link.trim()}
            onClick={handleSubmit}
            className="rounded-md bg-giants-orange px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? '新增中…' : '新增'}
          </button>
        </div>
      </div>
    </div>
  );
}
