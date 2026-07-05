import { useEffect, useState } from 'react';
import { addMaterial, getAllTags } from '../services/materials';
import { setArticleState } from '../services/articles';
import type { Article } from '../types';

interface SaveMaterialModalProps {
  article: Article;
  onClose: () => void;
  onSaved: () => void;
}

export default function SaveMaterialModal({ article, onClose, onSaved }: SaveMaterialModalProps) {
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllTags().then(setExistingTags);
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const addNewTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
    }
    setNewTag('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await addMaterial({
        articleId: article.id,
        title: article.title,
        link: article.link,
        source: article.source,
        originalText: article.fullText,
        translation: article.translation,
        tags: selectedTags,
        note: note.trim(),
      });
      await setArticleState(article.id, 'saved');
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-xl bg-white p-4 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-lg font-bold text-giants-black">儲存為素材</h2>

        <label className="mb-1 block text-sm font-medium text-giants-black">標籤</label>
        {existingTags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {existingTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                  selectedTags.includes(tag)
                    ? 'border-giants-orange bg-giants-orange text-white'
                    : 'border-giants-black/20 text-giants-black/70'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addNewTag();
              }
            }}
            placeholder="新增標籤"
            className="flex-1 rounded-md border border-giants-black/20 px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={addNewTag}
            className="rounded-md border border-giants-black/20 px-3 py-1.5 text-sm font-medium text-giants-black"
          >
            新增
          </button>
        </div>
        {selectedTags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-giants-orange px-2.5 py-1 text-xs font-medium text-white"
              >
                {tag}
                <button type="button" onClick={() => toggleTag(tag)} aria-label={`移除標籤 ${tag}`}>
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <label className="mb-1 block text-sm font-medium text-giants-black">備註（選填）</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="mb-4 w-full rounded-md border border-giants-black/20 px-3 py-2 text-sm"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-medium text-giants-black/70"
          >
            取消
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded-md bg-giants-orange px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? '儲存中…' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  );
}
